import { accountAnswer } from './accountAnswers';
import { normalizeQuestion, type LocalAnswerDetails } from './quickAnswers';
import type { RoadHazardKind } from '../drives/types';

export type DriveVoiceSnapshot = { tripId: string; point?: { latitude: number; longitude: number; timestamp: number }; gpsValid: boolean; speed?: number; nextTurn?: string; destination?: string; routeSteps?: string[]; routeIndex?: number; routeId?: string; remainingSeconds?: number; remainingMiles?: number; history?: { role: string; text: string }[]; durationSeconds: number; distanceMiles: number; score?: number; monitoring: string; account: string; details?: LocalAnswerDetails };
type Pending = { kind: RoadHazardKind; point: { latitude: number; longitude: number }; tripId: string; expires: number };
export type DriveReply = { text: string; stop?: boolean; report?: Pending };
const short = (text: string) => text.length <= 420 ? text : text.slice(0, 390).replace(/\s+\S*$/, '') + '. Ask for more while parked.';
const wake = /^(?:(?:hey|hi|okay|ok) )?(?:cubo|kubo|cube o)\b\s*/;
export const hasWakePhrase = (text: string) => wake.test(normalizeQuestion(text));
export function spokenQuestion(text: string) {
  return normalizeQuestion(text).replace(wake, '').replace(/^(?:(?:can|could|would) you |please |tell me )+/, '').replace(/ please$/, '')
    .replace(/\bmy (first|oldest) child\b/g, 'child 1').replace(/\bmy second child\b/g, 'child 2')
    .replace(/\b(automobile|ride)\b/g, 'vehicle');
}
/** One instance per voice session. No inference, persistence or external side effects. */
export class DriveCommands {
  private pending: Pending | null = null;
  private last = '';
  private member = '';
  private askingHazard = false;
  private stopUntil = 0;
  private routeCursor = -1;
  private routeId = '';
  private tripId = '';
  constructor(private now: () => number = Date.now) {}
  /** Arm the response window AFTER playback, not while the prompt is being spoken. */
  readyForReply() {
    if (this.pending && this.pending.expires >= this.now()) this.pending.expires = this.now() + 60000;
    if (this.stopUntil >= this.now() && this.stopUntil) this.stopUntil = this.now() + 60000;
  }
  acceptsFollowUp(text: string) {
    const q = spokenQuestion(text);
    return (!!this.pending || !!this.stopUntil || this.askingHazard) && /^(yes|yeah|yep|confirm|confirm it|i confirm|i said confirm|yes confirm|yes confirm it|confirm report|yes please|yes turn it off|yes turn off voice assist|turn it off|do it|yes do it|no|no thanks|cancel|never mind|keep it on|repeat|repeat that|respond|are you there|what am i confirming|object|debris|police|crash)$/.test(q);
  }
  private pendingPrompt() {
    if ((this.stopUntil && this.stopUntil < this.now()) || (this.pending && this.pending.expires < this.now())) return 'That request expired without any action. Please ask again.';
    if (this.stopUntil) return 'Turn off voice assist? Say yes or confirm to turn it off, or no to keep it on.';
    if (this.pending) return `Save the ${this.pending.kind} report at the location you requested? Say confirm or cancel. This saves to your trip only.`;
    return '';
  }
  answer(input: string, data: DriveVoiceSnapshot): DriveReply {
    if (this.tripId && this.tripId !== data.tripId) { this.pending = null; this.stopUntil = 0; this.askingHazard = false; this.member = ''; this.last = ''; this.routeCursor = -1; this.routeId = ''; }
    this.tripId = data.tripId;
    let q = spokenQuestion(input);
    const reply = (text: string, extra: Omit<DriveReply, 'text'> = {}) => { this.last = short(text); return { text: this.last, ...extra }; };
    if (/^(stop( listening)?|mute( yourself| voice( assist(ant)?)?)?|(?:turn|switch) (?:off (?:the )?(?:voice( assist(ant)?)?|microphone)|(?:the )?(?:voice( assist(ant)?)?|microphone) off)|disable (?:the )?voice(?: assist(?:ant)?)?|goodbye)$/.test(q)) {
      this.pending = null; this.askingHazard = false; this.stopUntil = this.now() + 120000;
      return reply('Turn off voice assist? Say yes to confirm, or no to keep it on.');
    }
    if (/^(repeat( that)?|say that again|respond|are you there|what am i confirming)$/.test(q)) return { text: this.pendingPrompt() || this.last || 'I am listening. What would you like to know?' };
    if (this.stopUntil) {
      const current = this.now() <= this.stopUntil;
      if (/^(yes|yeah|yep|yes please|confirm|confirm it|i confirm|i said confirm|yes confirm|yes confirm it|yes turn it off|yes turn off voice assist|turn it off|do it|yes do it)$/.test(q)) { this.stopUntil = 0; return current ? reply('Voice assist is off. Tap the AI icon to turn it on again.', { stop: true }) : reply('That confirmation expired. Voice assist is still on. Ask me to turn it off again.'); }
      if (/^(no|no thanks|cancel|keep it on|never mind)$/.test(q)) { this.stopUntil = 0; return reply('Okay. Voice assist is still on.'); }
    }
    if (!q) return reply(this.pendingPrompt() || 'I am listening. What would you like to know?');
    if (/^(cancel|no|no thanks|never mind|dont report it)$/.test(q)) { this.pending = null; this.askingHazard = false; return reply('Cancelled. No report was saved.'); }
    if (/^(repeat( that)?|say that again)$/.test(q)) return { text: this.last || 'Ask about your next turn, speed, score, or a CUBO feature.' };
    if (/^(yes|yeah|yep|confirm|confirm it|i confirm|i said confirm|yes confirm|yes confirm it|confirm report|yes please|do it|yes do it)$/.test(q)) {
      const pending = this.pending; this.pending = null;
      if (!pending || pending.tripId !== data.tripId || this.now() > pending.expires) return reply('No current report to confirm. Please describe the hazard again.');
      return reply(`${pending.kind} report saved to this trip at the location you requested.`, { report: pending });
    }
    if (this.askingHazard && /^(an? )?(object|debris|police|crash|collision)$/.test(q)) q = `report ${q}`;
    this.askingHazard = false;
    if (/\b(report|mark|flag)\b/.test(q) && /\b(hazard|debris|object|police|crash|collision)\b/.test(q)) {
      this.pending = null; this.stopUntil = 0; // A replacement request cannot confirm an older action.
      const kind: RoadHazardKind | null = /\b(police)\b/.test(q) ? 'police' : /\b(crash|collision)\b/.test(q) ? 'crash' : /\b(debris|object)\b/.test(q) ? 'object' : null;
      if (!kind) { this.askingHazard = true; return reply('Which hazard: object, police, or crash?'); }
      const p = data.point;
      if (!data.gpsValid || !p || !Number.isFinite(p.timestamp) || this.now() - p.timestamp > 15000 || p.timestamp > this.now() + 1000 || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || Math.abs(p.latitude) > 90 || Math.abs(p.longitude) > 180) return reply('A fresh GPS location is unavailable. No report was saved.');
      this.stopUntil = 0;
      this.pending = { kind, point: { latitude: p.latitude, longitude: p.longitude }, tripId: data.tripId, expires: this.now() + 120000 };
      return reply(`Save ${kind} to this trip at this location? Say confirm or cancel. This voice report is local, not shared with other drivers.`);
    }
    if (/\b(final destination|my destination|where am i (going|headed)|where are we (going|headed)|where does.*route.*end)\b/.test(q)) return reply(data.destination ? `Your selected destination is ${data.destination}.` : 'No destination is connected to this drive. I will not guess.');
    const later = /\b(after (that|this|this road|this turn)|what then|and then|what comes after)\b/.test(q);
    if (later || /\b(next turn|next road|turn next|which road|directions|(?:where|what road).*next)\b/.test(q)) {
      if (!data.gpsValid) return reply('Your next turn is unavailable without fresh GPS. I will not guess a direction.');
      if (this.routeId !== (data.routeId ?? '')) { this.routeCursor = -1; this.routeId = data.routeId ?? ''; }
      const base = data.routeIndex ?? 0;
      this.routeCursor = later ? Math.max(base, this.routeCursor + 1) : base;
      const instruction = data.routeSteps?.[this.routeCursor - base] ?? (this.routeCursor === base ? data.nextTurn : undefined);
      return reply(instruction ? `${later ? 'After that' : 'The next instruction'}: ${instruction}. Follow road signs and conditions.` : 'There are no further connected route instructions. Check the map when safe.');
    }
    if (/\b(eta|arrive|arrival|how far.*(?:left|destination)|remaining|when.*get there|how long.*(?:there|destination))\b/.test(q)) {
      if (!data.gpsValid || !Number.isFinite(data.remainingSeconds)) return reply('A remaining-route estimate is unavailable; GPS may be stale or you may be off the planned route. I will not guess.');
      const minutes = Math.ceil(data.remainingSeconds! / 60);
      const arrival = new Date(this.now() + data.remainingSeconds! * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return reply(`About ${minutes} minutes${Number.isFinite(data.remainingMiles) ? ` and ${data.remainingMiles!.toFixed(1)} miles` : ''} remaining, arriving around ${arrival}. This is a route-based estimate, not live traffic.`);
    }
    if (/\b(what did i (ask|say)|what (did we|have we) (discuss|talk)|our conversation)\b/.test(q)) {
      const questions = data.history?.filter(turn => turn.role === 'user').slice(-3).map(turn => turn.text) ?? [];
      return reply(questions.length ? `Your recent questions this drive were: ${questions.join('; ')}.` : 'No earlier voice questions are recorded for this drive.');
    }
    if (/\b(speed|mph|how fast)\b/.test(q)) return reply(data.gpsValid && Number.isFinite(data.speed) ? `GPS speed is about ${Math.round(data.speed!)} miles per hour. Use your vehicle’s speedometer.` : 'GPS speed is unavailable. Use your vehicle’s speedometer.');
    if (/\b(how am i doing|this drive.*score|current.*score|live score|score.*this drive)\b/.test(q)) return reply(Number.isFinite(data.score) && data.score! >= 0 && data.score! <= 100 ? `This drive’s measured focus estimate is ${data.score} out of 100. It is experimental, not a safety rating. ${data.monitoring}.` : `No measured focus score is available yet. ${data.monitoring}.`);
    if (/\b(how long|drive time|how far.*driven|distance.*drive)\b/.test(q)) return reply(`This trip: ${Math.floor(data.durationSeconds / 60)} minutes and ${data.distanceMiles.toFixed(1)} recorded miles.`);
    if (/\b(monitoring|camera status)\b/.test(q)) return reply(data.monitoring || 'Monitoring status is unavailable.');
    if (/\b(microphone|mic|are you listening|voice on)\b/.test(q)) return reply('Voice is on. Say Hey Cubo before a new question. I pause listening while speaking. Ask me to turn off voice assist when finished.');
    if (/\b(end drive|delete|remove|change|submit|send|navigate|take me)\b/.test(q)) return reply('I cannot do that by voice. Use the app controls when safely parked. Hazard reports support spoken confirmation.');
    const member = q.match(/\b(child (?:1|2|one|two)|parent)\b/)?.[0];
    if (member) this.member = member;
    if (/^(and |what about )?(their|his|her) (score|trips|miles)$/.test(q)) {
      if (!this.member) return reply('Which demo family member: Parent, Child 1, or Child 2?');
      q = `${this.member} ${q.match(/(score|trips|miles)$/)![0]}`;
    }
    return reply(accountAnswer(q, data.account, data.details) || 'I did not match that command. Try next turn, my speed, this drive score, my vehicle, or report debris. No action was taken.');
  }
}
