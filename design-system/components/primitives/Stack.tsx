import React from 'react'
import { Box, BoxProps } from './Box'

export type StackProps = Omit<BoxProps, 'flexDirection'> & {
  direction?: 'row' | 'column'
}

export function HStack({ direction = 'row', alignItems = 'center', ...rest }: StackProps) {
  return <Box flexDirection={direction} alignItems={alignItems} {...rest} />
}

export function VStack({ direction = 'column', ...rest }: StackProps) {
  return <Box flexDirection={direction} {...rest} />
}

export function Spacer({ flex = 1 }: { flex?: number }) {
  return <Box flex={flex} />
}
