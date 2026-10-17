import { accountAnswer } from './accountAnswers';
import { normalizeQuestion, type LocalAnswerDetails } from './quickAnswers';
import type { RoadHazardKind } from '../drives/types';

export type DriveVoiceSnapshot = { tripId: string; point?: { latitude: number; longitude: number; timestamp: number }; gpsValid: boolean; speed?: number; nextTurn?: string; durationSeconds: number; distanceMiles: number; score?: number; monitoring: string; account: string; details?: LocalAnswerDetails };
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
  constructor(private now: () => number = Date.now) {}
  answer(input: string, data: DriveVoiceSnapshot): DriveReply {
    let q = spokenQuestion(input);
    const reply = (text: string, extra: Omit<DriveReply, 'text'> = {}) => { this.last = short(text); return { text: this.last, ...extra }; };
    if (/^(stop( listening)?|mute( yourself| voice( assist(ant)?)?)?|(?:turn|switch) (?:off (?:the )?(?:voice( assist(ant)?)?|microphone)|(?:the )?(?:voice( assist(ant)?)?|microphone) off)|disable (?:the )?voice(?: assist(?:ant)?)?|goodbye)$/.test(q)) {
      this.pending = null; this.askingHazard = false; this.stopUntil = this.now() + 30000;
      return reply('Turn off voice assist? Say yes to confirm, or no to keep it on.');
    }
    if (this.stopUntil) {
      const current = this.now() <= this.stopUntil; this.stopUntil = 0;
      if (/^(yes|yes please|confirm|i confirm|yes turn it off|turn it off|do it)$/.test(q)) return current ? reply('Voice assist is off. Tap the AI icon to turn it on again.', { stop: true }) : reply('That confirmation expired. Voice assist is still on.');
      if (/^(no|no thanks|cancel|keep it on|never mind)$/.test(q)) return reply('Okay. Voice assist is still on.');
    }
    if (!q) return reply('I am listening. What would you like to know?');
    if (/^(cancel|no|no thanks|never mind|dont report it)$/.test(q)) { this.pending = null; this.askingHazard = false; return reply('Cancelled. No report was saved.'); }
    if (/^(repeat( that)?|say that again)$/.test(q)) return { text: this.last || 'Ask about your next turn, speed, score, or a CUBO feature.' };
    if (/^(yes|confirm|yes confirm|confirm report|yes please)$/.test(q)) {
      const pending = this.pending; this.pending = null;
      if (!pending || pending.tripId !== data.tripId || this.now() > pending.expires) return reply('No current report to confirm. Please describe the hazard again.');
      return reply(`${pending.kind} report saved to this trip at the location you requested.`, { report: pending });
    }
    if (this.askingHazard && /^(an? )?(object|debris|police|crash|collision)$/.test(q)) q = `report ${q}`;
    this.askingHazard = false;
    this.pending = null; // Any new topic cancels a previous confirmation.
    if (/\b(report|mark|flag)\b/.test(q) && /\b(hazard|debris|object|police|crash|collision)\b/.test(q)) {
      const kind: RoadHazardKind | null = /\b(police)\b/.test(q) ? 'police' : /\b(crash|collision)\b/.test(q) ? 'crash' : /\b(debris|object)\b/.test(q) ? 'object' : null;
      if (!kind) { this.askingHazard = true; return reply('Which hazard: object, police, or crash?'); }
      const p = data.point;
      if (!data.gpsValid || !p || !Number.isFinite(p.timestamp) || this.now() - p.timestamp > 15000 || p.timestamp > this.now() + 1000 || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || Math.abs(p.latitude) > 90 || Math.abs(p.longitude) > 180) return reply('A fresh GPS location is unavailable. No report was saved.');
      this.pending = { kind, point: { latitude: p.latitude, longitude: p.longitude }, tripId: data.tripId, expires: this.now() + 20000 };
      return reply(`Save ${kind} to this trip at this location? Say confirm or cancel. This voice report is local, not shared with other drivers.`);
    }
    if (/\b(next turn|next road|turn next|which road|directions|(?:where|what road).*next)\b/.test(q)) return reply(data.gpsValid && data.nextTurn ? `The map says: ${data.nextTurn}. Follow road signs and conditions.` : 'Your next turn is unavailable. Check the map when safe; I will not guess a direction.');
    if (/\b(eta|arrive|arrival|how far.*(?:left|destination)|remaining)\b/.test(q)) return reply('A reliable remaining-route estimate is not connected to voice yet. Check the map when safe.');
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
