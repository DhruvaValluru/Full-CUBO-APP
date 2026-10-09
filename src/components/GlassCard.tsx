import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '../theme/AppearanceContext';
import { radii } from '../theme/theme';

type GlassCardProps = {
  children: ReactNode;
  style?: object;
  tone?: 'app' | 'dark';
};

export const GlassCard = ({ children, style, tone = 'app' }: GlassCardProps) => {
  const { colors } = useAppearance();
  const palette = tone === 'dark' ? { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#111113' } : { borderColor: colors.border, backgroundColor: colors.card };
  return <View style={[styles.card, palette, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
