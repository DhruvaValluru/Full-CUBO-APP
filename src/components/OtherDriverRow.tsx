import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Driver } from '../types/app';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';
import { FlatPersonAvatar } from './FlatPersonAvatar';

type Props = {
  driver: Driver;
  vehicleLabel: string;
  onPress: () => void;
};

export function OtherDriverRow({ driver, vehicleLabel, onPress }: Props) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  return (
    <Pressable onPress={onPress} style={styles.press}>
      <View style={styles.row}>
        <View style={[styles.avatarRing, { borderColor: `${driver.avatarColor}55` }]}>
          <FlatPersonAvatar skin={driver.skinTone} shirt={driver.shirtColor} size={48} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.vehicle}>{vehicleLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  press: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatarRing: {
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  vehicle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
});
