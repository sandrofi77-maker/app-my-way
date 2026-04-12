import React from 'react'
import { ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onPress?: () => void
  accessibilityLabel?: string
  testID?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  leftIcon,
  rightIcon,
  onPress,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const theme = useTheme()
  const isDisabled = disabled || loading

  const sizeMap: Record<ButtonSize, { height: number; px: number; fontSize: number }> = {
    sm: { height: 36, px: 14, fontSize: theme.typography.fontSize.md },
    md: { height: 44, px: 18, fontSize: theme.typography.fontSize.lg },
    lg: { height: 52, px: 22, fontSize: theme.typography.fontSize.xl },
  }
  const s = sizeMap[size]

  const variantStyles: Record<ButtonVariant, { bg: string; color: string; border?: string }> = {
    primary: {
      bg: theme.colors.brand,
      color: theme.colors.textOnBrand,
    },
    secondary: {
      bg: theme.colors.surface,
      color: theme.colors.text,
      border: theme.colors.border,
    },
    tertiary: {
      bg: theme.colors.brandSubtle,
      color: theme.colors.text,
    },
    ghost: {
      bg: 'transparent',
      color: theme.colors.text,
    },
    destructive: {
      bg: theme.colors.error,
      color: '#FFFFFF',
    },
  }
  const v = variantStyles[variant]

  const baseStyle: ViewStyle = {
    height: s.height,
    paddingHorizontal: s.px,
    borderRadius: theme.radius.lg,
    backgroundColor: v.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...(v.border && { borderWidth: 1, borderColor: v.border }),
    ...(fullWidth && { width: '100%' }),
    ...(isDisabled && { opacity: 0.5 }),
    ...(variant === 'primary' && theme.shadows.xs),
  }

  const pressedStyle: ViewStyle = {
    opacity: 0.85,
  }

  const hoveredStyle: ViewStyle = {
    opacity: 0.92,
  }

  const labelStyle: TextStyle = {
    fontSize: s.fontSize,
    fontWeight: '600',
    color: v.color,
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={baseStyle}
      pressedStyle={pressedStyle}
      hoveredStyle={hoveredStyle}
    >
      {loading ? (
        <ActivityIndicator color={v.color} size="small" />
      ) : (
        <HStack gap={2} alignItems="center">
          {leftIcon}
          <Text style={labelStyle}>{children}</Text>
          {rightIcon}
        </HStack>
      )}
    </Pressable>
  )
}
