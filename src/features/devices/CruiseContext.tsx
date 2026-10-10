import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useVehicles } from '../vehicles/VehicleContext';
import { matchNearbyCruise, type CruiseBinding, type CruiseSample, type CruiseTransport, type CruiseDiagnostics } from './cruiseProximity';
type Value = {
  available: boolean; message: string; bindings: CruiseBinding[]; discovered: string[];
  registerTransport: (transport: CruiseTransport) => () => void;
  scan: () => Promise<void>;
  pair: (deviceId: string, vehicleId: string) => Promise<void>;
  diagnostics: Record<string, CruiseDiagnostics>;
  readDiagnostics: (deviceId: string) => Promise<void>;
  readCameraFrame: (deviceId: string) => Promise<string>;
};
const Context = createContext<Value | null>(null);
export function CruiseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); const { setPrimary, vehicles } = useVehicles();
  const transport = useRef<CruiseTransport | null>(null); const stopScan = useRef<(() => void) | null>(null);
  const [available, setAvailable] = useState(false); const [bindings, setBindings] = useState<CruiseBinding[]>([]);
  const [diagnostics, setDiagnostics] = useState<Record<string, CruiseDiagnostics>>({});
  useEffect(() => { setDiagnostics({}); }, [user?.uid, available]);
  const [samples, setSamples] = useState<CruiseSample[]>([]); const [discovered, setDiscovered] = useState<string[]>([]);
  const [message, setMessage] = useState('Real pairing requires CUBO Cruise hardware and a development build.');
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { let mounted = true; stopScan.current?.(); setSamples([]); setDiscovered([]); setBindings([]); setHydrated(false); if (!user) return; AsyncStorage.getItem(`cubo-cruise:${user.uid}`).then(raw => { if (mounted) { if (raw) setBindings(JSON.parse(raw)); setHydrated(true); } }).catch(() => { if (mounted) setHydrated(true); }); return () => { mounted = false; stopScan.current?.(); }; }, [user?.uid]);
  useEffect(() => { if (hydrated && user) void AsyncStorage.setItem(`cubo-cruise:${user.uid}`, JSON.stringify(bindings)).catch(() => undefined); }, [bindings, hydrated, user?.uid]);
  useEffect(() => {
    const match = matchNearbyCruise(bindings.filter(b => vehicles.some(v => v.id === b.vehicleId)), samples);
    if (match.state === 'nearby' && match.vehicleId) { setPrimary(match.vehicleId); setMessage('Nearby paired CUBO Cruise recognized. Vehicle selected.'); }
    else if (match.state === 'ambiguous') setMessage('Two nearby vehicles detected. Choose your vehicle manually.');
  }, [samples, bindings, setPrimary]);
  const registerTransport = useCallback((adapter: CruiseTransport) => {
    transport.current = adapter; setAvailable(true); setMessage('CUBO Cruise transport ready. Scan to pair.');
    return () => { stopScan.current?.(); stopScan.current = null; transport.current = null; setAvailable(false); };
  }, []);
  const scan = useCallback(async () => {
    const adapter = transport.current; if (!adapter) { setMessage('Bluetooth scanning is unavailable in Expo Go. Use a development build with the Cruise adapter.'); return; }
    stopScan.current?.(); setSamples([]); setDiscovered([]); setMessage('Looking for nearby CUBO Cruise devices…');
    try { stopScan.current = await adapter.startScan(sample => { setDiscovered(current => current.includes(sample.deviceId) ? current : [...current, sample.deviceId]); setSamples(current => [...current.filter(s => sample.timestamp - s.timestamp < 8000), sample].slice(-120)); }); } catch { setMessage('Could not scan. Check Bluetooth permission and your Cruise box.'); }
  }, []);
  const pair = useCallback(async (deviceId: string, vehicleId: string) => {
    const adapter = transport.current; if (!adapter || !vehicles.some(vehicle => vehicle.id === vehicleId)) return;
    try { const result = await adapter.pair(deviceId); if (!result.authenticated) throw Error(); setBindings(current => [...current.filter(b => b.deviceId !== deviceId && b.vehicleId !== vehicleId), { deviceId, vehicleId }]); setMessage('Cruise paired to this vehicle. Nearby recognition is ready.'); } catch { setMessage('Pairing failed. The device identity could not be verified.'); }
  }, [vehicles]);
  useEffect(() => {
    if (!available || !user) return;
    void scan();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void scan(); else { stopScan.current?.(); stopScan.current = null; } });
    return () => { subscription.remove(); stopScan.current?.(); stopScan.current = null; };
  }, [available, user?.uid, scan]);
  const readDiagnostics = async (deviceId: string) => {
    const adapter = transport.current;
    if (!bindings.some(item => item.deviceId === deviceId) || !adapter?.readDiagnostics) throw Error('Diagnostics need a connected, paired CUBO Cruise.');
    const data = await adapter.readDiagnostics(deviceId);
    if (data.batteryPercent !== null && (!Number.isFinite(data.batteryPercent) || data.batteryPercent < 0 || data.batteryPercent > 100)) throw Error('Invalid battery reading from Cruise.');
    setDiagnostics(current => ({ ...current, [deviceId]: data }));
  };
  const readCameraFrame = async (deviceId: string) => {
    const adapter = transport.current;
    if (!bindings.some(item => item.deviceId === deviceId) || !adapter?.readCameraFrame) throw Error('The Cruise camera requires connected hardware with camera support.');
    return adapter.readCameraFrame(deviceId);
  };
  return <Context.Provider value={{ available, message, bindings, discovered, registerTransport, scan, pair, diagnostics, readDiagnostics, readCameraFrame }}>{children}</Context.Provider>;
}
export function useCruise() { const value = useContext(Context); if (!value) throw Error('CruiseProvider missing'); return value; }
