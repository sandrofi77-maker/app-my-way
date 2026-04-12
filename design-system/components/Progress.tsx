import React from 'react'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type ProgressProps = {
  value: number // 0..100
  showLabel?: boolean
  tone?: 'brand' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md'
}

export function Progress({ value, showLabel, tone = 'brand', size = 'md' }: ProgressProps) {
  const theme = useTheme()
  const clamped = Math.max(0, Math.min(100, value))
  const h = size === 'sm' ? 4 : 8

  const toneColor: Record<NonNullable<ProgressProps['tone']>, string> = {
    brand: theme.colors.brand,
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,
  }

  return (
    <Box flex={1}>
      {showLabel && (
        <HStack justifyContent="space-between" mb={1}>
          <Text variant="caption" color="textSecondary">
            Progresso
          </Text>
          <Text variant="caption" color="text" weight="600">
            {clamped}%
          </Text>
        </HStack>
      )}
      <Box
        accessibilityRole={'progressbar' as any}
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
        style={{
          height: h,
          backgroundColor: theme.colors.border,
          borderRadius: h / 2,
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: toneColor[tone],
            borderRadius: h / 2,
          }}
        />
      </Box>
    </Box>
  )
}
