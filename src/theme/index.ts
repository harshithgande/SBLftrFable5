import { TextStyle, ViewStyle } from 'react-native';

/**
 * SBLftr design tokens. Dark-first: strength apps are used in gyms where a
 * dark surface reduces glare and battery use, and it keeps focus on the data.
 * Every screen consumes these tokens — never hardcode colors or spacing.
 */
export const colors = {
  bg: '#0C0F14',
  surface: '#161B22',
  surfaceRaised: '#1D2430',
  border: '#2A3240',
  borderStrong: '#3B4657',

  text: '#F2F5F9',
  textSecondary: '#A3AEBB',
  textTertiary: '#727E8C',
  textInverse: '#0C0F14',

  accent: '#A3E635',
  accentDim: '#2A3A16',
  info: '#60A5FA',
  infoDim: '#16283F',
  success: '#34D399',
  successDim: '#123528',
  warning: '#FBBF24',
  warningDim: '#3A2E0E',
  danger: '#F87171',
  dangerDim: '#3B1A1A',
  premium: '#FACC15',
  premiumDim: '#39300D',

  overlay: 'rgba(4, 6, 9, 0.72)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

type FontWeight = TextStyle['fontWeight'];

const weight = {
  regular: '400' as FontWeight,
  medium: '500' as FontWeight,
  semibold: '600' as FontWeight,
  bold: '700' as FontWeight,
  heavy: '800' as FontWeight,
};

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: weight.heavy, color: colors.text } as TextStyle,
  title: { fontSize: 24, lineHeight: 30, fontWeight: weight.bold, color: colors.text } as TextStyle,
  heading: { fontSize: 19, lineHeight: 24, fontWeight: weight.bold, color: colors.text } as TextStyle,
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: weight.semibold, color: colors.text } as TextStyle,
  body: { fontSize: 15, lineHeight: 21, fontWeight: weight.regular, color: colors.textSecondary } as TextStyle,
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: weight.semibold, color: colors.text } as TextStyle,
  caption: { fontSize: 13, lineHeight: 18, fontWeight: weight.regular, color: colors.textTertiary } as TextStyle,
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: weight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  } as TextStyle,
  stat: { fontSize: 26, lineHeight: 32, fontWeight: weight.heavy, color: colors.text, fontVariant: ['tabular-nums'] } as TextStyle,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  } as ViewStyle,
} as const;

/** Minimum comfortable tap target (Apple HIG 44pt, Material 48dp). */
export const tapTarget = 48;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
