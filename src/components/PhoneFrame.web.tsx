import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { shadows } from '../theme/theme';

const PHONE_W = 340;
const PHONE_H = 780;

/**
 * Desktop browser “device” chrome so the app feels like a real phone preview.
 * The app content fills the inner safe area; you scroll/interact inside the frame.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const { colors, mode } = useAppearance();
  const [phone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) < 600);
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    if (!phone) return;
    const update = () => {
      // Physical screen orientation, not a short viewport caused by the keyboard.
      const angle = screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation;
      setLandscape(angle != null ? Math.abs(angle) % 180 === 90 : screen.width > screen.height);
    };
    const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
    void orientation?.lock?.('portrait').catch(() => {});
    update(); window.addEventListener('orientationchange', update); orientation?.addEventListener('change', update);
    return () => { window.removeEventListener('orientationchange', update); orientation?.removeEventListener('change', update); };
  }, [phone]);
  useEffect(() => {
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
    document.documentElement.style.colorScheme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.background);
  }, [colors.background, mode]);
  const styles = makeThemeStyles(colors);
  const { width } = useWindowDimensions();
  if (phone || width < 600) return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ flex: 1, opacity: landscape ? 0 : 1 }} pointerEvents={landscape ? 'none' : 'auto'} accessibilityElementsHidden={landscape} importantForAccessibility={landscape ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {landscape ? <View accessibilityRole="alert" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Keep CUBO upright</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center', maxWidth: 360 }}>Rotate your phone back to portrait. Your drive stays open. Adjust your phone only when safely parked.</Text>
    </View> : null}
  </View>;

  return (
    <View style={styles.page}>
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>CUBO preview — use the phone frame below. Allow camera for live detection.</Text>
      </View>
      <View style={styles.deviceOuter}>
        <View style={styles.bezel}>
          <View style={styles.notch} />
          <View style={styles.screenCutout}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  page: {
    flex: 1,
    width: '100%' as any,
    minHeight: '100vh' as any,
    backgroundColor: colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  hintWrap: {
    maxWidth: PHONE_W + 40,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  deviceOuter: {
    width: PHONE_W,
    height: PHONE_H,
    maxWidth: '100%' as any,
    maxHeight: '90vh' as any,
    ...shadows.phone,
  },
  bezel: {
    flex: 1,
    borderRadius: 44,
    backgroundColor: '#2A302C',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notch: {
    alignSelf: 'center',
    width: 120,
    height: 28,
    marginBottom: 6,
    borderRadius: 20,
    backgroundColor: '#1A1D1B',
  },
  screenCutout: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
});
