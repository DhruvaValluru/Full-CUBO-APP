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
  constructor(private allowed: () => boolean) {}
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
      if (!this.disposed && this.allowed()) transcript((event.results[0]?.[0]?.transcript ?? '').slice(0, 2000));
      this.stop(); ended();
    };
    recognition.onerror = event => { if (!this.disposed && this.allowed()) error(`Voice input stopped (${event.error}). You can type instead.`); this.stop(); ended(); };
    recognition.onend = () => { this.stop(); ended(); };
    try { recognition.start(); } catch (cause) { this.stop(); throw cause; }
    this.timer = setTimeout(() => { this.stop(); ended(); }, 30000);
  }
  speak(text: string) {
    if (this.disposed || !this.allowed()) throw Error('Voice is unavailable for this session.');
    this.stop();
    if (!this.supported().output) throw Error('Read-aloud is not supported here.');
    // Call from an explicit Play reply tap so mobile browser audio policies can allow it.
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 8000));
    utterance.lang = 'en-US'; window.speechSynthesis.speak(utterance);
  }
  stop() {
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    const recognition = this.recognition; this.recognition = null;
    if (recognition) { recognition.onresult = null; recognition.onerror = null; recognition.onend = null; recognition.abort(); }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }
  dispose() { this.disposed = true; this.stop(); }
}
