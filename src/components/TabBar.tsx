import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrives } from '../features/drives/DriveContext';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
const icons = {
  Home: { idle: 'home-outline', active: 'home' }, Map: { idle: 'map-outline', active: 'map' },
  Activity: { idle: 'receipt-outline', active: 'receipt' }, Account: { idle: 'person-outline', active: 'person' },
  Garage: { idle: 'car-sport-outline', active: 'car-sport' },
} as const;
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors: c } = useAppearance(); const s = makeStyles(c);
  const insets = useSafeAreaInsets(); const { activeSession } = useDrives();
  // Primary navigation remains reachable after scrolling or returning from a detail screen.
  if (activeSession) return null;
  return <View style={[s.bar, { bottom: Math.max(insets.bottom, 12) }]}>{state.routes.map((route, index) => { const selected = index === state.index; const icon = icons[route.name as keyof typeof icons]; return <MotionPressable accessibilityRole="tab" accessibilityLabel={route.name} accessibilityState={{ selected }} key={route.key} style={[s.item, selected && s.selected]} scaleTo={.96} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) { Keyboard.dismiss(); navigation.navigate(route.name, route.params); } }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}><View style={[s.iconShell, selected && s.iconSelected]}><Ionicons name={selected ? icon.active : icon.idle} size={23} color={selected ? c.accent : c.textSecondary} /></View><Text style={[s.label, selected && s.labelSelected]}>{route.name}</Text></MotionPressable>; })}</View>;
}
const makeStyles = (c: AppColors) => StyleSheet.create({ bar: { position: 'absolute', left: 14, right: 14, minHeight: 72, backgroundColor: c.cardElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderStrong, borderRadius: 26, paddingHorizontal: 7, paddingVertical: 6, flexDirection: 'row', shadowColor: c.shadow, shadowOpacity: .2, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 }, item: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 17 }, selected: { backgroundColor: 'transparent' }, iconShell: { width: 32, height: 29, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, iconSelected: { backgroundColor: 'transparent' }, label: { color: c.textSecondary, fontSize: 10, fontFamily: 'Manrope_600SemiBold' }, labelSelected: { color: c.accent, fontFamily: 'Manrope_800ExtraBold' } });
