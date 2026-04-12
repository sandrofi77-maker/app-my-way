/**
 * Color tokens — single source of truth.
 * Extracted from existing myway palette (constants/Colors.ts) and expanded
 * into a full scale with semantic aliases for light/dark theming.
 */

export const palette = {
  // Neutral scale
  neutral: {
    0: '#FFFFFF',
    50: '#F8F8F8',
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#A1A1A6',
    500: '#74747A',
    600: '#545458',
    700: '#3A3A3C',
    800: '#1C1C1E',
    900: '#000000',
  },

  // Brand / primary — myway uses black as primary
  brand: {
    50: '#F4F4F5',
    100: '#E4E4E7',
    200: '#D4D4D8',
    300: '#A1A1AA',
    400: '#71717A',
    500: '#52525B',
    600: '#3F3F46',
    700: '#27272A',
    800: '#18181B',
    900: '#000000',
  },

  // Accent lilac (used for badges)
  accent: {
    50: '#F5F4FE',
    100: '#EEEDFE',
    200: '#DDDBFC',
    300: '#C4C0F9',
    400: '#A29CF5',
    500: '#8078EE',
    600: '#6257DD',
    700: '#4E43BE',
    800: '#3E369A',
    900: '#2F2976',
  },

  // Semantic — success (iOS green)
  success: {
    50: '#E9FAF1',
    100: '#C8F3DB',
    200: '#93E6B9',
    300: '#5FD697',
    400: '#2ABD6E',
    500: '#1F9C5A',
    600: '#177A47',
    700: '#115A34',
    800: '#0A3B22',
    900: '#051D11',
  },

  // Semantic — error (iOS red)
  error: {
    50: '#FFE9E6',
    100: '#FFCBC4',
    200: '#FF9B8E',
    300: '#FF6C58',
    400: '#FF3D23',
    500: '#FF0D00',
    600: '#CC0A00',
    700: '#990800',
    800: '#660500',
    900: '#330300',
  },

  // Semantic — warning
  warning: {
    50: '#FFF6E5',
    100: '#FFE8B8',
    200: '#FFD27A',
    300: '#FFBB3D',
    400: '#FFA500',
    500: '#E69400',
    600: '#B87600',
    700: '#8A5800',
    800: '#5C3B00',
    900: '#2E1D00',
  },

  // Semantic — info (iOS blue)
  info: {
    50: '#E7F3FE',
    100: '#C1E0FC',
    200: '#8CC5F9',
    300: '#57A9F6',
    400: '#228CF3',
    500: '#007AFF',
    600: '#0062CC',
    700: '#004999',
    800: '#003166',
    900: '#001833',
  },

  // Category accents reused by travel components
  category: {
    flight: '#000000',
    transport: '#32ADE6',
    accommodation: '#5856D6',
    food: '#FF9500',
    sightseeing: '#34C759',
    event: '#FF2D55',
    shopping: '#AF52DE',
    free: '#8E8E93',
  },
} as const

export type Palette = typeof palette

/**
 * Semantic color aliases — these are what components consume.
 * Each theme (light/dark) produces the same keys so swapping is a no-op.
 */
export type SemanticColors = {
  // Surfaces
  background: string
  surface: string
  surfaceHigh: string
  surfaceOverlay: string

  // Borders
  border: string
  borderStrong: string
  divider: string

  // Text
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  textOnBrand: string

  // Brand / action
  brand: string
  brandHover: string
  brandPressed: string
  brandSubtle: string

  // Accent
  accent: string
  accentSubtle: string

  // Semantic
  success: string
  successSubtle: string
  error: string
  errorSubtle: string
  warning: string
  warningSubtle: string
  info: string
  infoSubtle: string

  // Focus ring
  focusRing: string

  // Category colors (flat pass-through)
  categoryFlight: string
  categoryTransport: string
  categoryAccommodation: string
  categoryFood: string
  categorySightseeing: string
  categoryEvent: string
  categoryShopping: string
  categoryFree: string
}

export const lightColors: SemanticColors = {
  background: palette.neutral[100],
  surface: palette.neutral[0],
  surfaceHigh: palette.neutral[50],
  surfaceOverlay: 'rgba(0,0,0,0.4)',

  border: palette.neutral[200],
  borderStrong: palette.neutral[300],
  divider: palette.neutral[200],

  text: palette.neutral[900],
  textSecondary: '#454545',
  textTertiary: palette.neutral[500],
  textInverse: palette.neutral[0],
  textOnBrand: palette.neutral[0],

  brand: palette.brand[900],
  brandHover: palette.brand[800],
  brandPressed: palette.brand[700],
  brandSubtle: palette.brand[100],

  accent: palette.accent[600],
  accentSubtle: palette.accent[100],

  success: palette.success[400],
  successSubtle: palette.success[50],
  error: palette.error[500],
  errorSubtle: palette.error[50],
  warning: palette.warning[400],
  warningSubtle: palette.warning[50],
  info: palette.info[500],
  infoSubtle: palette.info[50],

  focusRing: palette.info[500],

  categoryFlight: palette.category.flight,
  categoryTransport: palette.category.transport,
  categoryAccommodation: palette.category.accommodation,
  categoryFood: palette.category.food,
  categorySightseeing: palette.category.sightseeing,
  categoryEvent: palette.category.event,
  categoryShopping: palette.category.shopping,
  categoryFree: palette.category.free,
}

export const darkColors: SemanticColors = {
  background: '#0A0A0B',
  surface: '#141416',
  surfaceHigh: '#1C1C1E',
  surfaceOverlay: 'rgba(0,0,0,0.6)',

  border: '#2C2C2E',
  borderStrong: '#3A3A3C',
  divider: '#2C2C2E',

  text: palette.neutral[0],
  textSecondary: '#D1D1D6',
  textTertiary: '#8E8E93',
  textInverse: palette.neutral[900],
  textOnBrand: palette.neutral[900],

  brand: palette.neutral[0],
  brandHover: palette.neutral[100],
  brandPressed: palette.neutral[200],
  brandSubtle: '#2C2C2E',

  accent: palette.accent[400],
  accentSubtle: '#2A2740',

  success: palette.success[300],
  successSubtle: '#0A3B22',
  error: '#FF453A',
  errorSubtle: '#3B0F0A',
  warning: palette.warning[300],
  warningSubtle: '#3B2B0A',
  info: '#0A84FF',
  infoSubtle: '#0A2540',

  focusRing: '#0A84FF',

  categoryFlight: palette.neutral[0],
  categoryTransport: palette.category.transport,
  categoryAccommodation: palette.category.accommodation,
  categoryFood: palette.category.food,
  categorySightseeing: palette.category.sightseeing,
  categoryEvent: palette.category.event,
  categoryShopping: palette.category.shopping,
  categoryFree: palette.category.free,
}
