import { createContext, useContext, type ReactNode } from 'react';
export type DeviceKind = 'cubo';
export type DeviceStatus = 'connected' | 'requires-native';
export type ConnectedDevice = { id: DeviceKind; name: string; detail: string; status: DeviceStatus; transport: 'BLE'; capabilities: string[] };
const devices: ConnectedDevice[] = [{ id: 'cubo', name: 'CUBO Cruise', detail: 'Optional dedicated safety camera', status: 'requires-native', transport: 'BLE', capabilities: ['camera', 'battery', 'diagnostics'] }];
const Context = createContext({ devices });
export function DeviceProvider({ children }: { children: ReactNode }) { return <Context.Provider value={{ devices }}>{children}</Context.Provider>; }
export function useDevices() { return useContext(Context); }
