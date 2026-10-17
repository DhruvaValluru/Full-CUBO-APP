import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrives } from '../features/drives/DriveContext';
import { MotionPressable } from './MotionPressable';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
const icons = { Home: 'home-outline', Map: 'map-outline', Activity: 'receipt-outline', Account: 'person-outline' } as const;
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors: c } = useAppearance(); const s = makeStyles(c);
  const insets = useSafeAreaInsets(); const { activeSession } = useDrives();
  // Primary navigation remains reachable after scrolling or returning from a detail screen.
  if (activeSession) return null;
  return <View style={[s.bar, { bottom: Math.max(insets.bottom, 12) }]}>{state.routes.map((route, index) => <MotionPressable accessibilityRole="tab" accessibilityLabel={route.name} accessibilityState={{ selected: index === state.index }} key={route.key} style={[s.item, index === state.index && s.selected]} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (index !== state.index && !event.defaultPrevented) { Keyboard.dismiss(); navigation.navigate(route.name, route.params); } }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}><Ionicons name={icons[route.name as keyof typeof icons]} size={21} color={index === state.index ? c.onAccent : c.textSecondary} /><Text style={[s.label, index === state.index && { color: c.onAccent }]}>{route.name}</Text></MotionPressable>)}</View>;
}
const makeStyles = (c: AppColors) => StyleSheet.create({ bar: { position: 'absolute', left: 16, right: 16, backgroundColor: c.cardElevated, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 26, padding: 6, flexDirection: 'row', shadowColor: c.shadow, shadowOpacity: .18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 }, item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 20 }, selected: { backgroundColor: c.accent, borderWidth: 1, borderColor: c.accentSecondary }, label: { color: c.textSecondary, fontSize: 10, fontFamily: 'Manrope_700Bold' } });
