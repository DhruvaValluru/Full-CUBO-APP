import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function AppHeader({ title, eyebrow, onBack, action }: { title: string; eyebrow?: string; onBack?: () => void; action?: React.ReactNode }) {
  const { colors } = useAppearance();
  return <View style={styles.root}>{onBack ? <Pressable onPress={onBack} style={[styles.back, { backgroundColor: colors.card }]}><Ionicons name="arrow-back" size={19} color={colors.text} /></Pressable> : null}<View style={styles.copy}>{eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}<Text style={[styles.title, { color: colors.text }]}>{title}</Text></View>{action ?? null}</View>;
}

const styles = StyleSheet.create({ root: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 8 }, back: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, eyebrow: { fontFamily: 'Manrope_700Bold', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 3 }, title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 27, letterSpacing: -0.8 } });
