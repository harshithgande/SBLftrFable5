import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, G, Line, Path, Pattern } from 'react-native-svg';

import { colors, spacing, type } from '../theme';
import { MuscleGroup } from '../types';
import { MuscleRecovery } from '../utils/recovery';

/**
 * Interactive anatomical muscle map (original artwork, drawn as SVG paths on
 * a 200×440 canvas; left-side paths are mirrored for the right side so the
 * figure is always symmetric). Each muscle group is tappable and colored by
 * recovery status:
 *   green            = trained recently and past the recovery window (ready)
 *   red + hatching   = trained within the window (recovering — let it rest)
 *   muted            = no sessions in the last 7 days (no data)
 * Status is never color-alone: recovering regions carry a hatch texture, and
 * the selected muscle's status is written out in the detail row below.
 */

/** Diagram-only colors: the line-art outline and the "no data" muscle fill. */
const OUTLINE = '#D7DEE8';
const MUTED_FILL = '#232E42';

interface MuscleSpec {
  muscle: MuscleGroup;
  label: string;
  /** Left-side / center paths; mirrored across x=100 for the right side. */
  paths: string[];
}

const FRONT_MUSCLES: MuscleSpec[] = [
  { muscle: 'traps', label: 'Traps', paths: ['M89 60 C82 64 74 70 66 78 L88 72 Z'] },
  {
    muscle: 'side delts',
    label: 'Side delts',
    paths: ['M64 80 C55 85 50 96 52 109 C58 113 64 108 66 97 C67 90 66 84 64 80 Z'],
  },
  {
    muscle: 'front delts',
    label: 'Front delts',
    paths: ['M66 81 C73 83 77 92 75 103 C70 108 66 104 66 96 C66 90 66 85 66 81 Z'],
  },
  {
    muscle: 'chest',
    label: 'Chest',
    paths: ['M98 98 C84 98 76 104 73 112 C73 126 81 138 97 141 C99 141 99 140 99 138 L99 100 Z'],
  },
  {
    muscle: 'biceps',
    label: 'Biceps',
    paths: ['M57 117 C51 127 50 142 54 156 C60 158 64 149 64 135 C64 125 62 119 57 117 Z'],
  },
  {
    muscle: 'forearms',
    label: 'Forearms',
    paths: ['M50 162 C44 178 42 196 44 213 L52 213 C56 196 58 176 58 163 C55 160 52 160 50 162 Z'],
  },
  {
    muscle: 'core',
    label: 'Core',
    paths: [
      'M87 146 C84 166 84 196 88 222 C92 227 96 228 99 228 L99 146 Z',
      'M80 150 C76 166 76 194 80 220 L85 226 C83 200 83 168 85 148 Z',
    ],
  },
  {
    muscle: 'abductors',
    label: 'Abductors',
    paths: ['M70 228 C64 240 64 256 68 268 C74 268 78 258 78 244 C78 234 75 228 70 228 Z'],
  },
  {
    muscle: 'quads',
    label: 'Quads',
    paths: [
      'M70 240 C66 270 66 300 72 326 L79 328 C77 300 77 268 79 244 Z',
      'M81 245 C79 272 79 302 82 328 L92 330 C92 302 92 270 92 248 Z',
      'M93 298 C91 314 93 328 97 333 C100 330 100 317 98 304 Z',
      'M94 252 C91 264 91 278 93 290 C97 287 98 270 98 255 Z',
    ],
  },
  {
    muscle: 'calves',
    label: 'Calves',
    paths: [
      'M77 352 C73 372 74 394 79 412 L85 410 C85 390 84 368 84 353 Z',
      'M87 354 C89 370 89 390 87 408 L92 403 C94 384 93 366 90 353 Z',
    ],
  },
];

const BACK_MUSCLES: MuscleSpec[] = [
  {
    muscle: 'traps',
    label: 'Traps',
    paths: ['M100 52 C93 58 85 66 74 77 L86 83 C93 102 97 120 100 138 L100 52 Z'],
  },
  {
    muscle: 'rear delts',
    label: 'Rear delts',
    paths: ['M70 80 C58 86 52 98 54 111 C62 115 70 106 72 93 C72 87 72 82 70 80 Z'],
  },
  {
    muscle: 'upper back',
    label: 'Upper back',
    paths: ['M74 87 C69 100 69 117 75 130 C84 127 91 117 93 103 C88 93 81 88 74 87 Z'],
  },
  {
    muscle: 'lats',
    label: 'Lats',
    paths: ['M76 130 C74 150 80 170 93 184 C97 186 98 182 98 174 L98 142 C90 138 82 134 76 130 Z'],
  },
  { muscle: 'core', label: 'Lower back', paths: ['M94 142 L94 214 C96 219 98 219 99 214 L99 142 Z'] },
  {
    muscle: 'triceps',
    label: 'Triceps',
    paths: ['M55 116 C48 130 48 146 52 159 C58 161 62 152 62 138 C62 126 60 118 55 116 Z'],
  },
  {
    muscle: 'forearms',
    label: 'Forearms',
    paths: ['M50 164 C44 180 42 198 44 214 L52 214 C56 198 58 178 58 165 C55 162 52 162 50 164 Z'],
  },
  {
    muscle: 'glutes',
    label: 'Glutes',
    paths: ['M80 214 C69 221 66 240 72 258 C82 266 95 262 98 246 C99 231 92 218 80 214 Z'],
  },
  {
    muscle: 'hamstrings',
    label: 'Hamstrings',
    paths: [
      'M70 270 C68 292 70 314 76 331 L84 331 C82 308 82 288 82 272 Z',
      'M84 273 C84 293 84 311 87 331 L94 329 C94 306 94 286 92 271 Z',
    ],
  },
  {
    muscle: 'calves',
    label: 'Calves',
    paths: [
      'M75 348 C70 368 72 392 79 411 L86 409 C86 388 85 366 84 350 Z',
      'M87 351 C89 368 89 390 87 407 L93 402 C95 383 94 365 91 351 Z',
    ],
  },
];

/** Left half of the body silhouette, stroke-only; mirrored for the right. */
const OUTLINE_HALF = [
  'M92 46 C90 52 89 56 88 60 C80 64 72 70 64 79',
  'C54 85 49 96 51 110 L44 160 C41 180 39 198 40 214',
  'C37 222 35 232 36 242 C38 248 42 248 44 243 C44 250 48 251 49 244 C51 250 54 250 55 243 C56 236 56 228 55 220',
  'C58 202 60 182 62 162 L66 120',
  'C68 140 70 160 71 180 C70 196 70 212 71 226',
  'L70 240 C66 272 66 302 72 330 C70 336 70 342 71 348 C67 370 69 394 75 414',
  'C72 420 71 426 73 431 C78 434 86 434 92 431 C93 424 92 418 90 412 C90 392 89 370 88 352 C88 344 88 336 88 330 C86 302 86 272 88 246 L99 252',
].join(' ');

/** Six-pack seam lines, decorative only (front figure). */
const AB_SEAMS: { x1: number; y1: number; x2: number; y2: number }[] = [
  { x1: 87, y1: 166, x2: 99, y2: 169 },
  { x1: 101, y1: 169, x2: 113, y2: 166 },
  { x1: 87, y1: 186, x2: 99, y2: 189 },
  { x1: 101, y1: 189, x2: 113, y2: 186 },
  { x1: 88, y1: 206, x2: 99, y2: 209 },
  { x1: 101, y1: 209, x2: 112, y2: 206 },
];

export type MuscleStatus = 'ready' | 'recovering' | 'no-data';

export function statusFor(recovery: MuscleRecovery | undefined): MuscleStatus {
  if (!recovery) return 'no-data';
  return recovery.status === 'recovering' ? 'recovering' : 'ready';
}

const FILL: Record<MuscleStatus, string> = {
  ready: colors.success,
  recovering: colors.danger,
  'no-data': MUTED_FILL,
};

interface Props {
  recovery: Map<MuscleGroup, MuscleRecovery>;
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
  width: number;
}

export function BodyDiagram({ recovery, selected, onSelect, width }: Props) {
  const figureWidth = Math.min(190, Math.floor(width / 2) - spacing.sm);
  const figureHeight = Math.round(figureWidth * 2.2);

  const readyCount = [...recovery.values()].filter((r) => r.status === 'ready').length;
  const recoveringCount = [...recovery.values()].filter((r) => r.status === 'recovering').length;
  const summary = `Muscle recovery map. ${recoveringCount} muscle group${recoveringCount === 1 ? '' : 's'} recovering, ${readyCount} ready, others have no recent training. Tap a muscle for details.`;

  return (
    <View accessibilityLabel={summary} accessibilityRole="image">
      <View style={styles.figuresRow}>
        <Figure
          title="Front"
          muscles={FRONT_MUSCLES}
          showAbSeams
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
  showAbSeams?: boolean;
  recovery: Map<MuscleGroup, MuscleRecovery>;
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
  width: number;
  height: number;
}

const MIRROR = 'translate(200,0) scale(-1,1)';

function Figure({ title, muscles, showAbSeams = false, recovery, selected, onSelect, width, height }: FigureProps) {
  const hatchId = `hatch-${title}`;
  return (
    <View style={styles.figure}>
      <Svg width={width} height={height} viewBox="0 0 200 440">
        <Defs>
          <Pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <Line x1="0" y1="0" x2="0" y2="6" stroke={colors.bg} strokeWidth="2" strokeOpacity="0.5" />
          </Pattern>
        </Defs>

        {/* Body silhouette (not tappable) */}
        <Ellipse cx={100} cy={28} rx={15} ry={18} fill="none" stroke={OUTLINE} strokeWidth={2} />
        <Path d={OUTLINE_HALF} fill="none" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <G transform={MIRROR}>
          <Path d={OUTLINE_HALF} fill="none" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </G>

        {/* Muscle regions: left/center paths + mirrored right side */}
        {muscles.map((spec) => {
          const status = statusFor(recovery.get(spec.muscle));
          const isSelected = selected === spec.muscle;
          const stroke = isSelected ? colors.accent : OUTLINE;
          const strokeWidth = isSelected ? 2.6 : 1.4;
          const shapes = (
            <>
              {spec.paths.map((d, i) => (
                <React.Fragment key={`${spec.muscle}-${i}`}>
                  <Path d={d} fill={FILL[status]} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
                  {status === 'recovering' ? <Path d={d} fill={`url(#${hatchId})`} /> : null}
                </React.Fragment>
              ))}
            </>
          );
          return (
            <G
              key={`${title}-${spec.muscle}`}
              onPress={() => onSelect(spec.muscle)}
              accessible
              accessibilityLabel={`${spec.label}: ${
                status === 'ready' ? 'ready' : status === 'recovering' ? 'recovering' : 'no recent training'
              }`}
            >
              {shapes}
              <G transform={MIRROR}>{shapes}</G>
            </G>
          );
        })}

        {showAbSeams
          ? AB_SEAMS.map((l, i) => (
              <Line
                key={`seam-${i}`}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={OUTLINE}
                strokeWidth={1.2}
                strokeOpacity={0.85}
              />
            ))
          : null}
      </Svg>
      <Text style={[type.caption, styles.figureTitle]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  figuresRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  figure: { alignItems: 'center' },
  figureTitle: { marginTop: spacing.xs },
});
