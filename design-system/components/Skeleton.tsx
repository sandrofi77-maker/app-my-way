import React, { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { useTheme } from '../theme'
import { RadiusToken } from '../tokens/radius'

export type SkeletonProps = {
  width?: number | string
  height?: number | string
  borderRadius?: RadiusToken | number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 'md', style }: SkeletonProps) {
  const theme = useTheme()
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  const br = typeof borderRadius === 'number' ? borderRadius : theme.radius[borderRadius]

  return (
    <Animated.View
      accessibilityLabel="Carregando"
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: br,
          backgroundColor: theme.colors.surfaceHigh,
          opacity,
        },
        style,
      ]}
    />
  )
}
