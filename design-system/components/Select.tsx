import React, { useState } from 'react'
import { Modal, FlatList, ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack, VStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type SelectOption<T extends string | number> = {
  value: T
  label: string
  description?: string
}

export type SelectProps<T extends string | number> = {
  value: T | null
  onChange: (value: T) => void
  options: SelectOption<T>[]
  label?: string
  placeholder?: string
  disabled?: boolean
  errorText?: string
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Selecione…',
  disabled,
  errorText,
}: SelectProps<T>) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  const triggerStyle: ViewStyle = {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: errorText ? theme.colors.error : theme.colors.border,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(disabled && { opacity: 0.5 }),
  }

  return (
    <VStack gap={1.5}>
      {label && (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      )}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label ?? placeholder}
        accessibilityState={{ expanded: open, disabled }}
        style={triggerStyle}
      >
        <Text color={selected ? 'text' : 'textTertiary'}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text color="textTertiary" style={{ fontSize: 12 }}>
          ▾
        </Text>
      </Pressable>
      {errorText && (
        <Text variant="caption" color="error">
          {errorText}
        </Text>
      )}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.surfaceOverlay,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          accessibilityLabel="Fechar seleção"
        >
          <Box
            bg="surface"
            borderRadius="xl"
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '70%',
              overflow: 'hidden',
              ...theme.shadows.lg,
            }}
          >
            <Box p={3} borderBottomWidth={1} borderColor="border">
              <Text variant="subtitle" weight="700">
                {label ?? 'Selecione'}
              </Text>
            </Box>
            <FlatList
              data={options}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: item.value === value ? theme.colors.brandSubtle : 'transparent',
                  }}
                  hoveredStyle={{ backgroundColor: theme.colors.surfaceHigh }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: item.value === value }}
                >
                  <HStack justifyContent="space-between">
                    <VStack gap={0.5} flex={1}>
                      <Text variant="body" weight="600">
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text variant="caption" color="textTertiary">
                          {item.description}
                        </Text>
                      )}
                    </VStack>
                    {item.value === value && (
                      <Text color="brand" style={{ fontSize: 16, fontWeight: '900' }}>
                        ✓
                      </Text>
                    )}
                  </HStack>
                </Pressable>
              )}
              ItemSeparatorComponent={() => (
                <Box style={{ height: 1, backgroundColor: theme.colors.divider }} />
              )}
            />
          </Box>
        </Pressable>
      </Modal>
    </VStack>
  )
}
