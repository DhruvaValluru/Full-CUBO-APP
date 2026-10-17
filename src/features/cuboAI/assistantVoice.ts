import { appQuestion, isVoiceOffRequest, briefSpokenAnswer } from './appAnswers';
import type { DriveReply } from './driveCommands';
/** Saved-account conversation only. It cannot report hazards, reroute, or receive live GPS. */
export class AssistantVoice {
  private offUntil = 0;
  constructor(private send: (text: string) => Promise<string>, private now: () => number = Date.now) {}
  readyForReply() { if (this.offUntil >= this.now()) this.offUntil = this.now() + 60000; }
  acceptsFollowUp(text: string) { return !!this.offUntil && /^(yes|confirm|yes please|no|cancel|what am i confirming|repeat|repeat that)$/.test(appQuestion(text)); }
  async answer(text: string): Promise<DriveReply> {
    const q = appQuestion(text);
    if (isVoiceOffRequest(q)) { this.offUntil = this.now() + 120000; return { text: 'Turn off Cubo Voice Assist? Say yes or confirm, or no to keep it on.' }; }
    if (this.offUntil) {
      if (/^(what am i confirming|repeat|repeat that)$/.test(q)) return { text: 'Turn off Cubo Voice Assist? Say confirm or cancel.' };
      if (/^(no|cancel)$/.test(q)) { this.offUntil = 0; return { text: 'Cubo Voice Assist is still on.' }; }
      if (/^(yes|confirm|yes please)$/.test(q)) { const valid = this.now() <= this.offUntil; this.offUntil = 0; return valid ? { text: 'Cubo Voice Assist is off.', stop: true } : { text: 'That confirmation expired. Ask me to turn off voice assist again.' }; }
    }
    if (!q) return { text: 'I am listening. Ask about your saved CUBO information.' };
    return { text: briefSpokenAnswer(await this.send(text)) };
  }
}
