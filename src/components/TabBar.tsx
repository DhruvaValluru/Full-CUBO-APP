import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrives } from '../features/drives/DriveContext';
import { useNavChrome } from '../features/navigation/NavChromeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
const icons = { Home: 'home-outline', Map: 'map-outline', Activity: 'receipt-outline', Account: 'person-outline' } as const;
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors: c } = useAppearance(); const s = makeStyles(c);
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets(); const { activeSession } = useDrives();
  const { hidden, setHidden } = useNavChrome(); const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => { setHidden(false); }, [state.index, setHidden]);
  useEffect(() => { Animated.timing(progress, { toValue: hidden ? 0 : 1, duration: reduced ? 80 : hidden ? 160 : 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start(); }, [hidden, progress, reduced]);
  if (activeSession) return null;
  return <Animated.View pointerEvents={hidden ? 'none' : 'auto'} style={[s.bar, { bottom: Math.max(insets.bottom, 12), opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 32, 0] }) }] }]}>{state.routes.map((route, index) => <MotionPressable accessibilityRole="tab" accessibilityState={{ selected: index === state.index }} key={route.key} style={[s.item, index === state.index && s.selected]} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!event.defaultPrevented) navigation.navigate(route.name); }}><Ionicons name={icons[route.name as keyof typeof icons]} size={21} color={index === state.index ? c.onAccent : c.textSecondary} /><Text style={[s.label, index === state.index && { color: c.onAccent }]}>{route.name}</Text></MotionPressable>)}</Animated.View>;
}
const makeStyles = (c: AppColors) => StyleSheet.create({ bar: { position: 'absolute', left: 16, right: 16, backgroundColor: c.cardElevated, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 26, padding: 6, flexDirection: 'row', shadowColor: c.shadow, shadowOpacity: .18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 }, item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 20 }, selected: { backgroundColor: c.accent, borderWidth: 1, borderColor: c.accentSecondary }, label: { color: c.textSecondary, fontSize: 10, fontFamily: 'Manrope_700Bold' } });
