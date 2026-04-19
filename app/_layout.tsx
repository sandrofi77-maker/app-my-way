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
import { ThemeProvider, useTheme, ToastProvider } from '../design-system'
import ErrorBoundary from '../components/ErrorBoundary'
import SyncIndicator from '../components/SyncIndicator'
import { useNetworkStore } from '../lib/network'
import { registerExecutor } from '../lib/mutationQueue'
import { expenseExecutor } from '../stores/useExpenseStore'
import { itineraryExecutor } from '../stores/useItineraryStore'
import { checklistExecutor } from '../stores/useChecklistStore'
import { getPendingCount } from '../lib/mutationQueue'

SplashScreen.preventAutoHideAsync()

// Registrar executors uma unica vez no load do modulo
registerExecutor('expense', expenseExecutor)
registerExecutor('itinerary', itineraryExecutor)
registerExecutor('checklist', checklistExecutor)

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

  useEffect(() => {
    const unsubscribe = useNetworkStore.getState().init()

    // Carregar contagem de mutacoes pendentes do storage
    getPendingCount().then((count) => {
      useNetworkStore.getState().setPendingCount(count)
    })

    return unsubscribe
  }, [])

  return (
    <>
      <SyncIndicator />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
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
      <ErrorBoundary>
        <ToastProvider>
          <InnerLayout />
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
