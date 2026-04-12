import React from 'react'
import { Image, ViewStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { useTheme } from '../theme'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = {
  source?: { uri: string } | null
  name?: string
  size?: AvatarSize
  backgroundColor?: string
}

const sizeMap: Record<AvatarSize, { d: number; fs: number }> = {
  xs: { d: 24, fs: 10 },
  sm: { d: 32, fs: 12 },
  md: { d: 40, fs: 14 },
  lg: { d: 56, fs: 18 },
  xl: { d: 80, fs: 24 },
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ source, name, size = 'md', backgroundColor }: AvatarProps) {
  const theme = useTheme()
  const { d, fs } = sizeMap[size]
  const bg = backgroundColor ?? theme.colors.brandSubtle

  const containerStyle: ViewStyle = {
    width: d,
    height: d,
    borderRadius: d / 2,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  if (source?.uri) {
    return (
      <Box style={containerStyle}>
        <Image source={source} style={{ width: d, height: d }} resizeMode="cover" />
      </Box>
    )
  }

  return (
    <Box style={containerStyle}>
      <Text style={{ fontSize: fs, fontWeight: '700', color: theme.colors.text }}>
        {name ? getInitials(name) : '?'}
      </Text>
    </Box>
  )
}
