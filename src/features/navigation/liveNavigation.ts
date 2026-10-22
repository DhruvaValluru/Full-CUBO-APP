import type { Coordinate, NavigationRoute } from './routeResponse';

export type LiveNavigationFix = Coordinate & { accuracy: number | null; timestamp: number };
export type LiveNavigationDecision =
  | { kind: 'none'; distanceToRouteMeters: number; distanceToDestinationMeters: number }
  | { kind: 'reroute'; distanceToRouteMeters: number; distanceToDestinationMeters: number }
  | { kind: 'arrived'; distanceToRouteMeters: number; distanceToDestinationMeters: number };

export const coordinateDistanceMeters = (a: Coordinate, b: Coordinate) => {
  const radians = Math.PI / 180;
  const latitude = (a.latitude + b.latitude) / 2 * radians;
  return Math.hypot((a.latitude - b.latitude) * 111195, (a.longitude - b.longitude) * 111195 * Math.cos(latitude));
};

/** Distance from a GPS point to the closest segment, not merely the closest route vertex. */
export function distanceToRouteMeters(route: NavigationRoute, point: Coordinate) {
  const scaleY = 111195;
  const scaleX = scaleY * Math.cos(point.latitude * Math.PI / 180);
  let nearest = Infinity;
  for (let index = 1; index < route.coordinates.length; index++) {
    const a = route.coordinates[index - 1];
    const b = route.coordinates[index];
    const ax = (a.longitude - point.longitude) * scaleX;
    const ay = (a.latitude - point.latitude) * scaleY;
    const dx = (b.longitude - a.longitude) * scaleX;
    const dy = (b.latitude - a.latitude) * scaleY;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0;
    nearest = Math.min(nearest, Math.hypot(ax + fraction * dx, ay + fraction * dy));
  }
  return nearest;
}

/**
 * Requires repeated accurate fixes before rerouting or announcing arrival.
 * This hysteresis prevents one noisy parking-lot fix from replacing a good route.
 */
export class LiveNavigationTracker {
  private offRouteFixes = 0;
  private arrivalFixes = 0;
  private lastRerouteAt = -Infinity;
  private arrived = false;

  update(route: NavigationRoute, point: LiveNavigationFix, destination: Coordinate, now: number): LiveNavigationDecision {
    const routeDistance = distanceToRouteMeters(route, point);
    const destinationDistance = coordinateDistanceMeters(point, destination);
    const accurate = Number.isFinite(point.timestamp) && now >= point.timestamp && now - point.timestamp <= 10000
      && point.accuracy != null && Number.isFinite(point.accuracy) && point.accuracy >= 0 && point.accuracy <= 40;
    if (!accurate) {
      this.offRouteFixes = 0;
      this.arrivalFixes = 0;
      return { kind: 'none', distanceToRouteMeters: routeDistance, distanceToDestinationMeters: destinationDistance };
    }

    const arrivalRadius = Math.max(35, Math.min(50, (point.accuracy ?? 0) + 18));
    this.arrivalFixes = destinationDistance <= arrivalRadius ? this.arrivalFixes + 1 : 0;
    if (!this.arrived && this.arrivalFixes >= 2) {
      this.arrived = true;
      this.offRouteFixes = 0;
      return { kind: 'arrived', distanceToRouteMeters: routeDistance, distanceToDestinationMeters: destinationDistance };
    }

    if (this.arrived) return { kind: 'none', distanceToRouteMeters: routeDistance, distanceToDestinationMeters: destinationDistance };
    const offRouteRadius = Math.max(55, (point.accuracy ?? 0) * 1.6);
    if (routeDistance > offRouteRadius) this.offRouteFixes += 1;
    else if (routeDistance < offRouteRadius * .72) this.offRouteFixes = 0;

    if (this.offRouteFixes >= 3 && now - this.lastRerouteAt >= 25000) {
      this.offRouteFixes = 0;
      this.lastRerouteAt = now;
      return { kind: 'reroute', distanceToRouteMeters: routeDistance, distanceToDestinationMeters: destinationDistance };
    }
    return { kind: 'none', distanceToRouteMeters: routeDistance, distanceToDestinationMeters: destinationDistance };
  }

  routeApplied(at: number) { this.lastRerouteAt = at; this.offRouteFixes = 0; }
  reset() { this.offRouteFixes = 0; this.arrivalFixes = 0; this.lastRerouteAt = -Infinity; this.arrived = false; }
}
