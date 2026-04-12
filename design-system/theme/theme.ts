import { lightColors, darkColors, SemanticColors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { shadows } from '../tokens/shadows'
import { zIndex } from '../tokens/zIndex'
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textVariants } from '../tokens/typography'
import { duration, easing } from '../tokens/motion'

export type ThemeMode = 'light' | 'dark'

export type Theme = {
  mode: ThemeMode
  colors: SemanticColors
  spacing: typeof spacing
  radius: typeof radius
  shadows: typeof shadows
  zIndex: typeof zIndex
  typography: {
    fontFamily: typeof fontFamily
    fontSize: typeof fontSize
    fontWeight: typeof fontWeight
    lineHeight: typeof lineHeight
    letterSpacing: typeof letterSpacing
    variants: typeof textVariants
  }
  motion: {
    duration: typeof duration
    easing: typeof easing
  }
}

const baseTheme = {
  spacing,
  radius,
  shadows,
  zIndex,
  typography: {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    variants: textVariants,
  },
  motion: { duration, easing },
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  ...baseTheme,
}

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  ...baseTheme,
}
