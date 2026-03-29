import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t } from '../lib/i18n'

const C = Colors.dark

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert(t('attention_title'), t('required_auth_fields'))
      return
    }
    setLoading(true)
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        Alert.alert(t('create_account_title'), t('create_account_body'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/(tabs)/home')
      }
    } catch (err: any) {
      Alert.alert(t('error_title'), err.message || t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>My Way</Text>
          <Text style={styles.tagline}>Sua viagem, do seu jeito</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor={C.tertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={C.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.buttonText}>
                  {isRegister ? 'Criar conta' : 'Entrar'}
                </Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggle}>
              {isRegister ? 'Já tenho conta — fazer login' : 'Não tenho conta — cadastrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: '700', color: C.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: C.secondary, marginTop: 6 },
  form: { gap: 8 },
  label: { fontSize: 13, color: C.secondary, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.primary,
  },
  button: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  toggle: {
    color: C.accent,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
})