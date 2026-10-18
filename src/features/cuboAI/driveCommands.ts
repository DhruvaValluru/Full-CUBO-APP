import { appAnswer, appQuestion, isVoiceOffRequest } from './appAnswers';
export { hasWakePhrase } from './appAnswers';
import { normalizeQuestion, type LocalAnswerDetails } from './quickAnswers';
import type { RoadHazardKind } from '../drives/types';

export type DriveVoiceSnapshot = { tripId: string; point?: { latitude: number; longitude: number; timestamp: number }; gpsValid: boolean; speed?: number; nextTurn?: string; destination?: string; routeSteps?: string[]; routeIndex?: number; routeId?: string; remainingSeconds?: number; remainingMiles?: number; history?: { role: string; text: string }[]; durationSeconds: number; distanceMiles: number; score?: number; monitoring: string; account: string; details?: LocalAnswerDetails };
type Pending = { kind: RoadHazardKind; point: { latitude: number; longitude: number }; tripId: string; expires: number };
export type DriveReply = { text: string; stop?: boolean; report?: Pending; reroute?: boolean; routeChoice?: number };
// Drive replies never read the chat help manual aloud. Keep complete short sentences.
const short = (text: string) => {
  if (text.length <= 240) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [];
  let result = '';
  for (const sentence of sentences) { if ((result + sentence).length > 240) break; result += sentence; }
  return result.trim() || 'That answer is too long for driving. Check it in chat when parked.';
};
export const spokenQuestion = appQuestion;
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
  private routes: string[] = [];
  private routeUntil = 0;
  private selectedRoute: number | null = null;
  rememberReply(text: string) { this.last = short(text); return { text: this.last }; }
  offerRoutes(labels: string[]) {
    this.routes = labels.slice(0, 2); this.routeUntil = this.now() + 120000; this.selectedRoute = null;
    this.last = this.routes.length ? this.routeMenu() : 'No usable routes were returned. Keeping your current route.';
    return { text: this.last };
  }
  private routeMenu() { return `${this.routes.map((label, i) => `Option ${i + 1}: ${label}`).join('. ')}. ${this.routes.length === 1 ? 'Only one route was returned. Say option one or cancel.' : 'Say option one or option two, or cancel.'}`; }
  private routeSelection(q: string): number | undefined {
    const numbered = q.match(/^(?:(?:take|use|choose|select|go with) )?(?:the )?(?:(?:option|route) )?(one|two|1|2|first|second)(?: (?:one|route))?$/);
    if (numbered) return /^(one|1|first)$/.test(numbered[1]) ? 0 : 1;
    if (!/\b(take|use|choose|select|go|via|way|route)\b/.test(q)) return;
    const matching = this.routes.map((label, index) => ({ index, names: normalizeQuestion(label.split(', about')[0].replace(/^via /, '')).split(' and ') })).filter(route => route.names.some(name => name.length >= 4 && q.includes(name)));
    return matching.length === 1 ? matching[0].index : undefined;
  }
  constructor(private now: () => number = Date.now) {}
  /** Arm the response window AFTER playback, not while the prompt is being spoken. */
  readyForReply() {
    if (this.pending && this.pending.expires >= this.now()) this.pending.expires = this.now() + 60000;
    if (this.stopUntil >= this.now() && this.stopUntil) this.stopUntil = this.now() + 60000;
    if (this.routeUntil >= this.now() && this.routeUntil) this.routeUntil = this.now() + 60000;
  }
  acceptsFollowUp(text: string) {
    const q = spokenQuestion(text);
    if (this.routes.length && this.routeSelection(q) != null) return true;
    if (this.routes.length && /^(confirm|yes|cancel|no|repeat|what am i confirming)$/.test(q)) return true;
    return (!!this.pending || !!this.stopUntil || this.askingHazard) && /^(yes|yeah|yep|confirm|confirm it|i confirm|i said confirm|yes confirm|yes confirm it|confirm report|yes please|yes turn it off|yes turn off voice assist|turn it off|do it|yes do it|no|no thanks|cancel|never mind|keep it on|repeat|repeat that|respond|are you there|what am i confirming|object|debris|police|crash)$/.test(q);
  }
  private pendingPrompt() {
    if ((this.stopUntil && this.stopUntil < this.now()) || (this.pending && this.pending.expires < this.now())) return 'That request expired without any action. Please ask again.';
    if (this.stopUntil) return 'Turn off voice assist? Say yes or confirm to turn it off, or no to keep it on.';
    if (this.routes.length) return this.routeUntil < this.now() ? 'Those route choices expired. Ask to reroute again.' : this.selectedRoute != null ? `Switch to option ${this.selectedRoute + 1}? Say confirm or cancel.` : this.routeMenu();
    if (this.pending) return `Save the ${this.pending.kind} report at the location you requested? Say confirm or cancel. This saves to your trip only.`;
    return '';
  }
  answer(input: string, data: DriveVoiceSnapshot): DriveReply {
    if (this.tripId && this.tripId !== data.tripId) { this.pending = null; this.stopUntil = 0; this.askingHazard = false; this.member = ''; this.last = ''; this.routeCursor = -1; this.routeId = ''; this.routes = []; this.selectedRoute = null; }
    this.tripId = data.tripId;
    let q = spokenQuestion(input);
    const reply = (text: string, extra: Omit<DriveReply, 'text'> = {}) => { this.last = short(text); return { text: this.last, ...extra }; };
    if (isVoiceOffRequest(q) && !(this.stopUntil && q === 'turn it off')) {
      this.routes = []; this.selectedRoute = null;
      this.pending = null; this.askingHazard = false; this.stopUntil = this.now() + 120000;
      return reply('Turn off voice assist? Say yes to confirm, or no to keep it on.');
    }
    if (/^(repeat( that)?|say that again|respond|are you there|what am i confirming)$/.test(q)) return { text: this.pendingPrompt() || this.last || 'I am listening. What would you like to know?' };
    if (/\b(dont|do not|never)\b.*\b(report|mark|flag|reroute|re route|recalculate)\b/.test(q)) {
      this.pending = null; this.askingHazard = false; this.routes = []; this.selectedRoute = null;
      return reply('Okay. No report saved or route changed.');
    }
    if (/\b(reroute|re route|recalculate|another route|different route|alternative routes?|alternate routes?|other way|another way|missed.*turn)\b/.test(q)) {
      this.pending = null; this.stopUntil = 0; this.routes = []; this.selectedRoute = null;
      return reply('Checking routes from your current location.', { reroute: true });
    }
    if (this.routes.length) {
      if (/^(cancel|no|never mind|keep (?:this|my|the current) route)$/.test(q)) { this.routes = []; this.selectedRoute = null; return reply('Keeping your current route.'); }
      const choice = this.routeSelection(q);
      if (choice != null || /^(confirm|yes|yes please|do it)$/.test(q)) {
        if (this.now() > this.routeUntil) { this.routes = []; this.selectedRoute = null; return reply('Those routes expired. Ask to reroute again.'); }
        if (choice != null) {
          const index = choice;
          if (!this.routes[index]) return reply('Only option one is available. Say option one or cancel.');
          this.selectedRoute = index;
          return reply(`Switch to option ${index + 1}, ${this.routes[index]}? Say confirm or cancel.`);
        }
        if (this.selectedRoute == null) return reply('Choose option one or option two first.');
        const index = this.selectedRoute; this.routes = []; this.selectedRoute = null;
        return reply('Checking the selected route.', { routeChoice: index });
      }
    }
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
    if (/\b(report|mark|flag)\b/.test(q) && /\b(hazard|debris|object|obstacle|police|crash|collision|accident)\b/.test(q)) {
      this.routes = []; this.selectedRoute = null;
      this.pending = null; this.stopUntil = 0; // A replacement request cannot confirm an older action.
      const kind: RoadHazardKind | null = /\b(police)\b/.test(q) ? 'police' : /\b(crash|collision|accident)\b/.test(q) ? 'crash' : /\b(debris|object|obstacle)\b/.test(q) ? 'object' : null;
      if (!kind) { this.askingHazard = true; return reply('Which hazard: object, police, or crash?'); }
      const p = data.point;
      if (!data.gpsValid || !p || !Number.isFinite(p.timestamp) || this.now() - p.timestamp > 15000 || p.timestamp > this.now() + 1000 || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || Math.abs(p.latitude) > 90 || Math.abs(p.longitude) > 180) return reply('A fresh GPS location is unavailable. No report was saved.');
      this.stopUntil = 0;
      this.pending = { kind, point: { latitude: p.latitude, longitude: p.longitude }, tripId: data.tripId, expires: this.now() + 120000 };
      return reply(`Save ${kind} to this trip at this location? Say confirm or cancel. This voice report is local, not shared with other drivers.`);
    }
    if (/\b(final destination|my destination|the destination|where am i (going|headed|heading)|where are we (going|headed|heading)|where (?:does.*route.*end|are you taking me))\b/.test(q)) return reply(data.destination ? `Your selected destination is ${data.destination}.` : 'No destination is connected to this drive. I will not guess.');
    const later = /\b(after (that|this|this road|this turn)|what then|and then|what comes after)\b/.test(q);
    if (later || /\b(next turn|next road|next instruction|turn next|which (?:road|way)|directions|(?:where|when|what road).*turn|(?:where|what road|what do i do).*next)\b/.test(q)) {
      if (!data.gpsValid) return reply('Your next turn is unavailable without fresh GPS. I will not guess a direction.');
      if (this.routeId !== (data.routeId ?? '')) { this.routeCursor = -1; this.routeId = data.routeId ?? ''; }
      const base = data.routeIndex ?? 0;
      this.routeCursor = later ? Math.max(base, this.routeCursor + 1) : base;
      const instruction = data.routeSteps?.[this.routeCursor - base] ?? (this.routeCursor === base ? data.nextTurn : undefined);
      return reply(instruction ? `${later ? 'After that' : 'The next instruction'}: ${instruction}. Follow road signs and conditions.` : 'There are no further connected route instructions. Check the map when safe.');
    }
    if (/\b(eta|arrive|arrival|how far.*(?:left|destination|to go)|remaining|when.*get there|how long.*(?:there|destination|left|to go)|are we (?:there|nearly there|almost there))\b/.test(q)) {
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
    if (/\b(traffic|road closure|closed road|speed limit)\b/.test(q)) return reply('I do not have live traffic, closures, or speed-limit data. Follow posted signs.');
    if (/\b(avoid|via|through)\b.*\b(toll|highway|road|street)\b/.test(q)) return reply('I cannot guarantee a route through or avoiding a specific road. Ask for alternate routes to hear available choices.');
    if (/\b(voice|microphone|mic|are you listening|mute|stop talking|quiet)\b/.test(q)) return reply('Voice is on. To switch it off, say turn off voice assist, then confirm.');
    if (/\b(help|what can you|features|cubo)\b/.test(q)) return reply('Ask for your next turn, arrival time, score, vehicle, family, alternate routes, or a hazard report.');
    if (/\b(end drive|delete|remove|change|submit|send|navigate|take me)\b/.test(q)) return reply('I cannot do that by voice. Use the app controls when safely parked. Hazard reports support spoken confirmation.');
    const member = q.match(/\b(child (?:1|2|one|two)|parent)\b/)?.[0];
    if (member) this.member = member;
    if (/^(and |what about )?(their|his|her) (score|trips|miles)$/.test(q)) {
      if (!this.member) return reply('Which demo family member: Parent, Child 1, or Child 2?');
      q = `${this.member} ${q.match(/(score|trips|miles)$/)![0]}`;
    }
    if (/\b(road|map|route|navigation|destination|turn)\b/.test(q)) return reply('I did not catch that route question. Ask for the next turn, destination, arrival time, or alternate routes.');
    const answer = appAnswer(q, data.account, data.details);
    return reply(answer?.startsWith('That detail is not connected') ? 'That detail is not available. Try asking about your score, vehicle, or family.' : answer || 'I did not catch that. Please ask one short question.');
  }
}
