import type { PlaceResult } from './searchPlaces';
/** Latest distinct destinations only; this never changes saved trips or Home/Work. */
export function latestPlaces(values: unknown): PlaceResult[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values.filter((p): p is PlaceResult => {
    if (!p || typeof p.title !== 'string' || typeof p.id !== 'string' || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) return false;
    const key = `${p.latitude}:${p.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 3);
}
