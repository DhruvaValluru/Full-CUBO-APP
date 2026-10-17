export type Coordinate = { latitude: number; longitude: number };
export type NavigationStep = { location: Coordinate; distanceMeters: number; name: string; type: string; modifier?: string };
export type NavigationRoute = { coordinates: Coordinate[]; distanceMeters: number; durationSeconds: number; steps: NavigationStep[] };
const validPair = (value: unknown): value is [number, number] => Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 85;
/** Reject incomplete service responses rather than enabling Start with an unusable route. */
export function parseDrivingRoute(payload: any): NavigationRoute {
  const route = payload?.routes?.[0];
  if (payload?.code !== 'Ok' || !Number.isFinite(route?.distance) || route.distance < 0 || !Number.isFinite(route.duration) || route.duration < 0 || !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2 || !route.geometry.coordinates.every(validPair)) throw Error('No driving route found');
  const steps: NavigationStep[] = (route.legs ?? []).flatMap((leg: any) => (leg.steps ?? []).map((step: any) => {
    if (!validPair(step.maneuver?.location) || typeof step.maneuver.type !== 'string' || !Number.isFinite(step.distance)) throw Error('Route guidance unavailable');
    return { location: { longitude: step.maneuver.location[0], latitude: step.maneuver.location[1] }, distanceMeters: step.distance, name: typeof step.name === 'string' ? step.name : '', type: step.maneuver.type, modifier: typeof step.maneuver.modifier === 'string' ? step.maneuver.modifier : undefined };
  }));
  if (!steps.length) throw Error('Route guidance unavailable');
  return { coordinates: route.geometry.coordinates.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude })), distanceMeters: route.distance, durationSeconds: route.duration, steps };
}
