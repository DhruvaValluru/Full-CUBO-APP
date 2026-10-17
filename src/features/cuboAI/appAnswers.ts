import { accountAnswer } from './accountAnswers';
import { normalizeQuestion, type LocalAnswerDetails } from './quickAnswers';

const wake = /^(?:(?:hey|hi|okay|ok) )?(?:cubo|kubo|cube o)\b\s*/;
export const hasWakePhrase = (text: string) => wake.test(normalizeQuestion(text));
/** Shared by typed chat, dictation and drive voice. No live-drive values or actions here. */
export function appQuestion(text: string) {
  return normalizeQuestion(text).replace(wake, '').replace(/^(?:(?:can|could|would|will) you |please |tell me |i want (?:you )?to |id like (?:you )?to )+/, '').replace(/(?: please| for me| now)+$/, '')
    .replace(/\bmy (first|oldest) child\b/g, 'child 1').replace(/\bmy second child\b/g, 'child 2')
    .replace(/\b(automobile|ride)\b/g, 'vehicle');
}
export function isVoiceOffRequest(q: string) {
  return q === 'stop' || (/\b(?:turn|switch|shut)\b.*\boff\b|\b(?:disable|deactivate|mute)\b|^stop listening$|^goodbye$/.test(q) && !/\b(dont|do not|never|should|how|why)\b/.test(q) && !/\b(camera|map|music|navigation|engine)\b/.test(q));
}
export function briefSpokenAnswer(text: string) {
  if (text.length <= 240) return text;
  let result = '';
  for (const sentence of text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? []) { if ((result + sentence).length > 240) break; result += sentence; }
  return result.trim() || 'Please read the full answer in the chat.';
}
type Turn = { role: string; content: string };
export function appAnswer(input: string, context: string, details?: LocalAnswerDetails, history: Turn[] = []) {
  let q = appQuestion(input);
  if (/^(repeat( that)?|say that again|what did you say)$/.test(q)) return [...history].reverse().find(turn => turn.role === 'assistant')?.content ?? 'Ask about your saved score, vehicle, family, or CUBO settings.';
  if (/^(and |what about )?(their|his|her) (score|trips|miles)$/.test(q)) {
    const member = [...history].reverse().filter(turn => turn.role === 'user').map(turn => appQuestion(turn.content).match(/\b(child (?:1|2|one|two)|parent)\b/)?.[0]).find(Boolean);
    if (!member) return 'Which demo family member: Parent, Child 1, or Child 2?';
    q = `${member} ${q.match(/(score|trips|miles)$/)![0]}`;
  }
  if (/\b(reroute|re route|next turn|next road|destination|eta|arrival|what then|after that|current speed)\b/.test(q)) return 'Cubo Assistant has no live route data; it uses saved app information. During a drive, use Cubo Voice Assist on the map for directions, arrival estimates, and rerouting.';
  return accountAnswer(q, context, details);
}
