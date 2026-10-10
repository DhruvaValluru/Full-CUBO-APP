import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { PlaceResult } from './searchPlaces';
type Places = { home?: PlaceResult; work?: PlaceResult; recent: PlaceResult[] };
type Value = Places & { remember: (place: PlaceResult) => void; save: (kind: 'home' | 'work', place: PlaceResult) => void };
const Context = createContext<Value | null>(null);
export function PlacesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Places>({ recent: [] });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { let mounted = true; setHydrated(false); setPlaces({ recent: [] }); if (!user) return; AsyncStorage.getItem(`cubo-places:${user.uid}`).then((raw) => { if (mounted) { if (raw) setPlaces(JSON.parse(raw)); setHydrated(true); } }).catch(() => { if (mounted) setHydrated(true); }); return () => { mounted = false; }; }, [user?.uid]);
  useEffect(() => { if (hydrated && user) void AsyncStorage.setItem(`cubo-places:${user.uid}`, JSON.stringify(places)); }, [places, hydrated, user?.uid]);
  const remember = (place: PlaceResult) => setPlaces((current) => ({ ...current, recent: [place, ...current.recent.filter((p) => p.latitude !== place.latitude || p.longitude !== place.longitude)].slice(0, 6) }));
  const save = (kind: 'home' | 'work', place: PlaceResult) => setPlaces((current) => ({ ...current, [kind]: place }));
  return <Context.Provider value={{ ...places, remember, save }}>{children}</Context.Provider>;
}
export function usePlaces() { const value = useContext(Context); if (!value) throw Error('PlacesProvider missing'); return value; }
