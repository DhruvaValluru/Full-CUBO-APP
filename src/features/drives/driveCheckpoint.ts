import type { DriveSession } from './types';
export type DriveCheckpoint = { version: 1; sessions: DriveSession[]; active: DriveSession | null; savedAt: string };
export function recoverCheckpoint(checkpoint: DriveCheckpoint): DriveSession[] {
  if (checkpoint.version !== 1 || !Array.isArray(checkpoint.sessions)) throw Error('Unsupported drive history');
  const active = checkpoint.active;
  if (!active || checkpoint.sessions.some(s => s.id === active.id)) return checkpoint.sessions;
  // Do not count time while the app was closed or resume the camera without consent.
  return [{ ...active, endedAt: checkpoint.savedAt, interrupted: true }, ...checkpoint.sessions];
}
