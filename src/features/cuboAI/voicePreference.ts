import { accountKey, type LocalStore } from './localState';

export const voicePreferenceKey = (uid: string) => accountKey(uid) + ':read-voice-v1';
export function readVoicePreference(store: LocalStore, uid: string): string {
  try { return (store.getItem(voicePreferenceKey(uid)) ?? '').slice(0, 1000); } catch { return ''; }
}
export function writeVoicePreference(store: LocalStore, uid: string, voiceURI: string) {
  if (voiceURI.length > 1000) throw Error('Voice identifier is too long.');
  if (voiceURI) store.setItem(voicePreferenceKey(uid), voiceURI);
  else store.removeItem(voicePreferenceKey(uid));
}
export function selectedVoice(voices: SpeechSynthesisVoice[], uri: string) {
  return voices.find(voice => voice.voiceURI === uri);
}

const preferredEnglishNames = [
  /samantha/i,
  /ava/i,
  /allison/i,
  /alex/i,
  /daniel/i,
  /karen/i,
  /aria.*natural/i,
  /jenny.*natural/i,
  /guy.*natural/i,
  /sonia.*natural/i,
  /ryan.*natural/i,
  /google us english/i,
  /google uk english/i,
  /moira/i,
  /tessa/i,
  /serena/i,
];

const noveltyVoiceNames = /albert|bad news|bells|boing|bubbles|cellos|deranged|fred|good news|hysterical|junior|kathy|organ|princess|ralph|trinoids|whisper|zarvox/i;
const localeOrder = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IE', 'en-IN', 'en-ZA'];

function voiceScore(voice: SpeechSynthesisVoice) {
  const preferred = preferredEnglishNames.findIndex(pattern => pattern.test(voice.name));
  const locale = localeOrder.indexOf(voice.lang.replace('_', '-'));
  const natural = /natural|neural|enhanced|premium/i.test(voice.name) ? -20 : 0;
  return (preferred < 0 ? 1000 : preferred * 10) + (locale < 0 ? 70 : locale) + natural + (voice.localService ? 0 : 2);
}

/** Keep the selector useful: only clear English voices, with system novelty voices removed. */
export function recommendedEnglishVoices(voices: SpeechSynthesisVoice[], limit = 6) {
  const unique = [...new Map(voices.map(voice => [voice.voiceURI, voice])).values()];
  return unique
    .filter(voice => /^en(?:[-_]|$)/i.test(voice.lang) && !noveltyVoiceNames.test(voice.name))
    .sort((a, b) => voiceScore(a) - voiceScore(b) || a.name.localeCompare(b.name))
    .slice(0, Math.max(0, limit));
}

export function voiceDisplayName(voice: SpeechSynthesisVoice) {
  const locale = new Map([
    ['en-US', 'American English'], ['en-GB', 'British English'], ['en-AU', 'Australian English'],
    ['en-CA', 'Canadian English'], ['en-IE', 'Irish English'], ['en-IN', 'Indian English'], ['en-ZA', 'South African English'],
  ]).get(voice.lang.replace('_', '-')) ?? 'English';
  const name = voice.name.replace(/^Microsoft\s+/i, '').replace(/^Google\s+/i, '').replace(/\s*[-–]\s*English.*$/i, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  return `${name || 'CUBO Voice'} · ${locale}`;
}
