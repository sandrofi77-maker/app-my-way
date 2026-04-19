import { createClient, type SupportedStorage } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const supabaseConfigError =
  'Variaveis EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY sao obrigatorias. Configure no ambiente de deploy.'

let storage: SupportedStorage | undefined
if (Platform.OS !== 'web') {
  storage = require('@react-native-async-storage/async-storage').default
}

const missingConfigClient = new Proxy(
  {},
  {
    get() {
      throw new Error(supabaseConfigError)
    },
  }
)

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : (missingConfigClient as any)
