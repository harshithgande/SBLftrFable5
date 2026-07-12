import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { colors, radii, spacing, type } from '../theme';
import { Units, WeightEntry } from '../types';
import { formatShortDate } from '../utils/date';
import { formatWeight, toDisplayWeight } from '../utils/units';

interface Props {
  /** Newest first (state order); the chart re-sorts chronologically. */
  entries: WeightEntry[];
  units: Units;
  width: number;
  height?: number;
}

/**
 * Weight-over-time line chart. Y axis padded around the true data range
 * (never zero-based-forced nor over-zoomed: minimum span keeps small
 * fluctuations from looking like cliffs).
 */
export function WeightChart({ entries, units, width, height = 180 }: Props) {
  const points = [...entries]
    .filter((e) => Number.isFinite(e.weightLbs))
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

  if (points.length === 0) return null;

  const pad = { left: 44, right: 14, top: 16, bottom: 26 };
  const innerW = Math.max(10, width - pad.left - pad.right);
  const innerH = Math.max(10, height - pad.top - pad.bottom);

  const values = points.map((p) => toDisplayWeight(p.weightLbs, units));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Guarantee a minimum visible span so the scale can't mislead.
  const minSpan = units === 'kg' ? 4 : 8;
  const span = Math.max(rawMax - rawMin, minSpan);
  const mid = (rawMax + rawMin) / 2;
  const yMin = mid - span / 2 - span * 0.1;
  const yMax = mid + span / 2 + span * 0.1;

  const times = points.map((p) => new Date(p.dateISO).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = Math.max(1, tMax - tMin);

  const x = (t: number) => pad.left + ((t - tMin) / tSpan) * innerW;
  const y = (v: number) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const single = points.length === 1;
  const path = points
    .map((_, i) => `${i === 0 ? 'M' : 'L'} ${x(times[i]).toFixed(1)} ${y(values[i]).toFixed(1)}`)
    .join(' ');

  const gridValues = [yMin + (yMax - yMin) * 0.15, mid, yMax - (yMax - yMin) * 0.15];

  const first = points[0];
  const last = points[points.length - 1];
  const deltaLbs = last.weightLbs - first.weightLbs;
  const summary = single
    ? `Starting weight ${formatWeight(first.weightLbs, units)} on ${formatShortDate(first.dateISO)}.`
    : `${points.length} entries from ${formatShortDate(first.dateISO)} to ${formatShortDate(last.dateISO)}. Current ${formatWeight(last.weightLbs, units)}, ${
        deltaLbs === 0 ? 'no net change' : `${deltaLbs > 0 ? 'up' : 'down'} ${formatWeight(Math.abs(deltaLbs), units)}`
      } overall.`;

  return (
    <View accessibilityRole="image" accessibilityLabel={`Weight chart. ${summary}`}>
      <Svg width={width} height={height}>
        {gridValues.map((gv) => (
          <React.Fragment key={gv.toFixed(2)}>
            <Line
              x1={pad.left}
              y1={y(gv)}
              x2={width - pad.right}
              y2={y(gv)}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
            <SvgText x={pad.left - 8} y={y(gv) + 4} fill={colors.textTertiary} fontSize={11} textAnchor="end">
              {Math.round(gv)}
            </SvgText>
          </React.Fragment>
        ))}
        {!single ? <Path d={path} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" /> : null}
        {points.map((p, i) => (
          <Circle
            key={p.id}
            cx={x(times[i])}
            cy={y(values[i])}
            r={single ? 6 : i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 || single ? colors.accent : colors.surfaceRaised}
            stroke={colors.accent}
            strokeWidth={1.5}
          />
        ))}
        <SvgText x={pad.left} y={height - 8} fill={colors.textTertiary} fontSize={11}>
          {formatShortDate(first.dateISO)}
        </SvgText>
        {!single ? (
          <SvgText x={width - pad.right} y={height - 8} fill={colors.textTertiary} fontSize={11} textAnchor="end">
            {formatShortDate(last.dateISO)}
          </SvgText>
        ) : null}
      </Svg>
      <View style={styles.summaryWrap}>
        <Text style={type.caption}>{summary}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryWrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
});
