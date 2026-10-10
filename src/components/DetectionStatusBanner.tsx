import { StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { radii, spacing } from '../theme/theme';

type DetectionStatusBannerProps = {
  distracted: boolean;
  title: string;
  subtitle: string;
};

export const DetectionStatusBanner = ({ distracted, title, subtitle }: DetectionStatusBannerProps) => {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  return (
    <View
      style={[
        styles.wrap,
        distracted
          ? { backgroundColor: '#2A1A1C', borderColor: colors.danger }
          : { backgroundColor: '#1A2418', borderColor: colors.accentGreen },
      ]}
    >
      <View style={[styles.dot, distracted ? { backgroundColor: colors.danger } : { backgroundColor: colors.accentLime }]} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 3,
    fontSize: 12,
  },
});
