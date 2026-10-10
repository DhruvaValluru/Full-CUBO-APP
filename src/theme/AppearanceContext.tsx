import { createContext, ReactNode, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type AppColors } from './colors';

export type ColorMode = 'dark' | 'light';
export type AppearancePreference = ColorMode | 'system';
type AppearanceValue = { mode: ColorMode; preference: AppearancePreference; colors: AppColors; setMode: (mode: AppearancePreference) => void };

const AppearanceContext = createContext<AppearanceValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemMode = useColorScheme();
  const [preference, updateMode] = useState<AppearancePreference>('system');
  useEffect(() => { let active = true; void AsyncStorage.getItem('cubo-color-mode').then(saved => { if (active && (saved === 'system' || saved === 'dark' || saved === 'light')) updateMode(saved); }).catch(() => undefined); return () => { active = false; }; }, []);
  const setMode = useCallback((next: AppearancePreference) => { updateMode(next); void AsyncStorage.setItem('cubo-color-mode', next).catch(() => undefined); }, []);
  const mode: ColorMode = preference === 'system' ? systemMode === 'dark' ? 'dark' : 'light' : preference;
  const value = useMemo(() => ({ mode, preference, colors: mode === 'dark' ? darkColors : lightColors, setMode }), [mode, preference, setMode]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used within AppearanceProvider');
  return value;
}
