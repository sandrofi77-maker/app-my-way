import React from 'react'
import { ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type FABProps = {
  children: React.ReactNode
  onPress?: () => void
  position?: 'bottomRight' | 'bottomLeft' | 'bottomCenter'
  size?: 'md' | 'lg'
  accessibilityLabel: string
}

export function FAB({
  children,
  onPress,
  position = 'bottomRight',
  size = 'lg',
  accessibilityLabel,
}: FABProps) {
  const theme = useTheme()
  const d = size === 'lg' ? 56 : 48

  const baseStyle: ViewStyle = {
    position: 'absolute',
    bottom: 24,
    ...(position === 'bottomRight' && { right: 24 }),
    ...(position === 'bottomLeft' && { left: 24 }),
    ...(position === 'bottomCenter' && { alignSelf: 'center' as any }),
    width: d,
    height: d,
    borderRadius: d / 2,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={baseStyle}
      pressedStyle={{ opacity: 0.88 }}
    >
      {children as any}
    </Pressable>
  )
}
