import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getDriverById } from '../data/mockData';
import { Vehicle } from '../types/app';
import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';
import { FlatCarGlyph } from './FlatCarGlyph';
import { FlatPersonAvatar } from './FlatPersonAvatar';
import { GlassCard } from './GlassCard';

type VehicleCardProps = {
  vehicle: Vehicle;
  onPress: () => void;
  actionLabel?: string;
};

export const VehicleCard = ({
  vehicle,
  onPress,
  actionLabel = 'Open Vehicle',
}: VehicleCardProps) => {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  const driver = getDriverById(vehicle.driverId);
  const statusColor =
    vehicle.status === 'Live'
      ? colors.success
      : vehicle.status === 'Ready'
        ? colors.primaryStrong
        : colors.warning;

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: `${vehicle.accent}28` }]}>
            <FlatCarGlyph color={vehicle.accent} />
          </View>
          <View style={styles.content}>
            <View style={styles.topLine}>
              <View>
                <Text style={styles.name}>{vehicle.name}</Text>
                <Text style={styles.model}>{vehicle.model}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{vehicle.status}</Text>
              </View>
            </View>
            <View style={styles.driverRow}>
              {driver ? (
                <FlatPersonAvatar skin={driver.skinTone} shirt={driver.shirtColor} size={44} />
              ) : (
                <View style={styles.avatarFallback} />
              )}
              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{driver?.name ?? 'Unknown Driver'}</Text>
                <Text style={styles.detail}>{vehicle.cabinLabel}</Text>
              </View>
            </View>
            <View style={styles.footer}>
              <Text style={styles.detail}>{vehicle.lastEvent}</Text>
              <View style={styles.actionRow}>
                <Text style={styles.action}>{actionLabel}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
              </View>
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
};

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  model: {
    color: colors.textMuted,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
  },
  driverMeta: {
    flex: 1,
  },
  driverName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.black06,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  action: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
