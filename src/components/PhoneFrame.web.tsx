import { ReactNode } from 'react';
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
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);
  const { width } = useWindowDimensions();
  const fullScreen = width < 600;
  // Keep the same child ancestry across breakpoints: replacing wrappers remounts
  // auth, navigation and active-drive state when the browser changes width.
  return (
    <View style={fullScreen ? { flex: 1, backgroundColor: colors.background } : styles.page}>
      <View style={[styles.hintWrap, fullScreen && { display: 'none' }]}>
        <Text style={styles.hint}>CUBO preview — use the phone frame below. Allow camera for live detection.</Text>
      </View>
      <View style={fullScreen ? { flex: 1, width: '100%' } : styles.deviceOuter}>
        <View style={fullScreen ? { flex: 1 } : styles.bezel}>
          <View style={[styles.notch, fullScreen && { display: 'none' }]} />
          <View style={[styles.screenCutout, fullScreen && { borderRadius: 0 }]}>
            {children}
          </View>
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
