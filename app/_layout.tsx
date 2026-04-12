import { Stack } from 'expo-router'
import { Text as RNText, TextInput } from 'react-native'
import { useFonts } from 'expo-font'
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
  Roboto_800ExtraBold,
} from '@expo-google-fonts/roboto'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { ThemeProvider, useTheme } from '../design-system'

SplashScreen.preventAutoHideAsync()

const defaultTextStyle = { fontFamily: 'Roboto_400Regular' }
const origTextRender = (RNText as any).render
if (origTextRender) {
  ;(RNText as any).render = function (props: any, ref: any) {
    const style = [defaultTextStyle, props.style]
    return origTextRender.call(this, { ...props, style }, ref)
  }
}
const origInputRender = (TextInput as any).render
if (origInputRender) {
  ;(TextInput as any).render = function (props: any, ref: any) {
    const style = [defaultTextStyle, props.style]
    return origInputRender.call(this, { ...props, style }, ref)
  }
}

function InnerLayout() {
  const theme = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
    Roboto_800ExtraBold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <ThemeProvider defaultMode="light">
      <InnerLayout />
    </ThemeProvider>
  )
}
