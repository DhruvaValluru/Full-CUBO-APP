export type PlaceResult = { id: string; title: string; subtitle: string; latitude: number; longitude: number };
export type Coordinate = { latitude: number; longitude: number };
// Short-lived, bounded memory only: never persist searched addresses or GPS to storage.
const cache = new Map<string, { at: number; results: PlaceResult[] }>();
export function normalizePlaceQuery(query: string) { return query.trim().replace(/\s+/g, ' '); }
export function placeDistance(a: Coordinate, b: Coordinate) {
  const radians = Math.PI / 180;
  const deltaLat = (b.latitude - a.latitude) * radians;
  const deltaLon = (b.longitude - a.longitude) * radians;
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(deltaLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export async function searchPlaces(query: string, origin?: Coordinate | null, signal?: AbortSignal): Promise<PlaceResult[]> {
  const clean = normalizePlaceQuery(query);
  if (clean.length < 2) return [];
  if (signal?.aborted) throw Object.assign(new Error('Search cancelled'), { name: 'AbortError' });
  const key = `${clean.toLowerCase()}:${origin ? `${origin.latitude.toFixed(2)},${origin.longitude.toFixed(2)}` : ''}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 120000) return cached.results.map(place => ({ ...place }));
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 8000);
  const params = new URLSearchParams({ q: clean, limit: '10', lang: 'en' });
  if (origin) {
    params.set('lat', origin.latitude.toFixed(2)); params.set('lon', origin.longitude.toFixed(2));
    params.set('zoom', '11'); params.set('location_bias_scale', '0.1');
  }
  const request = async () => {
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error('Search is temporarily unavailable.');
    const payload = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, string> }> };
    return (payload.features ?? []).flatMap((feature) => {
      const coords = feature.geometry?.coordinates; if (!coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1]) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) return [];
      const p = feature.properties ?? {};
      const street = [p.housenumber, p.street].filter(Boolean).join(' ');
      const locality = [p.city || p.district || p.county, p.state, p.postcode].filter(Boolean).join(', ');
      const title = p.name || street || p.city || clean;
      return [{ id: `${coords[0]}:${coords[1]}:${title}`, title, subtitle: [p.name ? street : '', locality].filter(Boolean).join(' · '), longitude: coords[0], latitude: coords[1] }];
    });
  };
  try {
    // Photon already applies typo tolerance and location bias. Preserve text relevance.
    const results = [...new Map((await request()).map(place => [place.id, place])).values()].slice(0, 6);
    if (controller.signal.aborted) throw new Error('Search timed out. Try again.');
    if (cache.size >= 40) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), results });
    return results.map(place => ({ ...place }));
  } catch (cause) {
    if (signal?.aborted) throw Object.assign(new Error('Search cancelled'), { name: 'AbortError' });
    if (controller.signal.aborted) throw new Error('Search timed out. Try again.');
    throw cause;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
