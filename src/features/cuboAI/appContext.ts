type Vehicle = { make: string; model: string; year: string; nickname: string; primary: boolean };
type Trip = { endedAt?: string; focusScore: number; attentionMeasured?: boolean; distanceMiles: number };
export type AccountSnapshot = { name?: string | null; vehicles: Vehicle[]; vehiclesReady: boolean; sessions: Trip[]; calibration: 'unknown' | 'completed' | 'not completed' };
const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, limit) : '';

/** Whitelist only: no locations, plates, contact details, camera records or other accounts. */
export function accountContext(input: AccountSnapshot): string {
  const selected = input.vehicles.find(v => v.primary) ?? input.vehicles[0];
  const car = (v: Vehicle) => [clean(v.year, 4), clean(v.make, 25), clean(v.model, 30)].filter(Boolean).join(' ');
  const completed = input.sessions.filter(t => t.endedAt);
  const measured = completed.filter(t => t.attentionMeasured && Number.isFinite(t.focusScore) && t.focusScore >= 0 && t.focusScore <= 100);
  const snapshot = {
    name: clean(input.name, 40) || 'unavailable',
    selectedVehicle: !input.vehiclesReady ? 'loading/unavailable' : selected ? car(selected) : 'none saved',
    vehicleNickname: input.vehiclesReady && selected ? clean(selected.nickname, 25) : '',
    vehicleCount: input.vehiclesReady ? input.vehicles.length : null,
    otherVehicles: input.vehiclesReady ? input.vehicles.filter(v => v !== selected).slice(0, 2).map(car) : [],
    completedTrips: completed.length, measuredTrips: measured.length,
    averageFocusOutOf100: measured.length ? Math.round(measured.reduce((n, t) => n + t.focusScore, 0) / measured.length) : null,
    savedMiles: Math.min(9999999, completed.reduce((n, t) => n + (Number.isFinite(t.distanceMiles) && t.distanceMiles > 0 ? t.distanceMiles : 0), 0)).toFixed(1),
    calibration: input.calibration,
  };
  // Keep JSON intact and stay within the existing small context allowance.
  while (JSON.stringify(snapshot).length > 800 && snapshot.otherVehicles.length) snapshot.otherVehicles.pop();
  if (JSON.stringify(snapshot).length > 800) { snapshot.name = 'unavailable'; snapshot.vehicleNickname = ''; }
  return JSON.stringify(snapshot);
}
