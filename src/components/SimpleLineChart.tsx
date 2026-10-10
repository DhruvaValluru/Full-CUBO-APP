import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { useAppearance } from '../theme/AppearanceContext';
import type { AppColors } from '../theme/colors';
import { spacing } from '../theme/theme';

export type LineChartSummary = { label: string; value: string };

type SimpleLineChartProps = {
  title: string;
  subtitle?: string;
  data: number[];
  labels: string[];
  width?: number;
  height?: number;
  lineColor?: string;
  unit?: string;
  /** Pre-built summary tiles; overrides autoSummary if both set. */
  summaries?: LineChartSummary[];
  /** Derive Latest / vs start / Period avg from data. */
  autoSummary?: 'currency' | 'index';
};

function buildAutoSummaries(data: number[], mode: 'currency' | 'index'): LineChartSummary[] {
  if (!data.length) return [];
  const first = data[0];
  const last = data[data.length - 1];
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const deltaPct = ((last - first) / (Math.abs(first) || 1)) * 100;
  const fmt = (n: number) => (mode === 'currency' ? `$${Math.round(n)}` : `${Math.round(n)}`);
  const sign = deltaPct >= 0 ? '+' : '';
  return [
    { label: 'Latest', value: fmt(last) },
    { label: 'vs start', value: `${sign}${deltaPct.toFixed(1)}%` },
    { label: 'Period avg', value: fmt(avg) },
  ];
}

/** Minimal line chart for insurance / analytics (SVG). */
export function SimpleLineChart({
  title,
  subtitle,
  data,
  labels,
  width = 320,
  height = 140,
  lineColor: suppliedLineColor,
  unit = '',
  summaries,
  autoSummary,
}: SimpleLineChartProps) {
  const { colors: colors } = useAppearance();
  const styles = makeThemeStyles(colors);
  const lineColor = suppliedLineColor ?? colors.gaugeProgress;

  const summaryTiles = summaries ?? (autoSummary ? buildAutoSummaries(data, autoSummary) : []);
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const span = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padL + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = padT + innerH - ((v - min) / span) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + t * innerH);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {summaryTiles.length > 0 ? (
        <View style={styles.summaryRow}>
          {summaryTiles.map((s, i) => (
            <View key={i} style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{s.label}</Text>
              <Text style={styles.summaryValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Svg width={width} height={height}>
        {gridYs.map((gy, i) => (
          <Line
            key={i}
            x1={padL}
            y1={gy}
            x2={width - padR}
            y2={gy}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        <Polyline points={points} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((v, i) => {
          const x = padL + (i / Math.max(data.length - 1, 1)) * innerW;
          const y = padT + innerH - ((v - min) / span) * innerH;
          return <Circle key={i} cx={x} cy={y} r={4} fill={lineColor} />;
        })}
      </Svg>
      <View style={[styles.labels, { width }]}>
        {labels.map((lb, i) => (
          <Text key={i} style={styles.label}>
            {lb}
          </Text>
        ))}
      </View>
      <Text style={styles.unitNote}>{unit}</Text>
    </View>
  );
}

const makeThemeStyles = (colors: AppColors) => StyleSheet.create({
  box: {
    marginTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  summaryCell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 88,
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  summaryLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.gaugeProgress,
    fontSize: 16,
    fontWeight: '700',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 4,
  },
  label: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  unitNote: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 6,
  },
});
