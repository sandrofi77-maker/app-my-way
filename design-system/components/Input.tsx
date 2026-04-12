import React, { forwardRef, useState } from 'react'
import { TextInput, TextInputProps, ViewStyle, TextStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { VStack, HStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type InputSize = 'sm' | 'md' | 'lg'

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string
  helperText?: string
  errorText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: InputSize
  required?: boolean
  containerStyle?: ViewStyle
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    helperText,
    errorText,
    leftIcon,
    rightIcon,
    size = 'md',
    required,
    containerStyle,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  },
  ref
) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)
  const hasError = !!errorText

  const sizeMap: Record<InputSize, { height: number; fontSize: number }> = {
    sm: { height: 36, fontSize: theme.typography.fontSize.md },
    md: { height: 44, fontSize: theme.typography.fontSize.lg },
    lg: { height: 52, fontSize: theme.typography.fontSize.xl },
  }
  const s = sizeMap[size]

  const borderColor = hasError
    ? theme.colors.error
    : focused
    ? theme.colors.focusRing
    : theme.colors.border

  const wrapperStyle: ViewStyle = {
    height: s.height,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...(editable === false && { opacity: 0.6 }),
  }

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: s.fontSize,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.sans,
    fontWeight: undefined,
    ...(leftIcon && { marginLeft: 8 }),
    ...(rightIcon && { marginRight: 8 }),
    // web-specific outline removal
    ...({ outlineStyle: 'none' } as any),
  }

  return (
    <VStack gap={1.5} style={containerStyle}>
      {label && (
        <HStack gap={0.5}>
          <Text variant="label" color="textSecondary">
            {label}
          </Text>
          {required && (
            <Text variant="label" color="error">
              *
            </Text>
          )}
        </HStack>
      )}
      <Box style={wrapperStyle}>
        {leftIcon}
        <TextInput
          ref={ref}
          {...rest}
          editable={editable}
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
        {rightIcon}
      </Box>
      {(helperText || errorText) && (
        <Text variant="caption" color={hasError ? 'error' : 'textTertiary'}>
          {errorText ?? helperText}
        </Text>
      )}
    </VStack>
  )
})
