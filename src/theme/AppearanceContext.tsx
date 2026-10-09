import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { darkColors, lightColors, type AppColors } from './colors';

export type ColorMode = 'dark' | 'light';
type AppearanceValue = { mode: ColorMode; colors: AppColors; setMode: (mode: ColorMode) => void; toggleMode: () => void };

const AppearanceContext = createContext<AppearanceValue | null>(null);

function storedMode(): ColorMode {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem('cubo-color-mode') === 'light' ? 'light' : 'dark';
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(storedMode);
  const setMode = (next: ColorMode) => {
    setModeState(next);
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.localStorage.setItem('cubo-color-mode', next);
  };
  const value = useMemo(() => ({ mode, colors: mode === 'dark' ? darkColors : lightColors, setMode, toggleMode: () => setMode(mode === 'dark' ? 'light' : 'dark') }), [mode]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used within AppearanceProvider');
  return value;
}
