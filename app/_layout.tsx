import { Stack } from 'expo-router'
import { Text as RNText, TextInput, Platform } from 'react-native'
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
import { ThemeProvider, useTheme, ToastProvider, Box, Text } from '../design-system'
import ErrorBoundary from '../components/ErrorBoundary'
import SyncIndicator from '../components/SyncIndicator'
import { useNetworkStore } from '../lib/network'
import { registerExecutor } from '../lib/mutationQueue'
import { expenseExecutor } from '../stores/useExpenseStore'
import { itineraryExecutor } from '../stores/useItineraryStore'
import { checklistExecutor } from '../stores/useChecklistStore'
import { getPendingCount } from '../lib/mutationQueue'
import { isSupabaseConfigured, supabaseConfigError } from '../lib/supabase'

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

  if (!isSupabaseConfigured && Platform.OS === 'web') {
    return (
      <ThemeProvider defaultMode="light">
        <Box flex={1} bg="background" alignItems="center" justifyContent="center" px={6}>
          <Box bg="surface" borderRadius="xl" p={6} maxWidth={560} width="100%" borderWidth={1} borderColor="border">
            <Text variant="h3" weight="700">Configuracao web incompleta</Text>
            <Text variant="body" color="textSecondary" mt={2}>
              {supabaseConfigError}
            </Text>
            <Text variant="bodySmall" color="textTertiary" mt={3}>
              Configure essas variaveis no projeto da Vercel e refaca o deploy.
            </Text>
          </Box>
        </Box>
      </ThemeProvider>
    )
  }

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
