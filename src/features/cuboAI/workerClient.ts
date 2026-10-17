import type { LocalModel, ModelFactory } from './session';

// One worker owns all model/GPU state. Termination also cancels an unfinished download.
export function createWorkerFactory(modelId: string): { load: ModelFactory; stop: () => void } {
  let worker: Worker | null = null;
  let sequence = 0;
  let stopped = false;
  const pending = new Map<number, { resolve: (value: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>; progress?: (value: number, text: string) => void }>();
  function stop() {
    stopped = true;
    worker?.terminate(); worker = null;
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(Error('Cubo Assistant stopped. Reopen it to try again.')); }
    pending.clear();
  }
  function request(kind: 'load' | 'reply', payload: object, progress?: (value: number, text: string) => void): Promise<string> {
    if (!worker || stopped) return Promise.reject(Error('Cubo Assistant worker is unavailable.'));
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { reject(Error(kind === 'load' ? 'Model loading timed out. Check your connection and try again.' : 'The device took too long to answer. Reopen Cubo Assistant and try a shorter question.')); stop(); }, kind === 'load' ? 600000 : 90000);
      pending.set(id, { resolve, reject, timer, progress }); worker!.postMessage({ id, kind, ...payload });
    });
  }
  const load: ModelFactory = async progress => {
    if (stopped) throw Error('Cubo Assistant session closed.');
    if (!window.isSecureContext || !('gpu' in navigator) || typeof Worker === 'undefined') throw Error('Cubo Assistant requires a secure browser with WebGPU and worker support.');
    worker = new Worker('/cubo-ai-worker.js?v=2', { type: 'module', name: 'Cubo Assistant' });
    worker.onmessage = ({ data }) => {
      const active = pending.get(data.id); if (!active) return;
      if (typeof data.progress === 'number') { active.progress?.(Math.max(0, Math.min(1, data.progress)), String(data.text)); return; }
      clearTimeout(active.timer); pending.delete(data.id);
      if (data.error) active.reject(Error(String(data.error))); else active.resolve(String(data.result ?? ''));
    };
    worker.onerror = event => { event.preventDefault(); for (const active of pending.values()) active.reject(Error('The on-device model stopped unexpectedly. Reopen Cubo Assistant to retry.')); stop(); };
    try { await request('load', { model: modelId }, progress); }
    catch (cause) { stop(); throw cause; }
    const model: LocalModel = { reply: messages => request('reply', { messages }), dispose: stop };
    return model;
  };
  return { load, stop };
}
