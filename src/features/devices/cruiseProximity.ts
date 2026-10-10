/** Hardware integration contract. Feed this only after pairing and device authentication. */
export type CruiseBinding = { deviceId: string; vehicleId: string };
export type CruiseSample = { deviceId: string; rssi: number; timestamp: number; authenticated: boolean };
export interface CruiseTransport {
  startScan: (onSample: (sample: CruiseSample) => void) => Promise<() => void>;
  pair: (deviceId: string) => Promise<{ authenticated: boolean }>;
  readDiagnostics?: (deviceId: string) => Promise<CruiseDiagnostics>;
  readCameraFrame?: (deviceId: string) => Promise<string>;
}
export type CruiseDiagnostics = { batteryPercent: number | null; charging: boolean; firmware: string; cameraHealthy: boolean | null; temperatureC: number | null; checkedAt: string };
export type CruiseMatch = { state: 'none' | 'ambiguous' | 'nearby'; vehicleId?: string };
/** RSSI is not a distance measurement. Require stable samples, then reject close competing cars. */
export function matchNearbyCruise(bindings: CruiseBinding[], samples: CruiseSample[], now = Date.now()): CruiseMatch {
  const candidates = bindings.flatMap(binding => {
    const recent = samples.filter(sample => sample.deviceId === binding.deviceId && sample.authenticated && sample.timestamp <= now && now - sample.timestamp < 8000 && Number.isFinite(sample.rssi));
    if (recent.length < 3 || Math.max(...recent.map(s => s.timestamp)) - Math.min(...recent.map(s => s.timestamp)) < 2000) return [];
    const average = recent.reduce((total, sample) => total + sample.rssi, 0) / recent.length;
    return average > -65 ? [{ vehicleId: binding.vehicleId, average }] : [];
  }).sort((a, b) => b.average - a.average);
  if (!candidates.length) return { state: 'none' };
  if (candidates[1] && candidates[0].vehicleId !== candidates[1].vehicleId && candidates[0].average - candidates[1].average < 10) return { state: 'ambiguous' };
  return { state: 'nearby', vehicleId: candidates[0].vehicleId };
}
