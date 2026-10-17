import { MLCEngine, hasModelInCache } from '@mlc-ai/web-llm';
import type { ModelMessage } from './session';

let engine: MLCEngine | null = null;
let busy = false;
const scope = self as unknown as { onmessage: ((event: MessageEvent) => void) | null; postMessage: (value: unknown) => void };
scope.onmessage = async ({ data }: MessageEvent<{ id: number; kind: 'load' | 'reply'; model?: string; messages?: ModelMessage[] }>) => {
  const { id, kind } = data;
  if (busy) { scope.postMessage({ id, error: 'Cubo Assistant is busy.' }); return; }
  busy = true;
  try {
    if (kind === 'load') {
      if (!data.model) throw Error('No model selected.');
      const cached = await hasModelInCache(data.model).catch(() => false);
      scope.postMessage({ id, progress: 0, text: cached ? 'Loading saved model into memory' : 'Downloading model files; keep this screen open' });
      engine = new MLCEngine({ initProgressCallback: report => scope.postMessage({ id, progress: report.progress, text: (cached ? 'Loading saved model · ' : '') + report.text }) });
      await engine.reload(data.model, { context_window_size: 2048 });
      scope.postMessage({ id, result: 'ready' });
    } else {
      if (!engine) throw Error('Load Cubo Assistant first.');
      await engine.resetChat();
      const response = await engine.chat.completions.create({ messages: data.messages ?? [], stream: false, max_tokens: 128, temperature: .5 });
      scope.postMessage({ id, result: response.choices[0]?.message.content ?? '' });
    }
  } catch (cause) {
    scope.postMessage({ id, error: cause instanceof Error ? cause.message : 'On-device AI could not finish. Try a shorter message.' });
  } finally { busy = false; }
};
