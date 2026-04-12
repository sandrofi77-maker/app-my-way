import React from 'react'
import { TextInputProps } from 'react-native'
import { Input } from './Input'
import { Text } from './primitives/Text'
import { Pressable } from './primitives/Pressable'

export type SearchBarProps = Omit<TextInputProps, 'style'> & {
  onClear?: () => void
}

export function SearchBar({ value, onChangeText, onClear, placeholder = 'Buscar…', ...rest }: SearchBarProps) {
  return (
    <Input
      {...rest}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      leftIcon={<Text style={{ fontSize: 14, marginRight: 4 }}>🔍</Text>}
      rightIcon={
        value ? (
          <Pressable onPress={onClear} accessibilityLabel="Limpar busca">
            <Text color="textTertiary" style={{ fontSize: 18, marginLeft: 4 }}>
              ×
            </Text>
          </Pressable>
        ) : undefined
      }
      accessibilityLabel="Buscar"
    />
  )
}
