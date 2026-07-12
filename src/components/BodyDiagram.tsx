import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, Pattern, Rect } from 'react-native-svg';

import { colors, spacing, type } from '../theme';
import { MuscleGroup } from '../types';
import { MuscleRecovery } from '../utils/recovery';

/**
 * Interactive front/back muscle map. Each muscle region is tappable and
 * colored by recovery status:
 *   green            = trained recently and past the recovery window (ready)
 *   red + hatching   = trained within the window (recovering — let it rest)
 *   muted            = no sessions in the last 7 days (no data)
 * Status is never color-alone: recovering regions carry a hatch texture, and
 * the selected muscle's status is written out in the detail row below.
 */

type ShapeSpec =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { kind: 'path'; d: string };

interface MuscleSpec {
  muscle: MuscleGroup;
  label: string;
  shapes: ShapeSpec[];
}

/** Figure canvas is 170×340; both figures share limb/torso scaffolding. */
const FRONT_MUSCLES: MuscleSpec[] = [
  {
    muscle: 'side delts',
    label: 'Side delts',
    shapes: [
      { kind: 'ellipse', cx: 45, cy: 88, rx: 10, ry: 14 },
      { kind: 'ellipse', cx: 125, cy: 88, rx: 10, ry: 14 },
    ],
  },
  {
    muscle: 'front delts',
    label: 'Front delts',
    shapes: [
      { kind: 'ellipse', cx: 60, cy: 90, rx: 8, ry: 11 },
      { kind: 'ellipse', cx: 110, cy: 90, rx: 8, ry: 11 },
    ],
  },
  {
    muscle: 'chest',
    label: 'Chest',
    shapes: [
      { kind: 'ellipse', cx: 73, cy: 117, rx: 12, ry: 14 },
      { kind: 'ellipse', cx: 97, cy: 117, rx: 12, ry: 14 },
    ],
  },
  {
    muscle: 'biceps',
    label: 'Biceps',
    shapes: [
      { kind: 'ellipse', cx: 41, cy: 128, rx: 8, ry: 17 },
      { kind: 'ellipse', cx: 129, cy: 128, rx: 8, ry: 17 },
    ],
  },
  {
    muscle: 'forearms',
    label: 'Forearms',
    shapes: [
      { kind: 'ellipse', cx: 35, cy: 172, rx: 7, ry: 19 },
      { kind: 'ellipse', cx: 135, cy: 172, rx: 7, ry: 19 },
    ],
  },
  {
    muscle: 'core',
    label: 'Core',
    shapes: [{ kind: 'rect', x: 71, y: 133, w: 28, h: 56, r: 9 }],
  },
  {
    muscle: 'abductors',
    label: 'Abductors',
    shapes: [
      { kind: 'ellipse', cx: 56, cy: 207, rx: 9, ry: 13 },
      { kind: 'ellipse', cx: 114, cy: 207, rx: 9, ry: 13 },
    ],
  },
  {
    muscle: 'quads',
    label: 'Quads',
    shapes: [
      { kind: 'ellipse', cx: 68, cy: 250, rx: 12, ry: 31 },
      { kind: 'ellipse', cx: 102, cy: 250, rx: 12, ry: 31 },
    ],
  },
  {
    muscle: 'calves',
    label: 'Calves',
    shapes: [
      { kind: 'ellipse', cx: 66, cy: 308, rx: 8, ry: 21 },
      { kind: 'ellipse', cx: 104, cy: 308, rx: 8, ry: 21 },
    ],
  },
];

const BACK_MUSCLES: MuscleSpec[] = [
  {
    muscle: 'traps',
    label: 'Traps',
    shapes: [{ kind: 'path', d: 'M85 60 L64 84 L85 100 L106 84 Z' }],
  },
  {
    muscle: 'rear delts',
    label: 'Rear delts',
    shapes: [
      { kind: 'ellipse', cx: 45, cy: 90, rx: 10, ry: 13 },
      { kind: 'ellipse', cx: 125, cy: 90, rx: 10, ry: 13 },
    ],
  },
  {
    muscle: 'upper back',
    label: 'Upper back',
    shapes: [{ kind: 'rect', x: 66, y: 102, w: 38, h: 24, r: 8 }],
  },
  {
    muscle: 'lats',
    label: 'Lats',
    shapes: [
      { kind: 'ellipse', cx: 68, cy: 148, rx: 11, ry: 24, rotate: 10 },
      { kind: 'ellipse', cx: 102, cy: 148, rx: 11, ry: 24, rotate: -10 },
    ],
  },
  {
    muscle: 'triceps',
    label: 'Triceps',
    shapes: [
      { kind: 'ellipse', cx: 41, cy: 128, rx: 8, ry: 17 },
      { kind: 'ellipse', cx: 129, cy: 128, rx: 8, ry: 17 },
    ],
  },
  {
    muscle: 'forearms',
    label: 'Forearms',
    shapes: [
      { kind: 'ellipse', cx: 35, cy: 172, rx: 7, ry: 19 },
      { kind: 'ellipse', cx: 135, cy: 172, rx: 7, ry: 19 },
    ],
  },
  {
    muscle: 'glutes',
    label: 'Glutes',
    shapes: [
      { kind: 'ellipse', cx: 73, cy: 202, rx: 13, ry: 14 },
      { kind: 'ellipse', cx: 97, cy: 202, rx: 13, ry: 14 },
    ],
  },
  {
    muscle: 'hamstrings',
    label: 'Hamstrings',
    shapes: [
      { kind: 'ellipse', cx: 68, cy: 254, rx: 12, ry: 29 },
      { kind: 'ellipse', cx: 102, cy: 254, rx: 12, ry: 29 },
    ],
  },
  {
    muscle: 'calves',
    label: 'Calves',
    shapes: [
      { kind: 'ellipse', cx: 66, cy: 310, rx: 9, ry: 22 },
      { kind: 'ellipse', cx: 104, cy: 310, rx: 9, ry: 22 },
    ],
  },
];

export type MuscleStatus = 'ready' | 'recovering' | 'no-data';

export function statusFor(recovery: MuscleRecovery | undefined): MuscleStatus {
  if (!recovery) return 'no-data';
  return recovery.status === 'recovering' ? 'recovering' : 'ready';
}

const FILL: Record<MuscleStatus, string> = {
  ready: colors.success,
  recovering: colors.danger,
  'no-data': colors.borderStrong,
};

const FILL_OPACITY: Record<MuscleStatus, number> = {
  ready: 0.9,
  recovering: 0.9,
  'no-data': 0.45,
};

interface Props {
  recovery: Map<MuscleGroup, MuscleRecovery>;
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
  width: number;
}

export function BodyDiagram({ recovery, selected, onSelect, width }: Props) {
  const figureWidth = Math.min(180, Math.floor(width / 2) - spacing.sm);
  const figureHeight = Math.round(figureWidth * 2);

  const readyCount = [...recovery.values()].filter((r) => r.status === 'ready').length;
  const recoveringCount = [...recovery.values()].filter((r) => r.status === 'recovering').length;
  const summary = `Muscle recovery map. ${recoveringCount} muscle group${recoveringCount === 1 ? '' : 's'} recovering, ${readyCount} ready, others have no recent training. Tap a muscle for details.`;

  return (
    <View accessibilityLabel={summary} accessibilityRole="image">
      <View style={styles.figuresRow}>
        <Figure
          title="Front"
          muscles={FRONT_MUSCLES}
          recovery={recovery}
          selected={selected}
          onSelect={onSelect}
          width={figureWidth}
          height={figureHeight}
        />
        <Figure
          title="Back"
          muscles={BACK_MUSCLES}
          recovery={recovery}
          selected={selected}
          onSelect={onSelect}
          width={figureWidth}
          height={figureHeight}
        />
      </View>
    </View>
  );
}

interface FigureProps {
  title: string;
  muscles: MuscleSpec[];
  recovery: Map<MuscleGroup, MuscleRecovery>;
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
  width: number;
  height: number;
}

function Figure({ title, muscles, recovery, selected, onSelect, width, height }: FigureProps) {
  const hatchId = `hatch-${title}`;
  return (
    <View style={styles.figure}>
      <Svg width={width} height={height} viewBox="0 0 170 340">
        <Defs>
          <Pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <Line x1="0" y1="0" x2="0" y2="6" stroke={colors.bg} strokeWidth="2" strokeOpacity="0.55" />
          </Pattern>
        </Defs>

        {/* Body scaffold (not tappable) */}
        <Circle cx={85} cy={28} r={15} fill={colors.surfaceRaised} />
        <Rect x={76} y={42} width={18} height={14} rx={5} fill={colors.surfaceRaised} />
        <Path
          d="M52 66 L118 66 C126 66 130 72 129 80 L120 190 C119 197 113 200 106 200 L64 200 C57 200 51 197 50 190 L41 80 C40 72 44 66 52 66 Z"
          fill={colors.surfaceRaised}
        />
        <Line x1={48} y1={84} x2={34} y2={190} stroke={colors.surfaceRaised} strokeWidth={17} strokeLinecap="round" />
        <Line x1={122} y1={84} x2={136} y2={190} stroke={colors.surfaceRaised} strokeWidth={17} strokeLinecap="round" />
        <Line x1={70} y1={202} x2={66} y2={328} stroke={colors.surfaceRaised} strokeWidth={22} strokeLinecap="round" />
        <Line x1={100} y1={202} x2={104} y2={328} stroke={colors.surfaceRaised} strokeWidth={22} strokeLinecap="round" />

        {/* Muscle regions */}
        {muscles.map((spec) => {
          const status = statusFor(recovery.get(spec.muscle));
          const isSelected = selected === spec.muscle;
          return (
            <G
              key={`${title}-${spec.muscle}`}
              onPress={() => onSelect(spec.muscle)}
              accessible
              accessibilityLabel={`${spec.label}: ${
                status === 'ready' ? 'ready' : status === 'recovering' ? 'recovering' : 'no recent training'
              }`}
            >
              {spec.shapes.map((shape, i) => (
                <React.Fragment key={`${spec.muscle}-${i}`}>
                  <MuscleShape
                    shape={shape}
                    fill={FILL[status]}
                    fillOpacity={FILL_OPACITY[status]}
                    stroke={isSelected ? colors.text : colors.bg}
                    strokeWidth={isSelected ? 2.5 : 1}
                  />
                  {status === 'recovering' ? (
                    <MuscleShape shape={shape} fill={`url(#${hatchId})`} fillOpacity={1} stroke="none" strokeWidth={0} />
                  ) : null}
                </React.Fragment>
              ))}
            </G>
          );
        })}
      </Svg>
      <Text style={[type.caption, styles.figureTitle]}>{title}</Text>
    </View>
  );
}

function MuscleShape({
  shape,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
}: {
  shape: ShapeSpec;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
}) {
  const common = { fill, fillOpacity, stroke, strokeWidth };
  if (shape.kind === 'ellipse') {
    return (
      <Ellipse
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        transform={shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined}
        {...common}
      />
    );
  }
  if (shape.kind === 'rect') {
    return <Rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r} {...common} />;
  }
  return <Path d={shape.d} {...common} />;
}

const styles = StyleSheet.create({
  figuresRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  figure: { alignItems: 'center' },
  figureTitle: { marginTop: spacing.xs },
});
