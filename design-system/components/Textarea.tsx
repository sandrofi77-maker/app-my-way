import React, { forwardRef, useState } from 'react'
import { TextInput, TextInputProps, ViewStyle, TextStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { VStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type TextareaProps = Omit<TextInputProps, 'style' | 'multiline'> & {
  label?: string
  helperText?: string
  errorText?: string
  rows?: number
  maxLength?: number
  showCounter?: boolean
  containerStyle?: ViewStyle
}

export const Textarea = forwardRef<TextInput, TextareaProps>(function Textarea(
  { label, helperText, errorText, rows = 4, maxLength, showCounter, containerStyle, value, onFocus, onBlur, ...rest },
  ref
) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)
  const hasError = !!errorText

  const borderColor = hasError
    ? theme.colors.error
    : focused
    ? theme.colors.focusRing
    : theme.colors.border

  const wrapperStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: rows * 22 + 24,
  }

  const inputStyle: TextStyle = {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.sans,
    fontWeight: undefined,
    minHeight: rows * 22,
    textAlignVertical: 'top',
    ...({ outlineStyle: 'none' } as any),
  }

  return (
    <VStack gap={1.5} style={containerStyle}>
      {label && (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      )}
      <Box style={wrapperStyle}>
        <TextInput
          ref={ref}
          {...rest}
          multiline
          value={value}
          maxLength={maxLength}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={e => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={e => {
            setFocused(false)
            onBlur?.(e)
          }}
          style={inputStyle}
          accessibilityLabel={label}
        />
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Text variant="caption" color={hasError ? 'error' : 'textTertiary'}>
          {errorText ?? helperText ?? ''}
        </Text>
        {showCounter && maxLength && (
          <Text variant="caption" color="textTertiary">
            {value?.length ?? 0}/{maxLength}
          </Text>
        )}
      </Box>
    </VStack>
  )
})
