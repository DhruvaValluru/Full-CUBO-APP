import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function AppHeader({ title, eyebrow, onBack, action }: { title: string; eyebrow?: string; onBack?: () => void; action?: React.ReactNode }) {
  const { colors } = useAppearance();
  return <View style={[styles.root, { backgroundColor: colors.featureSurface }]}>
    {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={6} onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></Pressable> : null}
    <View style={styles.copy}><Text style={styles.title}>{title}</Text>{eyebrow ? <Text style={styles.subtitle}>{eyebrow}</Text> : null}</View>
    {action ? <View style={styles.action}>{action}</View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: -20,
    marginTop: -8,
    marginBottom: 16,
    minHeight: 112,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)' },
  copy: { flex: 1, justifyContent: 'center' },
  title: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 29, lineHeight: 34, letterSpacing: -1 },
  subtitle: { color: 'rgba(235,250,242,.72)', fontFamily: 'Manrope_500Medium', fontSize: 11, lineHeight: 16, marginTop: 3 },
  action: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
