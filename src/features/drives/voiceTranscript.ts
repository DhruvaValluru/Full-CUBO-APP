import type { DriveSession } from './types';
export type VoiceTurn = { role: 'user' | 'assistant'; text: string; elapsedSeconds: number };
export const MAX_TRANSCRIPT_CHARS = 100000;
/** Bounded local text, never raw audio. Existing trip checkpoints own persistence/deletion. */
export function appendVoiceTurn(session: DriveSession, role: VoiceTurn['role'], text: string): DriveSession {
  if (session.voiceTranscriptLimited) return session;
  const turn: VoiceTurn = { role, text: text.replace(/[\u0000-\u001f]/g, ' ').slice(0, 1200), elapsedSeconds: session.durationSeconds };
  const turns = [...(session.voiceTranscript ?? []), turn];
  if (JSON.stringify(turns).length > MAX_TRANSCRIPT_CHARS) return { ...session, voiceTranscriptLimited: true };
  return { ...session, voiceTranscript: turns };
}
