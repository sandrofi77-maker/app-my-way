/**
 * Typography tokens — font sizes, weights, line heights, letter spacing.
 * Uses Roboto as the default font across all platforms.
 */

import { Platform } from 'react-native'

export const fontFamily = {
  sans: 'Roboto_400Regular',
  sansMedium: 'Roboto_500Medium',
  sansSemibold: 'Roboto_600SemiBold',
  sansBold: 'Roboto_700Bold',
  sansExtrabold: 'Roboto_800ExtraBold',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  }) as string,
}

export const fontFamilyByWeight: Record<string, string> = {
  '400': fontFamily.sans,
  '500': fontFamily.sansMedium,
  '600': fontFamily.sansSemibold,
  '700': fontFamily.sansBold,
  '800': fontFamily.sansExtrabold,
}

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

export const fontSize = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 22,
  '5xl': 24,
  '6xl': 28,
  '7xl': 32,
  '8xl': 40,
} as const

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const

export const letterSpacing = {
  tight: -0.4,
  snug: -0.2,
  normal: 0,
  wide: 0.2,
  wider: 0.6,
  widest: 1,
} as const

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'overline'
  | 'label'

type TextVariantStyle = {
  fontSize: number
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight]
  lineHeight: number
  letterSpacing?: number
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
}

export const textVariants: Record<TextVariant, TextVariantStyle> = {
  display: {
    fontSize: fontSize['8xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize['8xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontSize: fontSize['7xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['7xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['6xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.snug,
  },
  h3: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['5xl'] * lineHeight.snug,
  },
  h4: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize['4xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.snug,
  },
  subtitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.normal,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
}
