import { hasWakePhrase, type DriveReply } from './driveCommands';
import { isSilenceRequest } from './appAnswers';
export type SpeechPort = { listen(consent: boolean, result: (text: string) => void, error: (message: string) => void, ended: () => void): void; speak(text: string, done: () => void, failed: () => void): void; stop(): void; watchInterrupt?: (spoken: string, interrupted: () => void) => void };
/** Foreground-only toggle. Recognition is suspended during speech; idle ends restart with backoff. */
export class DriveConversation {
  private revision = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private followUpUntil = 0;
  private rapidEnds = 0;
  private captureRetries = 0;
  constructor(private speech: SpeechPort, private allowed: () => boolean, private answer: (text: string) => DriveReply | Promise<DriveReply>, private status: (active: boolean, text: string) => void, private now: () => number = Date.now, private context: { acceptsFollowUp: (text: string) => boolean; readyForReply: () => void; mode?: 'chat' | 'drive' } = { acceptsFollowUp: () => false, readyForReply: () => {} }) {}
  private recovery() { return this.context.mode === 'chat' ? 'Tap Voice Assist to retry, or type your message.' : 'Retry Voice Assist when parked.'; }
  start() {
    this.stop(); this.rapidEnds = 0; this.captureRetries = 0;
    if (this.context.mode === 'chat') {
      // Chat has no pre-drive mic setup. Capture begins in the tap handler,
      // not from a speech completion timer after transient activation is lost.
      this.followUpUntil = this.now() + 20000;
      this.listen(this.revision); return;
    }
    // Runs synchronously from the user's tap to establish speech playback on Safari.
    this.say(this.revision, { text: 'Cubo Voice Assist is on. Say Hey Cubo, then your question.' });
  }
  stop(message = 'Voice off') { this.revision++; if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.speech.stop(); this.status(false, message); }
  private listen(version: number) {
    if (version !== this.revision || !this.allowed()) { if (version === this.revision) this.stop(); return; }
    let received = false; const began = this.now();
    this.status(true, this.context.acceptsFollowUp('confirm') ? 'Listening · say confirm or cancel (no Hey Cubo needed)' : 'Voice assist on · listening for “Hey Cubo”');
    const restart = () => {
      if (received || version !== this.revision) return;
      received = true;
      this.rapidEnds = this.now() - began < 1500 ? this.rapidEnds + 1 : 0;
      if (this.rapidEnds >= 3) { this.stop('Voice off · browser repeatedly interrupted the microphone. ' + this.recovery()); return; }
      this.schedule(version);
    };
    try {
      this.speech.listen(true, text => {
        if (received) return; received = true;
        if (version !== this.revision || !this.allowed()) return;
        this.speech.stop();
        this.rapidEnds = 0; this.captureRetries = 0;
        if (isSilenceRequest(text)) {
          this.followUpUntil = this.now() + 20000;
          this.status(true, 'Speech stopped · voice assist is still listening');
          this.schedule(version); return;
        }
        if (!hasWakePhrase(text) && this.now() > this.followUpUntil && !this.context.acceptsFollowUp(text)) { this.schedule(version); return; }
        try {
          const response = this.answer(text.slice(0, 1000));
          if (response instanceof Promise) {
            this.status(true, 'Checking your request…');
            void response.then(reply => { if (version === this.revision && this.allowed()) this.say(version, reply); }).catch(() => { if (version === this.revision) this.say(version, { text: 'That request is unavailable. Your route has not changed.' }); });
          } else this.say(version, response);
        }
        catch { this.stop('Command unavailable · voice off'); }
      }, message => {
        if (version !== this.revision || received) return;
        if (message.includes('no-speech')) restart();
        else if (message.includes('audio-capture') && this.captureRetries++ < 1) {
          received = true; this.speech.stop();
          this.status(true, 'Reconnecting microphone…');
          this.schedule(version, 1500);
        } else { received = true; this.stop(message.replace('You can type instead.', this.recovery())); }
      }, restart);
    } catch { this.stop('Voice recognition unavailable. ' + this.recovery()); }
  }
  private schedule(version: number, delay = 650) {
    if (version !== this.revision) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = undefined; this.listen(version); }, delay);
  }
  private say(version: number, response: DriveReply) {
    if (version !== this.revision || !this.allowed()) { this.stop(); return; }
    this.status(true, `Speaking · ${response.text}`);
    let settled = false;
    try {
      this.speech.speak(response.text, () => {
        if (version !== this.revision || settled) return;
        settled = true; this.speech.stop();
        if (response.stop) { this.stop(); return; }
        this.followUpUntil = this.now() + 20000;
        this.context.readyForReply();
        this.schedule(version);
      }, () => { if (version === this.revision && !settled) { settled = true; this.stop('Voice off · audio unavailable. Check volume. ' + this.recovery()); } });
      if (!settled && !response.stop) this.speech.watchInterrupt?.(response.text, () => {
        if (settled || version !== this.revision || !this.allowed()) return;
        settled = true; this.speech.stop(); this.followUpUntil = this.now() + 20000;
        this.context.readyForReply(); this.status(true, 'Listening · what would you like to ask?'); this.schedule(version);
      });
    } catch { this.stop('Voice off · audio unavailable. Check volume. ' + this.recovery()); }
  }
}
