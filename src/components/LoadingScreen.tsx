import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from '../hooks/useReducedMotion';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
export function LoadingScreen({ label, brand = false }: { label?: string; brand?: boolean }) {
  const { colors: c, mode } = useAppearance(); const s = makeStyles(c);
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(.55)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    const animation = Animated.timing(entrance, { toValue: 1, duration: reduced ? 80 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [entrance, reduced]);
  useEffect(() => {
    if (reduced || brand) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: .55, duration: 450, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, reduced, brand]);
  return <SafeAreaView style={s.root}><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><Animated.View style={[s.center, { opacity: entrance }]}>
    <Text style={s.brand}>CUBO</Text>
    {!brand && <Animated.View accessibilityRole="progressbar" accessibilityLabel="Loading" style={[s.dots, { opacity: pulse }]}><View style={s.dot} /><View style={s.dot} /><View style={s.dot} /></Animated.View>}
    {label ? <Text style={s.label}>{label}</Text> : null}
  </Animated.View></SafeAreaView>;
}
const makeStyles = (c: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.card },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { color: c.accent, fontSize: 48, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 2 },
  dots: { flexDirection: 'row', gap: 8, height: 24, marginTop: 20, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  label: { color: c.textSecondary, fontSize: 12, marginTop: 12 },
});
