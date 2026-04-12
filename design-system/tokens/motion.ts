/**
 * Motion tokens — durations and easing curves.
 */

export const duration = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 320,
  slower: 480,
} as const

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const
