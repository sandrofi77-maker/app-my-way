import React, { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type SwitchProps = {
  value: boolean
  onValueChange: (next: boolean) => void
  disabled?: boolean
  accessibilityLabel?: string
}

export function Switch({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) {
  const theme = useTheme()
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start()
  }, [value, anim])

  const trackWidth = 44
  const trackHeight = 26
  const thumbSize = 22
  const padding = 2

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.borderStrong, theme.colors.success],
  })

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [padding, trackWidth - thumbSize - padding],
  })

  const trackStyle: Animated.AnimatedProps<ViewStyle> = {
    width: trackWidth,
    height: trackHeight,
    borderRadius: trackHeight / 2,
    backgroundColor: bg,
    justifyContent: 'center',
    ...(disabled && { opacity: 0.5 }),
  }

  const thumbStyle: ViewStyle = {
    width: thumbSize,
    height: thumbSize,
    borderRadius: thumbSize / 2,
    backgroundColor: '#FFFFFF',
    ...theme.shadows.xs,
  }

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={trackStyle}>
        <Animated.View style={[thumbStyle, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  )
}
