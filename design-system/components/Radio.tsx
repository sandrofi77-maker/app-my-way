import React from 'react'
import { ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack, VStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type RadioProps = {
  selected: boolean
  onPress: () => void
  label?: string
  disabled?: boolean
}

export function Radio({ selected, onPress, label, disabled }: RadioProps) {
  const theme = useTheme()
  const d = 22

  const outerStyle: ViewStyle = {
    width: d,
    height: d,
    borderRadius: d / 2,
    borderWidth: 2,
    borderColor: selected ? theme.colors.brand : theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...(disabled && { opacity: 0.4 }),
  }

  const innerStyle: ViewStyle = {
    width: d / 2,
    height: d / 2,
    borderRadius: d / 4,
    backgroundColor: theme.colors.brand,
  }

  return (
    <Pressable
      onPress={() => !disabled && onPress()}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      <HStack gap={2.5}>
        <Box style={outerStyle}>{selected && <Box style={innerStyle} />}</Box>
        {label && (
          <Text variant="body" color={disabled ? 'textTertiary' : 'text'}>
            {label}
          </Text>
        )}
      </HStack>
    </Pressable>
  )
}

export type RadioGroupProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; disabled?: boolean }[]
  orientation?: 'horizontal' | 'vertical'
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  orientation = 'vertical',
}: RadioGroupProps<T>) {
  const Container = orientation === 'horizontal' ? HStack : VStack
  return (
    <Container gap={3} accessibilityRole={'radiogroup' as any}>
      {options.map(opt => (
        <Radio
          key={opt.value}
          label={opt.label}
          selected={value === opt.value}
          disabled={opt.disabled}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </Container>
  )
}
