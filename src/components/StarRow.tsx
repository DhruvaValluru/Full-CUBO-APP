import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

type StarRowProps = {
  rating: number;
  max?: number;
};

export function StarRow({ rating, max = 5 }: StarRowProps) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = max - full - half;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Trip Rating:</Text>
      <View style={styles.stars}>
        {Array.from({ length: full }).map((_, i) => (
          <Ionicons key={`f-${i}`} name="star" size={14} color={colors.star} />
        ))}
        {half === 1 ? <Ionicons name="star-half" size={14} color={colors.star} /> : null}
        {Array.from({ length: empty }).map((_, i) => (
          <Ionicons key={`e-${i}`} name="star-outline" size={14} color={colors.textTertiary} />
        ))}
      </View>
    </View>
  );
}

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
});
