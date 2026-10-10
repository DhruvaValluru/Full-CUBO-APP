export type PlaceResult = { id: string; title: string; subtitle: string; latitude: number; longitude: number };
export type Coordinate = { latitude: number; longitude: number };
export function placeDistance(a: Coordinate, b: Coordinate) {
  const radians = Math.PI / 180;
  const deltaLat = (b.latitude - a.latitude) * radians;
  const deltaLon = (b.longitude - a.longitude) * radians;
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(deltaLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export async function searchPlaces(query: string, origin?: Coordinate | null, signal?: AbortSignal): Promise<PlaceResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  const params = new URLSearchParams({ q: clean, limit: '10', lang: 'en' });
  if (origin) {
    params.set('lat', String(origin.latitude)); params.set('lon', String(origin.longitude));
    params.set('zoom', '11'); params.set('location_bias_scale', '0.1');
    params.set('bbox', `${origin.longitude - .7},${origin.latitude - .55},${origin.longitude + .7},${origin.latitude + .55}`);
  }
  const request = async () => {
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
    if (!response.ok) throw new Error('Search is temporarily unavailable.');
    const payload = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, string> }> };
    return (payload.features ?? []).flatMap((feature, index) => {
      const coords = feature.geometry?.coordinates; if (!coords) return [];
      const p = feature.properties ?? {};
      const street = [p.housenumber, p.street].filter(Boolean).join(' ');
      const locality = [p.city || p.district || p.county, p.state, p.postcode].filter(Boolean).join(', ');
      const title = p.name || street || p.city || clean;
      return [{ id: `${coords[0]}:${coords[1]}:${index}`, title, subtitle: [p.name ? street : '', locality].filter(Boolean).join(' · '), longitude: coords[0], latitude: coords[1] }];
    });
  };
  let results = await request();
  if (!results.length && origin) { params.delete('bbox'); results = await request(); }
  if (origin) results.sort((a, b) => placeDistance(origin, a) - placeDistance(origin, b));
  return results.slice(0, 6);
}
