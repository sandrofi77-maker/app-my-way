import React from 'react'
import { Box } from '../primitives/Box'
import { VStack } from '../primitives/Stack'
import { Text } from '../primitives/Text'
import { Checkbox } from '../Checkbox'
import { Pressable } from '../primitives/Pressable'
import { useTheme } from '../../theme'

export type ChecklistItemData = {
  id: string
  label: string
  done: boolean
}

export type ChecklistProps = {
  items: ChecklistItemData[]
  onToggle: (id: string) => void
  onRemove?: (id: string) => void
  title?: string
}

export function Checklist({ items, onToggle, onRemove, title }: ChecklistProps) {
  const theme = useTheme()
  const completed = items.filter(i => i.done).length

  return (
    <VStack gap={3}>
      {title && (
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="subtitle" weight="700">
            {title}
          </Text>
          <Text variant="caption" color="textTertiary">
            {completed}/{items.length}
          </Text>
        </Box>
      )}
      <VStack gap={1}>
        {items.map(item => (
          <Box
            key={item.id}
            flexDirection="row"
            alignItems="center"
            px={3}
            py={2.5}
            borderRadius="md"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Box flex={1}>
              <Checkbox
                checked={item.done}
                onChange={() => onToggle(item.id)}
                label={item.label}
              />
            </Box>
            {onRemove && (
              <Pressable onPress={() => onRemove(item.id)} accessibilityLabel={`Remover ${item.label}`}>
                <Text color="textTertiary" style={{ fontSize: 16 }}>
                  ×
                </Text>
              </Pressable>
            )}
          </Box>
        ))}
      </VStack>
    </VStack>
  )
}
