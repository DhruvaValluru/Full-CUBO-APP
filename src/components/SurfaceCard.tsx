import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function SurfaceCard({ children, style, tone = 'app' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'app' | 'dark' }) {
  const { colors } = useAppearance();
  const palette = tone === 'dark' ? { card: '#151820', border: 'rgba(255,255,255,.08)', shadow: 'rgba(0,0,0,.4)' } : colors;
  return <View style={[styles.root, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, style]}>{children}</View>;
}

const styles = StyleSheet.create({ root: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 } });
