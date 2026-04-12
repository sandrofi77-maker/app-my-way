import React from 'react'
import { HStack } from './primitives/Stack'
import { Text } from './primitives/Text'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type TagProps = {
  label: string
  leftIcon?: React.ReactNode
  onRemove?: () => void
  selected?: boolean
  onPress?: () => void
}

export function Tag({ label, leftIcon, onRemove, selected, onPress }: TagProps) {
  const theme = useTheme()

  const bg = selected ? theme.colors.brand : theme.colors.surfaceHigh
  const color = selected ? theme.colors.textOnBrand : theme.colors.text
  const border = selected ? theme.colors.brand : theme.colors.border

  const content = (
    <HStack
      gap={1.5}
      px={2.5}
      py={1}
      style={{
        backgroundColor: bg,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      {leftIcon}
      <Text variant="caption" style={{ color, fontWeight: '600' }}>
        {label}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          accessibilityLabel={`Remover ${label}`}
          style={{ marginLeft: 2 }}
        >
          <Text style={{ color, fontSize: 12, fontWeight: '700' }}>×</Text>
        </Pressable>
      )}
    </HStack>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {content}
      </Pressable>
    )
  }
  return content
}
