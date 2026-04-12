import { useWindowDimensions, Platform } from 'react-native'
import { breakpoints } from '../tokens/breakpoints'

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide'

export function useBreakpoint() {
  const { width } = useWindowDimensions()
  const isWeb = Platform.OS === 'web'

  const current: BreakpointName =
    width >= breakpoints.wide ? 'wide' : width >= breakpoints.desktop ? 'desktop' : width >= breakpoints.tablet ? 'tablet' : 'mobile'

  return {
    width,
    current,
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: isWeb && width >= breakpoints.desktop,
    isWide: isWeb && width >= breakpoints.wide,
    isWeb,
  }
}
