import type { RoutePoint, SafetyEvent } from '../drives/types';
// Fictional trip on a small downtown Raleigh sample corridor, never device GPS.
export const demoRoute: RoutePoint[] = [
  [35.7796, -78.6382], [35.7796, -78.6358], [35.7796, -78.6334],
  [35.7778, -78.6334], [35.7761, -78.6334],
].map(([latitude, longitude], index) => ({ latitude, longitude, recordedAt: new Date(Date.UTC(2026, 9, 15, 14, index)).toISOString(), speedMph: 24 }));
export const demoSafetyEvents: SafetyEvent[] = [1, 3].map((index, i) => ({
  id: 'demo-event-' + i, type: 'looking_away', severity: 'caution',
  title: i ? 'Attention drift' : 'Eyes off road', detail: 'Simulated attention event · no real driver data',
  occurredAt: demoRoute[index].recordedAt, elapsedSeconds: index * 60, speedMph: 24,
  latitude: demoRoute[index].latitude, longitude: demoRoute[index].longitude,
}));
export function demoPosition(progress: number): RoutePoint {
  const distance = Math.max(0, Math.min(1, progress)) * (demoRoute.length - 1);
  const index = Math.min(Math.floor(distance), demoRoute.length - 2);
  const fraction = distance - index;
  return { ...demoRoute[index], latitude: demoRoute[index].latitude + (demoRoute[index + 1].latitude - demoRoute[index].latitude) * fraction, longitude: demoRoute[index].longitude + (demoRoute[index + 1].longitude - demoRoute[index].longitude) * fraction };
}
