import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';

export type SavedVehicle = { id: string; nickname: string; make: string; model: string; year: string; plate: string; paint?: string; primary: boolean };
type VehicleContextValue = { vehicles: SavedVehicle[]; addVehicle: (vehicle: Omit<SavedVehicle, 'id' | 'primary'>) => SavedVehicle; updateVehicle: (id: string, vehicle: Omit<SavedVehicle, 'id' | 'primary'>) => void; deleteVehicle: (id: string) => void; setPrimary: (id: string) => void };
const initial: SavedVehicle[] = [{ id: 'toyota-prius', nickname: 'Daily driver', make: 'Toyota', model: 'Prius', year: '2021', plate: 'CUB-001', primary: true }];
const VehicleContext = createContext<VehicleContextValue | null>(null);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<SavedVehicle[]>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { let mounted = true; setHydrated(false); setVehicles(initial); if (!user) return; AsyncStorage.getItem(`cubo-vehicles:${user.uid}`).then(raw => { if (mounted) { if (raw) setVehicles(JSON.parse(raw)); setHydrated(true); } }).catch(() => { if (mounted) setHydrated(true); }); return () => { mounted = false; }; }, [user?.uid]);
  useEffect(() => { if (hydrated && user) void AsyncStorage.setItem(`cubo-vehicles:${user.uid}`, JSON.stringify(vehicles)).catch(() => undefined); }, [vehicles, hydrated, user?.uid]);
  const addVehicle = useCallback((input: Omit<SavedVehicle, 'id' | 'primary'>) => {
    const vehicle = { ...input, id: `vehicle-${Date.now()}`, primary: false };
    setVehicles((current) => [...current, vehicle]); return vehicle;
  }, []);
  const updateVehicle = useCallback((id: string, input: Omit<SavedVehicle, 'id' | 'primary'>) => setVehicles((current) => current.map((item) => item.id === id ? { ...item, ...input } : item)), []);
  const deleteVehicle = useCallback((id: string) => setVehicles((current) => {
    const remaining = current.filter((item) => item.id !== id);
    if (!remaining.length) return [];
    return remaining.some((item) => item.primary) ? remaining : remaining.map((item, index) => ({ ...item, primary: index === 0 }));
  }), []);
  const setPrimary = useCallback((id: string) => setVehicles((current) => current.some(item => item.id === id) ? current.map((item) => ({ ...item, primary: item.id === id })) : current), []);
  const value = useMemo(() => ({ vehicles, addVehicle, updateVehicle, deleteVehicle, setPrimary }), [vehicles, addVehicle, updateVehicle, deleteVehicle, setPrimary]);
  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}
export function useVehicles() { const value = useContext(VehicleContext); if (!value) throw new Error('useVehicles must be used within VehicleProvider'); return value; }
