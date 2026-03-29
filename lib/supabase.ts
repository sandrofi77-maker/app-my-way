import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto'

const SUPABASE_URL = 'https://pxbpkkizfvpnocopnsjt.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_aiW5Jfz8RdZcf3UnFbJ7nA_kZwA5LI2'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})