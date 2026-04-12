/**
 * Breakpoint tokens — mirrors hooks/useResponsive.ts values
 * so screens and DS components agree on what "mobile" means.
 */

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const

export type Breakpoint = keyof typeof breakpoints
