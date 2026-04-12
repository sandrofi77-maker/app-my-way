import React from 'react'
import { View, ViewProps, ViewStyle } from 'react-native'
import { useTheme } from '../../theme'
import { SpacingToken } from '../../tokens/spacing'
import { RadiusToken } from '../../tokens/radius'
import { ShadowToken } from '../../tokens/shadows'

type BoxStyleProps = {
  p?: SpacingToken
  px?: SpacingToken
  py?: SpacingToken
  pt?: SpacingToken
  pr?: SpacingToken
  pb?: SpacingToken
  pl?: SpacingToken
  m?: SpacingToken
  mx?: SpacingToken
  my?: SpacingToken
  mt?: SpacingToken
  mr?: SpacingToken
  mb?: SpacingToken
  ml?: SpacingToken
  gap?: SpacingToken
  bg?: keyof ReturnType<typeof useTheme>['colors'] | string
  borderColor?: keyof ReturnType<typeof useTheme>['colors'] | string
  borderWidth?: number
  borderTopWidth?: number
  borderBottomWidth?: number
  borderRadius?: RadiusToken
  shadow?: ShadowToken
  flex?: number
  flexDirection?: ViewStyle['flexDirection']
  alignItems?: ViewStyle['alignItems']
  justifyContent?: ViewStyle['justifyContent']
  width?: ViewStyle['width']
  height?: ViewStyle['height']
  maxWidth?: ViewStyle['maxWidth']
  minHeight?: ViewStyle['minHeight']
  position?: ViewStyle['position']
  top?: number
  left?: number
  right?: number
  bottom?: number
  overflow?: ViewStyle['overflow']
  opacity?: number
}

export type BoxProps = BoxStyleProps & Omit<ViewProps, 'style'> & { style?: ViewStyle | ViewStyle[] }

function resolveColor(
  value: string | undefined,
  colors: ReturnType<typeof useTheme>['colors']
): string | undefined {
  if (!value) return undefined
  if (value in colors) return (colors as Record<string, string>)[value]
  return value
}

export function Box({
  p, px, py, pt, pr, pb, pl,
  m, mx, my, mt, mr, mb, ml,
  gap,
  bg, borderColor, borderWidth, borderTopWidth, borderBottomWidth,
  borderRadius, shadow: shadowLevel,
  flex, flexDirection, alignItems, justifyContent,
  width, height, maxWidth, minHeight,
  position, top, left, right, bottom, overflow, opacity,
  style, children, ...rest
}: BoxProps) {
  const theme = useTheme()
  const s = theme.spacing

  const computedStyle: ViewStyle = {
    ...(p != null && { padding: s[p] }),
    ...(px != null && { paddingHorizontal: s[px] }),
    ...(py != null && { paddingVertical: s[py] }),
    ...(pt != null && { paddingTop: s[pt] }),
    ...(pr != null && { paddingRight: s[pr] }),
    ...(pb != null && { paddingBottom: s[pb] }),
    ...(pl != null && { paddingLeft: s[pl] }),
    ...(m != null && { margin: s[m] }),
    ...(mx != null && { marginHorizontal: s[mx] }),
    ...(my != null && { marginVertical: s[my] }),
    ...(mt != null && { marginTop: s[mt] }),
    ...(mr != null && { marginRight: s[mr] }),
    ...(mb != null && { marginBottom: s[mb] }),
    ...(ml != null && { marginLeft: s[ml] }),
    ...(gap != null && { gap: s[gap] }),
    ...(bg && { backgroundColor: resolveColor(bg as string, theme.colors) }),
    ...(borderColor && { borderColor: resolveColor(borderColor as string, theme.colors) }),
    ...(borderWidth != null && { borderWidth }),
    ...(borderTopWidth != null && { borderTopWidth }),
    ...(borderBottomWidth != null && { borderBottomWidth }),
    ...(borderRadius && { borderRadius: theme.radius[borderRadius] }),
    ...(shadowLevel && theme.shadows[shadowLevel]),
    ...(flex != null && { flex }),
    ...(flexDirection && { flexDirection }),
    ...(alignItems && { alignItems }),
    ...(justifyContent && { justifyContent }),
    ...(width != null && { width }),
    ...(height != null && { height }),
    ...(maxWidth != null && { maxWidth }),
    ...(minHeight != null && { minHeight }),
    ...(position && { position }),
    ...(top != null && { top }),
    ...(left != null && { left }),
    ...(right != null && { right }),
    ...(bottom != null && { bottom }),
    ...(overflow && { overflow }),
    ...(opacity != null && { opacity }),
  }

  return (
    <View {...rest} style={[computedStyle, style as any]}>
      {children}
    </View>
  )
}
