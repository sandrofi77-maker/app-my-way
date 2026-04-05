import { useWindowDimensions, Platform } from 'react-native'

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1280,
}

export function useResponsive() {
  const { width } = useWindowDimensions()
  const isWeb = Platform.OS === 'web'

  return {
    width,
    isMobile: width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: isWeb && width >= BREAKPOINTS.desktop,
    isWide: isWeb && width >= BREAKPOINTS.wide,
    sidebarWidth: width >= BREAKPOINTS.wide ? 260 : 220,
    contentMaxWidth: 900,
    gridColumns: width >= BREAKPOINTS.wide ? 3 : width >= BREAKPOINTS.desktop ? 2 : 1,
  }
}
