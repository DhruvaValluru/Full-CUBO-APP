import type { RoutePoint, SafetyEvent } from '../drives/types';
export const isMapCoordinate = (point: { latitude?: number; longitude?: number }) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude!) <= 85 && Math.abs(point.longitude!) <= 180;
export function eventMapStyle(event: SafetyEvent) {
  if (event.type === 'road_hazard') {
    if (event.hazardKind === 'police') return { icon: 'shield-outline' as const, color: '#3D8DFF', label: 'Police', symbol: 'shield' };
    if (event.hazardKind === 'crash') return { icon: 'warning-outline' as const, color: '#E34943', label: 'Crash', symbol: 'warning' };
    return { icon: 'cube-outline' as const, color: '#B77C10', label: 'Road hazard', symbol: 'box' };
  }
  if (event.type === 'phone_detected') return { icon: 'phone-portrait-outline' as const, color: '#B77C10', label: 'Phone detected', symbol: 'phone' };
  if (event.type === 'eyes_closed') return { icon: 'eye-off-outline' as const, color: '#B77C10', label: 'Eyes closed', symbol: 'eye' };
  return { icon: 'eye-outline' as const, color: '#B77C10', label: 'Attention alert', symbol: 'eye' };
}
export function tripMapData(points: RoutePoint[], events: SafetyEvent[]) {
  const route = points.filter(isMapCoordinate);
  const relevant = events.filter(event => event.type !== 'attention_restored');
  const located = relevant.filter(isMapCoordinate);
  return { route, events: located, unlocated: relevant.length - located.length, bounds: [...route, ...located.map(event => ({ latitude: event.latitude!, longitude: event.longitude! }))] };
}
/** Attach only a recent recorded GPS fix; never invent an event location. */
export function eventWithLocation<T extends { latitude?: number; longitude?: number }>(event: T, route: RoutePoint[], now: number): T {
  if (isMapCoordinate(event)) return event;
  const last = route[route.length - 1];
  const age = last ? now - Date.parse(last.recordedAt) : Infinity;
  return last && isMapCoordinate(last) && age >= 0 && age <= 15000 ? { ...event, latitude: last.latitude, longitude: last.longitude } : event;
}
