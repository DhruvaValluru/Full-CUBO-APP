import type { Coordinate, NavigationRoute } from './routeResponse';
/** Approximate position along planned geometry; no live traffic or extra routing requests. */
export function remainingRoute(route: NavigationRoute | null, point: Coordinate | null) {
  if (!route || !point || route.coordinates.length < 2 || !Number.isFinite(route.durationSeconds) || route.durationSeconds < 0) return undefined;
  const scaleY = 111195, scaleX = scaleY * Math.cos(point.latitude * Math.PI / 180);
  let total = 0, best = Infinity, progress = 0;
  for (let i = 1; i < route.coordinates.length; i++) {
    const a = route.coordinates[i - 1], b = route.coordinates[i];
    const ax = (a.longitude - point.longitude) * scaleX, ay = (a.latitude - point.latitude) * scaleY;
    const dx = (b.longitude - a.longitude) * scaleX, dy = (b.latitude - a.latitude) * scaleY;
    const length = Math.hypot(dx, dy);
    const fraction = length ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (length * length))) : 0;
    const distance = Math.hypot(ax + fraction * dx, ay + fraction * dy);
    if (distance < best) { best = distance; progress = total + fraction * length; }
    total += length;
  }
  if (!Number.isFinite(best) || best > 100 || !total) return undefined;
  const remainingFraction = Math.max(0, Math.min(1, (total - progress) / total));
  return { seconds: route.durationSeconds * remainingFraction, miles: route.distanceMeters * remainingFraction / 1609.344 };
}
