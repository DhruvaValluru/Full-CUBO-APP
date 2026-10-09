import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type DeviceKind = 'cubo' | 'obd' | 'watch' | 'speaker' | 'carplay';
export type DeviceStatus = 'connected' | 'available' | 'coming-soon' | 'requires-native';
export type ConnectedDevice = {
  id: DeviceKind;
  name: string;
  detail: string;
  status: DeviceStatus;
  transport: 'BLE' | 'WatchConnectivity' | 'Bluetooth audio' | 'CarPlay';
  capabilities: string[];
};

const deviceCatalog: ConnectedDevice[] = [
  { id: 'cubo', name: 'CUBO Cruise 01', detail: 'Cabin camera · firmware 0.9', status: 'connected', transport: 'BLE', capabilities: ['attention-events', 'device-health', 'firmware'] },
  { id: 'obd', name: 'Vehicle telemetry', detail: 'Speed and ignition from a future OBD-II adapter', status: 'available', transport: 'BLE', capabilities: ['speed', 'ignition', 'diagnostics'] },
  { id: 'watch', name: 'Apple Watch', detail: 'Haptic safety alerts and one-tap check-ins', status: 'requires-native', transport: 'WatchConnectivity', capabilities: ['haptics', 'alerts', 'check-in'] },
  { id: 'speaker', name: 'Cabin speaker', detail: 'Spoken alerts through the selected audio route', status: 'available', transport: 'Bluetooth audio', capabilities: ['voice-alerts', 'volume-test'] },
  { id: 'carplay', name: 'Apple CarPlay', detail: 'Glanceable trip state; entitlement review required', status: 'coming-soon', transport: 'CarPlay', capabilities: ['trip-status', 'hazard-alerts'] },
];

type DeviceContextValue = { devices: ConnectedDevice[]; toggleConnection: (id: DeviceKind) => void; scanState: 'idle' | 'scanning' | 'complete'; scan: () => void };
const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Partial<Record<DeviceKind, DeviceStatus>>>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
    try { return JSON.parse(window.localStorage.getItem('cubo-device-status') ?? '{}'); } catch { return {}; }
  });
  const [scanState, setScanState] = useState<DeviceContextValue['scanState']>('idle');
  useEffect(() => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.localStorage.setItem('cubo-device-status', JSON.stringify(overrides)); }, [overrides]);
  const devices = useMemo(() => deviceCatalog.map((device) => ({ ...device, status: overrides[device.id] ?? device.status })), [overrides]);
  const toggleConnection = useCallback((id: DeviceKind) => {
    const device = deviceCatalog.find((item) => item.id === id);
    if (!device || device.status === 'coming-soon' || device.status === 'requires-native') return;
    setOverrides((current) => ({ ...current, [id]: (current[id] ?? device.status) === 'connected' ? 'available' : 'connected' }));
  }, []);
  const scan = useCallback(() => { setScanState('scanning'); setTimeout(() => setScanState('complete'), 900); }, []);
  const value = useMemo(() => ({ devices, toggleConnection, scanState, scan }), [devices, toggleConnection, scanState, scan]);
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevices() { const value = useContext(DeviceContext); if (!value) throw new Error('useDevices must be used within DeviceProvider'); return value; }
