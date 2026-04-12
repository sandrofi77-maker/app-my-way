import React from 'react'
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native'
import { useTheme } from '../../theme'
import { TextVariant, fontFamilyByWeight } from '../../tokens/typography'
import { SemanticColors } from '../../tokens/colors'

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant
  color?: keyof SemanticColors | string
  align?: TextStyle['textAlign']
  weight?: '400' | '500' | '600' | '700' | '800'
  numberOfLines?: number
  italic?: boolean
  style?: TextStyle | TextStyle[]
  children?: React.ReactNode
}

export function Text({
  variant = 'body',
  color = 'text',
  align,
  weight,
  italic,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme()
  const v = theme.typography.variants[variant]

  const resolvedColor =
    (color in theme.colors ? (theme.colors as Record<string, string>)[color] : color) as string

  const resolvedWeight = weight ?? v.fontWeight
  const textStyle: TextStyle = {
    fontFamily: fontFamilyByWeight[resolvedWeight] ?? theme.typography.fontFamily.sans,
    fontSize: v.fontSize,
    lineHeight: v.lineHeight,
    letterSpacing: v.letterSpacing,
    textTransform: v.textTransform,
    color: resolvedColor,
    ...(align && { textAlign: align }),
    ...(italic && { fontStyle: 'italic' }),
  }

  return (
    <RNText {...rest} style={[textStyle, style as any]}>
      {children}
    </RNText>
  )
}
