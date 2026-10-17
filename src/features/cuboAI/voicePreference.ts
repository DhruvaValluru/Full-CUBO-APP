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
