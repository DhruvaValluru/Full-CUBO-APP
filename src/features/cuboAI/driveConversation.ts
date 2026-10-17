import type { DriveReply } from './driveCommands';
export type SpeechPort = { listen(consent: boolean, result: (text: string) => void, error: (message: string) => void, ended: () => void): void; speak(text: string, done: () => void, failed: () => void): void; stop(): void };
/** Bounded alternating listening/speaking; never listens to its own spoken reply. */
export class DriveConversation {
  private revision = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private speech: SpeechPort, private allowed: () => boolean, private answer: (text: string) => DriveReply, private status: (active: boolean, text: string) => void) {}
  start() { this.stop(); const version = this.revision; this.timer = setTimeout(() => this.stop('Voice off · 60-second session ended'), 60000); this.listen(version); }
  stop(message = 'Voice off') { this.revision++; if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.speech.stop(); this.status(false, message); }
  private listen(version: number) {
    if (version !== this.revision || !this.allowed()) { if (version === this.revision) this.stop(); return; }
    let received = false;
    this.status(true, 'Listening · say a command or “stop listening”');
    try {
      this.speech.listen(true, text => {
        received = true;
        if (version !== this.revision || !this.allowed()) return;
        this.speech.stop();
        try {
          const response = this.answer(text.slice(0, 1000));
          this.status(true, `Heard: ${text.slice(0, 100)} · ${response.text}`);
          this.speech.speak(response.text, () => { if (version !== this.revision) return; if (response.stop) this.stop(); else this.listen(version); }, () => { if (version === this.revision) this.stop('Voice playback unavailable · tap AI to retry'); });
        } catch { this.stop('Command unavailable · no further action taken'); }
      }, message => { if (version === this.revision) this.stop(message); }, () => { if (!received && version === this.revision) this.stop('Voice off · no speech received. Tap AI to retry.'); });
    } catch { this.stop('Voice recognition unavailable · tap AI to retry when parked'); }
  }
}
