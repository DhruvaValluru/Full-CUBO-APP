import { StyleSheet, View } from 'react-native';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

/** Logo-style L-brackets for live camera HUD */
export function ViewfinderCorners({ alert }: { alert: boolean }) {
  const { colors: colors } = useAppearance();

  const c = alert ? colors.danger : colors.accentLime;
  const thick = 3;
  const arm = 22;
  const inset = 14;

  const h = { position: 'absolute' as const, height: thick, backgroundColor: c };
  const v = { position: 'absolute' as const, width: thick, backgroundColor: c };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[h, { top: inset, left: inset, width: arm }]} />
      <View style={[v, { top: inset, left: inset, height: arm }]} />

      <View style={[h, { top: inset, right: inset, width: arm }]} />
      <View style={[v, { top: inset, right: inset, height: arm }]} />

      <View style={[h, { bottom: inset, left: inset, width: arm }]} />
      <View style={[v, { bottom: inset, left: inset, height: arm }]} />

      <View style={[h, { bottom: inset, right: inset, width: arm }]} />
      <View style={[v, { bottom: inset, right: inset, height: arm }]} />
    </View>
  );
}
