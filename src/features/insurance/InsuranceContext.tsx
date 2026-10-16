import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type InsuranceCadence = 'off' | 'weekly' | 'monthly';
export type InsuranceSettings = { providerId: string | null; customProviderName?: string; cadence: InsuranceCadence; consent: boolean; lastSharedAt?: string; mode?: 'manual' | 'automatic' };
type InsuranceContextValue = InsuranceSettings & { setCustomProviderName: (name: string) => void; setMode: (mode: 'manual' | 'automatic') => void; setProvider: (id: string | null) => void; setCadence: (cadence: InsuranceCadence) => void; setConsent: (consent: boolean) => void; shareDemoReport: () => void };
const initial: InsuranceSettings = { providerId: null, cadence: 'monthly', consent: false, mode: 'manual' };
const InsuranceContext = createContext<InsuranceContextValue | null>(null);
export const insuranceProviders = [{ id: 'state-farm', name: 'State Farm' }, { id: 'progressive', name: 'Progressive' }, { id: 'geico', name: 'GEICO' }, { id: 'allstate', name: 'Allstate' }, { id: 'other', name: 'Other insurer' }];

export function InsuranceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<InsuranceSettings>(() => { if (Platform.OS !== 'web' || typeof window === 'undefined') return initial; try { return JSON.parse(window.localStorage.getItem('cubo-insurance') ?? 'null') ?? initial; } catch { return initial; } });
  const [hydrated, setHydrated] = useState(Platform.OS === 'web');
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    AsyncStorage.getItem('cubo-insurance').then(raw => {
      if (active && raw) setSettings(current => ({ ...current, ...JSON.parse(raw) }));
    }).catch(() => {}).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try { window.localStorage.setItem('cubo-insurance', JSON.stringify(settings)); } catch { /* Storage may be unavailable in private browsing. */ }
    } else {
      AsyncStorage.setItem('cubo-insurance', JSON.stringify(settings)).catch(() => {});
    }
  }, [settings, hydrated]);
  const setCustomProviderName = useCallback((customProviderName: string) => setSettings(current => ({ ...current, customProviderName: customProviderName.slice(0, 80) })), []);
  const setProvider = useCallback((providerId: string | null) => setSettings((current) => ({ ...current, providerId })), []);
  const setMode = useCallback((mode: 'manual' | 'automatic') => setSettings(current => ({ ...current, mode })), []);
  const setCadence = useCallback((cadence: InsuranceCadence) => setSettings((current) => ({ ...current, cadence })), []);
  const setConsent = useCallback((consent: boolean) => setSettings((current) => ({ ...current, consent })), []);
  const shareDemoReport = useCallback(() => setSettings((current) => current.providerId ? { ...current, consent: true, lastSharedAt: new Date().toISOString() } : current), []);
  const value = useMemo(() => ({ ...settings, setCustomProviderName, setMode, setProvider, setCadence, setConsent, shareDemoReport }), [settings, setCustomProviderName, setMode, setProvider, setCadence, setConsent, shareDemoReport]);
  return <InsuranceContext.Provider value={value}>{children}</InsuranceContext.Provider>;
}
export function useInsurance() { const value = useContext(InsuranceContext); if (!value) throw new Error('useInsurance must be used within InsuranceProvider'); return value; }
