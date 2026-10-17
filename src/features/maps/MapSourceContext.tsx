import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
export type MapSource = 'apple' | 'web';
type Value = { source: MapSource; revision: number; appleAvailable: boolean; setSource: (source: MapSource) => void; error: string };
const Context = createContext<Value | null>(null);
export function MapSourceProvider({ children }: { children: ReactNode }) {
  const appleAvailable = Platform.OS === 'ios';
  const [source, updateSource] = useState<MapSource>(appleAvailable ? 'apple' : 'web');
  const [revision, setRevision] = useState(0), [error, setError] = useState('');
  const edited = useRef(false), writes = useRef(Promise.resolve());
  useEffect(() => {
    let live = true;
    void AsyncStorage.getItem('cubo-map-source-v1').then(saved => {
      if (live && !edited.current && (saved === 'web' || saved === 'apple')) updateSource(saved === 'apple' && !appleAvailable ? 'web' : saved);
    }).catch(() => undefined);
    return () => { live = false; };
  }, [appleAvailable]);
  const setSource = useCallback((next: MapSource) => {
    if (next === 'apple' && !appleAvailable) return;
    edited.current = true; updateSource(next); setRevision(value => value + 1); setError('');
    writes.current = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem('cubo-map-source-v1', next)).catch(() => setError('Map source changed, but could not be saved on this device.'));
  }, [appleAvailable]);
  const value = useMemo(() => ({ source, revision, appleAvailable, setSource, error }), [source, revision, appleAvailable, setSource, error]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMapSource() {
  const context = useContext(Context);
  if (!context) throw new Error('MapSourceProvider is missing');
  return context;
}
