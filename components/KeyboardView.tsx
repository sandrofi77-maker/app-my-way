import { KeyboardAvoidingView, Platform, View, ViewProps } from 'react-native'

export default function KeyboardView({ style, children, ...rest }: ViewProps) {
  if (Platform.OS === 'web') {
    return <View style={[{ flex: 1 }, style]} {...rest}>{children}</View>
  }

  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      {...rest}
    >
      {children}
    </KeyboardAvoidingView>
  )
}
