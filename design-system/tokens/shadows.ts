/**
 * Shadow tokens — cross-platform (iOS/Android/Web).
 * Uses Platform.select to output the right props for each runtime.
 */

import { Platform, ViewStyle } from 'react-native'

type ShadowLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type ShadowConfig = {
  color: string
  offsetY: number
  opacity: number
  radius: number
  elevation: number
}

const shadowConfigs: Record<ShadowLevel, ShadowConfig> = {
  none: { color: '#000', offsetY: 0, opacity: 0, radius: 0, elevation: 0 },
  xs: { color: '#000', offsetY: 1, opacity: 0.04, radius: 4, elevation: 1 },
  sm: { color: '#000', offsetY: 2, opacity: 0.06, radius: 10, elevation: 2 },
  md: { color: '#000', offsetY: 4, opacity: 0.1, radius: 16, elevation: 4 },
  lg: { color: '#000', offsetY: 8, opacity: 0.14, radius: 24, elevation: 8 },
  xl: { color: '#000', offsetY: 16, opacity: 0.2, radius: 32, elevation: 12 },
}

export function shadow(level: ShadowLevel): ViewStyle {
  const c = shadowConfigs[level]
  if (level === 'none') return {}
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: c.color,
      shadowOffset: { width: 0, height: c.offsetY },
      shadowOpacity: c.opacity,
      shadowRadius: c.radius,
    },
    android: {
      elevation: c.elevation,
    },
    default: {
      shadowColor: c.color,
      shadowOffset: { width: 0, height: c.offsetY },
      shadowOpacity: c.opacity,
      shadowRadius: c.radius,
    },
  })!
}

export const shadows = {
  none: shadow('none'),
  xs: shadow('xs'),
  sm: shadow('sm'),
  md: shadow('md'),
  lg: shadow('lg'),
  xl: shadow('xl'),
} as const

export type ShadowToken = ShadowLevel
