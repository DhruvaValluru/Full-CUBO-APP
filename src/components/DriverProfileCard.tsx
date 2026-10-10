import { StyleSheet, Text, View } from 'react-native';

import { Driver } from '../types/app';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';
import { FlatPersonAvatar } from './FlatPersonAvatar';
import { GlassCard } from './GlassCard';

type DriverProfileCardProps = {
  driver: Driver;
};

export const DriverProfileCard = ({ driver }: DriverProfileCardProps) => {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <FlatPersonAvatar skin={driver.skinTone} shirt={driver.shirtColor} size={56} />
        <View style={styles.copy}>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.role}>{driver.relation}</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Location</Text>
          <Text style={styles.statValue}>{driver.location}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Alerts this week</Text>
          <Text style={styles.statValue}>{driver.alertsThisWeek}</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  role: {
    color: colors.textMuted,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.black06,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: colors.text,
    fontWeight: '700',
  },
});
