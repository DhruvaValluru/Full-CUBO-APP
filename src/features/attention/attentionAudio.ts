/** Short device speech only: no microphone, model, API key or uploaded camera data. */
export class AttentionAudio {
  private current: SpeechSynthesisUtterance | null = null;
  private finish: ((error?: Error) => void) | null = null;
  private disposed = false;
  speak(text: string): Promise<void> {
    this.stop();
    if (this.disposed || typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return Promise.reject(Error('Spoken alerts are unavailable on this browser.'));
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.current = utterance;
      let timer: ReturnType<typeof setTimeout>;
      const finish = (error?: Error) => {
        if (this.current !== utterance) return;
        clearTimeout(timer); utterance.onend = null; utterance.onerror = null;
        this.current = null; this.finish = null;
        if (error) { window.speechSynthesis.cancel(); reject(error); } else resolve();
      };
      this.finish = finish;
      utterance.lang = 'en-US'; utterance.volume = 1; utterance.rate = .95;
      utterance.onend = () => finish();
      utterance.onerror = () => finish(Error('Audio could not play. Check volume and try Hear alert.'));
      timer = setTimeout(() => finish(Error('Audio did not finish. Check volume and try Hear alert.')), 12000);
      try { window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance); }
      catch { finish(Error('Audio could not start. Try Hear alert.')); }
    });
  }
  stop() {
    if (!this.current) return;
    this.finish?.(Error('Audio stopped.'));
  }
  dispose() { this.disposed = true; this.stop(); }
}
