import React from 'react'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { useTheme } from '../theme'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'error' | 'warning' | 'info' | 'accent'
export type BadgeVariant = 'solid' | 'soft' | 'outline'

export type BadgeProps = {
  children: React.ReactNode
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

export function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
}: BadgeProps) {
  const theme = useTheme()

  const toneMap: Record<BadgeTone, { solid: string; soft: string; text: string; solidText: string }> = {
    neutral: {
      solid: theme.colors.brand,
      soft: theme.colors.brandSubtle,
      text: theme.colors.text,
      solidText: theme.colors.textOnBrand,
    },
    brand: {
      solid: theme.colors.brand,
      soft: theme.colors.brandSubtle,
      text: theme.colors.text,
      solidText: theme.colors.textOnBrand,
    },
    success: {
      solid: theme.colors.success,
      soft: theme.colors.successSubtle,
      text: theme.colors.success,
      solidText: '#FFFFFF',
    },
    error: {
      solid: theme.colors.error,
      soft: theme.colors.errorSubtle,
      text: theme.colors.error,
      solidText: '#FFFFFF',
    },
    warning: {
      solid: theme.colors.warning,
      soft: theme.colors.warningSubtle,
      text: theme.colors.warning,
      solidText: '#FFFFFF',
    },
    info: {
      solid: theme.colors.info,
      soft: theme.colors.infoSubtle,
      text: theme.colors.info,
      solidText: '#FFFFFF',
    },
    accent: {
      solid: theme.colors.accent,
      soft: theme.colors.accentSubtle,
      text: theme.colors.accent,
      solidText: '#FFFFFF',
    },
  }
  const t = toneMap[tone]

  const bg = variant === 'solid' ? t.solid : variant === 'soft' ? t.soft : 'transparent'
  const color = variant === 'solid' ? t.solidText : t.text
  const borderColor = variant === 'outline' ? t.text : undefined

  const pad =
    size === 'sm' ? ({ px: 2, py: 0.5 } as const) : ({ px: 2.5, py: 1 } as const)
  const fontSize = size === 'sm' ? 10 : 11

  return (
    <Box
      bg={bg}
      borderRadius="full"
      px={pad.px}
      py={pad.py}
      {...(borderColor && { borderWidth: 1 })}
      style={borderColor ? { borderColor } : undefined}
    >
      <Text
        variant="overline"
        style={{ color, fontSize, letterSpacing: 0.4 }}
      >
        {children}
      </Text>
    </Box>
  )
}
