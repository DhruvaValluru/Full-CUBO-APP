import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type InsuranceCadence = 'off' | 'weekly' | 'monthly';
export type InsuranceSettings = { providerId: string | null; cadence: InsuranceCadence; consent: boolean; lastSharedAt?: string };
type InsuranceContextValue = InsuranceSettings & { setProvider: (id: string | null) => void; setCadence: (cadence: InsuranceCadence) => void; setConsent: (consent: boolean) => void; shareDemoReport: () => void };
const initial: InsuranceSettings = { providerId: null, cadence: 'off', consent: false };
const InsuranceContext = createContext<InsuranceContextValue | null>(null);
export const insuranceProviders = [{ id: 'state-farm', name: 'State Farm' }, { id: 'progressive', name: 'Progressive' }, { id: 'geico', name: 'GEICO' }, { id: 'allstate', name: 'Allstate' }, { id: 'other', name: 'Other insurer' }];

export function InsuranceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<InsuranceSettings>(() => { if (Platform.OS !== 'web' || typeof window === 'undefined') return initial; try { return JSON.parse(window.localStorage.getItem('cubo-insurance') ?? 'null') ?? initial; } catch { return initial; } });
  useEffect(() => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.localStorage.setItem('cubo-insurance', JSON.stringify(settings)); }, [settings]);
  const setProvider = useCallback((providerId: string | null) => setSettings((current) => ({ ...current, providerId })), []);
  const setCadence = useCallback((cadence: InsuranceCadence) => setSettings((current) => ({ ...current, cadence })), []);
  const setConsent = useCallback((consent: boolean) => setSettings((current) => ({ ...current, consent })), []);
  const shareDemoReport = useCallback(() => setSettings((current) => current.providerId && current.consent ? { ...current, lastSharedAt: new Date().toISOString() } : current), []);
  const value = useMemo(() => ({ ...settings, setProvider, setCadence, setConsent, shareDemoReport }), [settings, setProvider, setCadence, setConsent, shareDemoReport]);
  return <InsuranceContext.Provider value={value}>{children}</InsuranceContext.Provider>;
}
export function useInsurance() { const value = useContext(InsuranceContext); if (!value) throw new Error('useInsurance must be used within InsuranceProvider'); return value; }
