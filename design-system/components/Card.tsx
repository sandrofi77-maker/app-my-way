import React from 'react'
import { ViewStyle } from 'react-native'
import { Box, BoxProps } from './primitives/Box'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type CardVariant = 'elevated' | 'outlined' | 'filled'

export type CardProps = BoxProps & {
  variant?: CardVariant
  interactive?: boolean
  onPress?: () => void
  accessibilityLabel?: string
}

export function Card({
  variant = 'elevated',
  interactive,
  onPress,
  accessibilityLabel,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme()

  const baseProps: BoxProps = {
    bg: variant === 'filled' ? 'surfaceHigh' : 'surface',
    borderRadius: '2xl',
    p: 4,
    ...(variant === 'outlined' && { borderWidth: 1, borderColor: 'border' }),
    ...(variant === 'elevated' && { shadow: 'sm' }),
    ...rest,
  }

  if (interactive || onPress) {
    const pressableStyle: ViewStyle = {
      backgroundColor: variant === 'filled' ? theme.colors.surfaceHigh : theme.colors.surface,
      borderRadius: theme.radius['2xl'],
      ...(variant === 'outlined' && { borderWidth: 1, borderColor: theme.colors.border }),
      ...(variant === 'elevated' && theme.shadows.sm),
    }
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={pressableStyle}
        pressedStyle={{ opacity: 0.92 }}
        hoveredStyle={{ opacity: 0.97 }}
      >
        <Box {...baseProps} shadow={undefined} bg={undefined}>
          {children}
        </Box>
      </Pressable>
    )
  }

  return <Box {...baseProps}>{children}</Box>
}
