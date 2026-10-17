import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type InsuranceCadence = 'off' | 'weekly' | 'monthly';
export type InsuranceSettings = { providerId: string | null; customProviderName?: string; cadence: InsuranceCadence; consent: boolean; lastSharedAt?: string; mode?: 'manual' | 'automatic' };
type InsuranceContextValue = InsuranceSettings & { setCustomProviderName: (name: string) => void; setMode: (mode: 'manual' | 'automatic') => void; setProvider: (id: string | null) => void; setCadence: (cadence: InsuranceCadence) => void; setConsent: (consent: boolean) => void; shareDemoReport: () => void };
const initial: InsuranceSettings = { providerId: null, cadence: 'monthly', consent: false, mode: 'manual' };
const InsuranceContext = createContext<InsuranceContextValue | null>(null);
export const insuranceProviders = [{ id: 'state-farm', name: 'State Farm' }, { id: 'progressive', name: 'Progressive' }, { id: 'geico', name: 'GEICO' }, { id: 'allstate', name: 'Allstate' }, { id: 'other', name: 'Other insurer' }];

export function InsuranceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [settings, setSettings] = useState<InsuranceSettings>(initial);
  const [owner, setOwner] = useState<string | undefined>();
  useEffect(() => {
    let active = true;
    setOwner(undefined); setSettings(initial);
    if (!uid) return;
    // Never assign the old device-wide preferences/consent to an unknown account.
    AsyncStorage.getItem(`cubo-insurance:${uid}`).then(raw => {
      if (active && raw) setSettings({ ...initial, ...JSON.parse(raw) });
    }).catch(() => {}).finally(() => { if (active) setOwner(uid); });
    return () => { active = false; };
  }, [uid]);
  useEffect(() => {
    if (!uid || owner !== uid) return;
    void AsyncStorage.setItem(`cubo-insurance:${uid}`, JSON.stringify(settings)).catch(() => {});
  }, [settings, owner, uid]);
  const setCustomProviderName = useCallback((customProviderName: string) => setSettings(current => ({ ...current, customProviderName: customProviderName.slice(0, 80) })), []);
  const setProvider = useCallback((providerId: string | null) => setSettings((current) => ({ ...current, providerId })), []);
  const setMode = useCallback((mode: 'manual' | 'automatic') => setSettings(current => ({ ...current, mode })), []);
  const setCadence = useCallback((cadence: InsuranceCadence) => setSettings((current) => ({ ...current, cadence })), []);
  const setConsent = useCallback((consent: boolean) => setSettings((current) => ({ ...current, consent })), []);
  const shareDemoReport = useCallback(() => setSettings((current) => current.providerId ? { ...current, consent: true, lastSharedAt: new Date().toISOString() } : current), []);
  const value = useMemo(() => ({ ...(owner === uid && uid ? settings : initial), setCustomProviderName, setMode, setProvider, setCadence, setConsent, shareDemoReport }), [owner, uid, settings, setCustomProviderName, setMode, setProvider, setCadence, setConsent, shareDemoReport]);
  return <InsuranceContext.Provider value={value}>{children}</InsuranceContext.Provider>;
}
export function useInsurance() { const value = useContext(InsuranceContext); if (!value) throw new Error('useInsurance must be used within InsuranceProvider'); return value; }
