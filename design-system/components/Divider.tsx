import React from 'react'
import { Box } from './primitives/Box'
import { useTheme } from '../theme'

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical'
  inset?: number
}

export function Divider({ orientation = 'horizontal', inset = 0 }: DividerProps) {
  const theme = useTheme()

  if (orientation === 'vertical') {
    return (
      <Box
        style={{
          width: 1,
          alignSelf: 'stretch',
          marginVertical: inset,
          backgroundColor: theme.colors.divider,
        }}
      />
    )
  }

  return (
    <Box
      style={{
        height: 1,
        width: '100%',
        marginHorizontal: inset,
        backgroundColor: theme.colors.divider,
      }}
    />
  )
}
