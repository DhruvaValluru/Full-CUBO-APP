import type { LocalModel, ModelFactory, ModelMessage } from './session';

/** Structural adapter: inject the chosen/pinned @mlc-ai/web-llm module at integration time. */
export interface WebLLMEngine {
  reload(model: string): Promise<unknown>;
  resetChat(): Promise<unknown>;
  interruptGenerate(): void;
  unload(): Promise<unknown>;
  chat: { completions: { create(request: { messages: ModelMessage[]; stream: false; max_tokens: number; temperature: number }): Promise<{ choices: { message: { content: string | null } }[] }> } };
}
export type WebLLMModule = { MLCEngine: new (options: { initProgressCallback: (report: { progress: number; text: string }) => void }) => WebLLMEngine };
export function createWebLLMFactory(importModule: () => Promise<WebLLMModule>, modelId: string): ModelFactory {
  return async progress => {
    if (typeof window === 'undefined' || !window.isSecureContext || !('gpu' in navigator)) throw Error('Cubo Assistant needs HTTPS and a WebGPU-capable browser.');
    if (!modelId.trim()) throw Error('A tested Cubo Assistant model has not been configured yet.');
    const module = await importModule();
    const engine = new module.MLCEngine({ initProgressCallback: r => progress(Math.max(0, Math.min(1, r.progress)), r.text) });
    try { await engine.reload(modelId); } catch (error) { await engine.unload().catch(() => {}); throw error; }
    let closed = false;
    const model: LocalModel = {
      async reply(messages) {
        if (closed) throw Error('Cubo Assistant session closed.');
        await engine.resetChat();
        const response = await engine.chat.completions.create({ messages, stream: false, max_tokens: 256, temperature: .5 });
        if (closed) throw Error('Cubo Assistant session closed.');
        return response.choices[0]?.message.content ?? '';
      },
      async dispose() { closed = true; engine.interruptGenerate(); await engine.unload(); },
    };
    return model;
  };
}
