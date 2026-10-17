import * as Speech from 'expo-speech';

/** Expo Go-supported speech; iPhone silent mode and volume still apply. */
export class AttentionAudio {
  private generation = 0;
  private finish: ((error?: Error) => void) | null = null;
  private disposed = false;
  speak(text: string): Promise<void> {
    this.stop();
    if (this.disposed) return Promise.reject(Error('Audio stopped.'));
    const generation = this.generation;
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;
      const finish = (error?: Error) => {
        if (generation !== this.generation) return;
        clearTimeout(timer); this.finish = null;
        error ? reject(error) : resolve();
      };
      this.finish = finish;
      timer = setTimeout(() => { finish(Error('Audio did not finish. Check silent mode and volume.')); void Speech.stop().catch(() => {}); }, 12000);
      // stop() is asynchronous on native; never start a stale prompt after leaving.
      void Speech.stop().then(() => {
        if (generation !== this.generation || this.disposed) return;
        Speech.speak(text, { language: 'en-US', rate: .95, volume: 1,
          onDone: () => finish(), onError: () => finish(Error('Audio could not play. Check silent mode and volume.')),
          onStopped: () => finish(Error('Audio stopped.')) });
      }).catch(() => finish(Error('Audio could not start. Try Hear alert.')));
    });
  }
  stop() {
    this.finish?.(Error('Audio stopped.'));
    this.generation++;
    void Speech.stop().catch(() => {});
  }
  dispose() { this.disposed = true; this.stop(); }
}
