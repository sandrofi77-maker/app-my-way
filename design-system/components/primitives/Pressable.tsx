import React from 'react'
import {
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
  ViewStyle,
} from 'react-native'

export type PressableProps = Omit<RNPressableProps, 'style'> & {
  style?: ViewStyle | ViewStyle[] | ((state: { pressed: boolean; hovered?: boolean }) => ViewStyle | ViewStyle[])
  hoveredStyle?: ViewStyle
  pressedStyle?: ViewStyle
  disabledStyle?: ViewStyle
}

export function Pressable({
  style,
  hoveredStyle,
  pressedStyle,
  disabledStyle,
  disabled,
  children,
  ...rest
}: PressableProps) {
  return (
    <RNPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      style={(state: { pressed: boolean; hovered?: boolean }) => {
        const base = typeof style === 'function' ? style(state) : style
        const hovered = state.hovered && hoveredStyle
        const pressed = state.pressed && pressedStyle
        const disabledS = disabled && disabledStyle
        return [base, hovered, pressed, disabledS].filter(Boolean) as ViewStyle[]
      }}
    >
      {children as React.ReactNode}
    </RNPressable>
  )
}
