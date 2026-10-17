import { selectedVoice } from './voicePreference';
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; abort(): void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

/** Push-to-talk only. Transcript is returned to the composer, never submitted automatically. */
export class CuboAIVoice {
  private recognition: Recognition | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private utterance: SpeechSynthesisUtterance | null = null;
  constructor(private allowed: () => boolean, private preferredVoice: () => string = () => '') {}
  supported() {
    if (typeof window === 'undefined') return { input: false, output: false };
    const browser = window as SpeechWindow;
    return { input: Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition), output: 'speechSynthesis' in browser };
  }
  listen(consentedToProviderProcessing: boolean, transcript: (text: string) => void, error: (message: string) => void, ended: () => void = () => {}) {
    if (this.disposed || !this.allowed()) throw Error('Voice is unavailable for this session.');
    if (!consentedToProviderProcessing) throw Error('Voice recognition may send audio to your browser provider. Confirm before enabling it.');
    this.stop();
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) throw Error('Voice input is not supported here. Type your message instead.');
    const recognition = new Constructor(); this.recognition = recognition;
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = event => {
      const text = (event.results[0]?.[0]?.transcript ?? '').slice(0, 2000);
      this.stop();
      if (!this.disposed && this.allowed()) transcript(text);
      ended();
    };
    recognition.onerror = event => { if (!this.disposed && this.allowed()) error(`Voice input stopped (${event.error}). You can type instead.`); this.stop(); ended(); };
    recognition.onend = () => { this.stop(); ended(); };
    try { recognition.start(); } catch (cause) { this.stop(); throw cause; }
    this.timer = setTimeout(() => { this.stop(); ended(); }, 30000);
  }
  speak(text: string, completed?: () => void, failed?: () => void) {
    if (this.disposed || !this.allowed()) throw Error('Voice is unavailable for this session.');
    this.stop();
    if (!this.supported().output) throw Error('Read-aloud is not supported here.');
    // Drive activation speaks from the initial tap; subsequent replies reuse that session.
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 8000));
    this.utterance = utterance;
    const finish = (callback?: () => void) => {
      if (this.utterance !== utterance) return;
      if (this.timer) clearTimeout(this.timer); this.timer = null;
      this.utterance = null;
      utterance.onstart = null; utterance.onend = null; utterance.onerror = null;
      if (!this.disposed && this.allowed()) callback?.();
    };
    const timeout = () => { this.stop(); if (!this.disposed && this.allowed()) failed?.(); };
    utterance.onend = () => finish(completed);
    utterance.onerror = () => finish(failed);
    if (failed) {
      this.timer = setTimeout(timeout, 10000);
      utterance.onstart = () => { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(timeout, 60000); };
    }
    let preference = '';
    try { preference = this.preferredVoice(); } catch { /* Storage blocked: use browser default. */ }
    const voice = selectedVoice(window.speechSynthesis.getVoices(), preference);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-US'; utterance.volume = 1; utterance.rate = 1;
    window.speechSynthesis.resume?.(); window.speechSynthesis.speak(utterance);
  }
  stop() {
    if (this.utterance) { this.utterance.onstart = null; this.utterance.onend = null; this.utterance.onerror = null; this.utterance = null; }
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    const recognition = this.recognition; this.recognition = null;
    if (recognition) { recognition.onresult = null; recognition.onerror = null; recognition.onend = null; recognition.abort(); }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }
  dispose() { this.disposed = true; this.stop(); }
}
