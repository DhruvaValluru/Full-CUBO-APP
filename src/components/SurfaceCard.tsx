import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppearance } from '../theme/AppearanceContext';

export function SurfaceCard({ children, style, tone = 'app' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'app' | 'dark' }) {
  const { colors } = useAppearance();
  return <View style={[styles.root, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }, style]}>{children}</View>;
}

const styles = StyleSheet.create({ root: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 18, shadowOpacity: 0.055, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 1 } });
