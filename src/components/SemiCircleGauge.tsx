import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';

type SemiCircleGaugeProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
};

export function SemiCircleGauge({ score, size = 260, strokeWidth = 12 }: SemiCircleGaugeProps) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);

  const w = size;
  const h = Math.round(size * 0.46);
  const cx = w / 2;
  const r = size * 0.37;
  const cyBase = h - strokeWidth / 2 - 2;
  const d = `M ${cx - r} ${cyBase} A ${r} ${r} 0 1 1 ${cx + r} ${cyBase}`;
  const arcLength = Math.PI * r;
  const clamped = Math.min(100, Math.max(0, score));
  const filled = (clamped / 100) * arcLength;

  return (
    <View style={[styles.wrap, { width: w }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Path d={d} stroke={colors.gaugeTrack} strokeWidth={strokeWidth} fill="none" strokeLinecap="butt" />
        <Path
          d={d}
          stroke={colors.gaugeProgress}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLength}`}
        />
      </Svg>
      <Text style={[styles.score, { marginTop: -(strokeWidth + 22) }]}>{Math.round(clamped)}</Text>
      <View style={[styles.scaleRow, { width: w - 16 }]}>
        <Text style={styles.scale}>0</Text>
        <Text style={styles.scale}>100</Text>
      </View>
    </View>
  );
}

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { alignItems: 'center' },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  scale: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '400',
  },
  score: {
    fontSize: 48,
    fontWeight: '300',
    color: colors.gaugeProgress,
    letterSpacing: -2,
    marginBottom: 0,
  },
});
