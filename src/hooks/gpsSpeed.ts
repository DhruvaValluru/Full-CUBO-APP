export const GPS_FRESH_MS = 10000;
export type SpeedFix = { latitude: number; longitude: number; accuracy: number | null; timestamp: number };
export function freshFix(fix: SpeedFix | null, now: number) {
  return Boolean(fix && Number.isFinite(fix.timestamp) && now >= fix.timestamp && now - fix.timestamp <= GPS_FRESH_MS && fix.accuracy != null && Number.isFinite(fix.accuracy) && fix.accuracy >= 0 && fix.accuracy <= 40);
}
export function estimateSpeedMph(speed: number | null, next: SpeedFix, last: SpeedFix | null, meters: number, now: number): number | null {
  if (!freshFix(next, now)) return null;
  let mps = speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null;
  if (mps == null) {
    const seconds = last ? (next.timestamp - last.timestamp) / 1000 : 0;
    if (!last || !freshFix(last, next.timestamp) || seconds < 1 || seconds > 10) return null;
    // Position jitter inside the accuracy radius is not proof of either movement or a stop.
    if (meters <= Math.max(5, next.accuracy ?? 40, last.accuracy ?? 40)) return null;
    mps = meters / seconds;
  }
  if (!Number.isFinite(mps) || mps > 100) return null;
  return mps < 0.7 ? 0 : mps * 2.236936;
}
