import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const tones = {
  success: { color: colors.gaugeProgress, backgroundColor: colors.primarySoft },
  warning: { color: colors.amber, backgroundColor: colors.amberSoft },
  danger: { color: colors.danger, backgroundColor: colors.dangerSoft },
  neutral: { color: colors.textSecondary, backgroundColor: colors.white08 },
};

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.pill, { backgroundColor: tones[tone].backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: tones[tone].color }]} />
      <Text style={[styles.label, { color: tones[tone].color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});
