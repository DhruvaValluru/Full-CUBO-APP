import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';
import { FlatCarGlyph } from './FlatCarGlyph';
import { StarRow } from './StarRow';

const CAR_IMAGES = {
  prius: require('../../assets/car-prius.png'),
  sienna: require('../../assets/car-sienna.png'),
} as const;

export type ShowcaseVehicle = {
  id: string;
  model: string;
  time: string;
  risk: 'low' | 'mid';
  stars: number;
  tileColor: string;
  /** Use bundled 3D-style car artwork */
  carKey?: keyof typeof CAR_IMAGES;
};

type Props = {
  item: ShowcaseVehicle;
  onPress: () => void;
};

export function ShowcaseVehicleCard({ item, onPress }: Props) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  const isLow = item.risk === 'low';
  const dotColor = isLow ? colors.accentGreen : colors.mustard;
  const statusText = isLow ? 'Low Risk Driver' : 'Mid Risk Driver';

  return (
    <Pressable onPress={onPress} style={styles.press}>
      <View style={styles.card}>
        <View style={[styles.leftTile, { backgroundColor: item.tileColor }]}>
          {item.carKey ? (
            <Image source={CAR_IMAGES[item.carKey]} style={styles.carImg} resizeMode="contain" />
          ) : (
            <FlatCarGlyph color="#FFFFFF" fill="rgba(255,255,255,0.25)" />
          )}
        </View>
        <View style={styles.right}>
          <View style={styles.topRow}>
            <Text style={styles.model}>{item.model}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{item.time}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          <StarRow rating={item.stars} />
        </View>
      </View>
    </Pressable>
  );
}

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  press: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 96,
  },
  leftTile: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  carImg: {
    width: 74,
    height: 74,
  },
  right: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  model: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  time: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
