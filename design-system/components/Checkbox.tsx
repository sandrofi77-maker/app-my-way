import React from 'react'
import { ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type CheckboxProps = {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Checkbox({ checked, onChange, label, disabled, size = 'md' }: CheckboxProps) {
  const theme = useTheme()
  const d = size === 'sm' ? 18 : 22

  const boxStyle: ViewStyle = {
    width: d,
    height: d,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: checked ? theme.colors.brand : theme.colors.borderStrong,
    backgroundColor: checked ? theme.colors.brand : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...(disabled && { opacity: 0.4 }),
  }

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <HStack gap={2.5}>
        <Box style={boxStyle}>
          {checked && (
            <Text style={{ color: theme.colors.textOnBrand, fontSize: d * 0.6, fontWeight: '900', lineHeight: d }}>
              ✓
            </Text>
          )}
        </Box>
        {label && (
          <Text variant="body" color={disabled ? 'textTertiary' : 'text'}>
            {label}
          </Text>
        )}
      </HStack>
    </Pressable>
  )
}
