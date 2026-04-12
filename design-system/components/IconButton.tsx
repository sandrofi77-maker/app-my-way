import React from 'react'
import { ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type IconButtonVariant = 'solid' | 'ghost' | 'soft' | 'outline'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export type IconButtonProps = {
  children: React.ReactNode
  variant?: IconButtonVariant
  size?: IconButtonSize
  disabled?: boolean
  onPress?: () => void
  accessibilityLabel: string
  testID?: string
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  disabled,
  onPress,
  accessibilityLabel,
  testID,
}: IconButtonProps) {
  const theme = useTheme()

  const sizeMap: Record<IconButtonSize, number> = { sm: 32, md: 38, lg: 44 }
  const d = sizeMap[size]

  const styles: Record<IconButtonVariant, ViewStyle> = {
    solid: { backgroundColor: theme.colors.brand },
    ghost: { backgroundColor: 'transparent' },
    soft: { backgroundColor: theme.colors.brandSubtle },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  }

  const baseStyle: ViewStyle = {
    width: d,
    height: d,
    borderRadius: d / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...styles[variant],
    ...(disabled && { opacity: 0.4 }),
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={baseStyle}
      pressedStyle={{ opacity: 0.75 }}
      hoveredStyle={{ opacity: 0.9 }}
    >
      {children as any}
    </Pressable>
  )
}
