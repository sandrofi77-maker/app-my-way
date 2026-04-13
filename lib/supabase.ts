import { createClient, type SupportedStorage } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const SUPABASE_URL = 'https://pxbpkkizfvpnocopnsjt.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_aiW5Jfz8RdZcf3UnFbJ7nA_kZwA5LI2'

// Web usa localStorage (default do Supabase), nativo usa AsyncStorage
let storage: SupportedStorage | undefined = undefined
if (Platform.OS !== 'web') {
  storage = require('@react-native-async-storage/async-storage').default
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})