import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, useWindowDimensions
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t } from '../lib/i18n'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import Icon from '../components/Icon'

const C = Colors.dark

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  async function handleResetPassword() {
    if (!email.trim()) {
      showAlert(t('attention_title'), t('reset_password_empty'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (error) throw error
      showAlert(t('reset_password_title'), t('reset_password_body'))
    } catch (err: any) {
      showAlert(t('error_title'), err.message || t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleAuth() {
    if (!email || !password) {
      showAlert(t('attention_title'), t('required_auth_fields'))
      return
    }
    setLoading(true)
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        showAlert(t('create_account_title'), t('create_account_body'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/(tabs)/home')
      }
    } catch (err: any) {
      showAlert(t('error_title'), err.message || t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 1024

  return (
    <KeyboardView style={styles.container}>
      {isDesktop ? (
        <View style={styles.desktopRow}>
          {/* Left: branding */}
          <View style={styles.desktopLeft}>
            <View style={styles.desktopBrand}>
              <View style={styles.desktopLogoIcon}>
                <Icon name="flight" size={32} color="#fff" />
              </View>
              <Text style={styles.desktopLogoText}>MyWay</Text>
              <Text style={styles.desktopTagline}>Planeje suas viagens com facilidade.{'\n'}Roteiros, voos, hospedagem e gastos{'\n'}em um so lugar.</Text>
            </View>
          </View>
          {/* Right: form card */}
          <View style={styles.desktopRight}>
            <View style={styles.desktopCard}>
              <Text style={styles.desktopCardTitle}>
                {isRegister ? 'Criar conta' : 'Bem-vindo de volta'}
              </Text>
              <Text style={styles.desktopCardSubtitle}>
                {isRegister ? 'Preencha seus dados para comecar' : 'Entre na sua conta para continuar'}
              </Text>
              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={C.tertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <Text style={styles.label}>Senha</Text>
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={C.tertiary} value={password} onChangeText={setPassword} secureTextEntry />
                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAuth} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>}
                </TouchableOpacity>
                {!isRegister && (
                  <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
                    <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                  <Text style={styles.toggle}>{isRegister ? 'Já tenho conta — fazer login' : 'Não tenho conta — cadastrar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.logo}>My Way</Text>
            <Text style={styles.tagline}>Sua viagem, do seu jeito</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={C.tertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Senha</Text>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={C.tertiary} value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>}
            </TouchableOpacity>
            {!isRegister && (
              <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.toggle}>{isRegister ? 'Já tenho conta — fazer login' : 'Não tenho conta — cadastrar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // ── Mobile ──
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: '700', color: C.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: C.secondary, marginTop: 6 },

  // ── Desktop: split layout ──
  desktopRow: { flex: 1, flexDirection: 'row' },
  desktopLeft: {
    flex: 1, backgroundColor: '#0F2F59',
    alignItems: 'center', justifyContent: 'center', padding: 48,
  },
  desktopBrand: { alignItems: 'center', maxWidth: 400 },
  desktopLogoIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  desktopLogoText: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 16 },
  desktopTagline: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24 },
  desktopRight: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48,
  },
  desktopCard: {
    width: '100%', maxWidth: 420,
    backgroundColor: C.surface, borderRadius: 20, padding: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 8,
  },
  desktopCardTitle: { fontSize: 24, fontWeight: '700', color: C.primary, marginBottom: 4 },
  desktopCardSubtitle: { fontSize: 14, color: C.secondary, marginBottom: 24 },

  // ── Shared ──
  form: { gap: 8 },
  label: { fontSize: 13, color: C.secondary, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: C.surfaceHigh,
    borderWidth: 0.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.primary,
  },
  button: {
    backgroundColor: C.buttonPrimary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  forgotPassword: { color: C.secondary, fontSize: 13, textAlign: 'center', marginTop: 14 },
  toggle: { color: C.accent, fontSize: 13, textAlign: 'center', marginTop: 16 },
})