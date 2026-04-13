import { View, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { showAlert } from '../lib/alert'
import { isValidEmail } from '../lib/validation'
import KeyboardView from '../components/KeyboardView'
import Icon from '../components/Icon'
import {
  Box, Text, VStack, HStack, Input, Button, Divider, useTheme, Pressable,
} from '../design-system'

function BackgroundDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={bgStyles.blob1} />
      <View style={bgStyles.blob2} />
      <View style={bgStyles.blob3} />
      <View style={bgStyles.ring1} />
      <View style={bgStyles.ring2} />
    </View>
  )
}

const bgStyles = StyleSheet.create({
  blob1: {
    position: 'absolute', top: '5%' as any, left: '-5%' as any,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(98,87,221,0.07)',
  },
  blob2: {
    position: 'absolute', bottom: '5%' as any, right: '-8%' as any,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(0,122,255,0.05)',
  },
  blob3: {
    position: 'absolute', top: '40%' as any, right: '20%' as any,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(42,189,110,0.04)',
  },
  ring1: {
    position: 'absolute', top: '15%' as any, left: '10%' as any,
    width: 300, height: 300, borderRadius: 150,
    borderWidth: 1, borderColor: 'rgba(98,87,221,0.06)',
    backgroundColor: 'transparent',
  },
  ring2: {
    position: 'absolute', bottom: '10%' as any, right: '5%' as any,
    width: 250, height: 250, borderRadius: 125,
    borderWidth: 1, borderColor: 'rgba(0,122,255,0.05)',
    backgroundColor: 'transparent',
  },
})

export default function LoginScreen() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  async function handleResetPassword() {
    if (!email.trim()) {
      showAlert(t('attention_title'), t('reset_password_empty'))
      return
    }
    if (!isValidEmail(email.trim())) {
      showAlert(t('attention_title'), t('invalid_email'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (error) throw error
      showAlert(t('reset_password_title'), t('reset_password_body'))
    } catch (err: unknown) {
      showAlert(t('error_title'), err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleAuth() {
    if (!email || !password) {
      showAlert(t('attention_title'), t('required_auth_fields'))
      return
    }
    if (!isValidEmail(email.trim())) {
      showAlert(t('attention_title'), t('invalid_email'))
      return
    }
    if (isRegister && password.length < 6) {
      showAlert(t('attention_title'), t('password_too_short'))
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
    } catch (err: unknown) {
      showAlert(t('error_title'), err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 768

  const formContent = (
    <VStack gap={6}>
      {/* Branding */}
      <Box alignItems="center" mb={6}>
        <HStack gap={2.5} mb={3} alignItems="center">
          <Box
            width={40} height={40} borderRadius="lg"
            bg="brand" alignItems="center" justifyContent="center"
          >
            <Icon name="flight" size={20} color="#fff" />
          </Box>
          <Text variant="h2" weight="800">MyWay</Text>
        </HStack>
        <Text variant="body" color="textSecondary">
          {isRegister ? 'Crie sua conta para comecar' : 'Entre na sua conta'}
        </Text>
      </Box>

      <Divider />

      {/* Form */}
      <VStack gap={4}>
        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          size="lg"
        />

        <VStack gap={1.5}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text variant="label" color="textSecondary">Senha</Text>
            {!isRegister && (
              <Pressable onPress={handleResetPassword} disabled={loading} accessibilityLabel="Esqueci a senha" accessibilityRole="button">
                <Text variant="caption" color="accent">Esqueci a senha</Text>
              </Pressable>
            )}
          </HStack>
          <Input
            placeholder="Digite sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            size="lg"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={isRegister ? 'newPassword' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            rightIcon={(
              <Pressable
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                style={{ paddingVertical: 4, paddingHorizontal: 2 }}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            )}
          />
        </VStack>

        <Box mt={2}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleAuth}
          >
            {isRegister ? 'Criar conta' : 'Entrar'}
          </Button>
        </Box>
      </VStack>

      {/* Footer */}
      <VStack gap={4} mt={3} alignItems="center">
        <HStack gap={3} alignItems="center" style={{ width: '100%' }}>
          <Box flex={1} height={1} bg="divider" />
          <Text variant="caption" color="textTertiary">ou</Text>
          <Box flex={1} height={1} bg="divider" />
        </HStack>
        <Pressable onPress={() => setIsRegister(!isRegister)} accessibilityLabel={isRegister ? 'Já tenho conta, fazer login' : 'Não tenho conta, cadastrar'} accessibilityRole="button">
          <Text variant="bodySmall" color="textSecondary" align="center">
            {isRegister ? 'Ja tenho conta \u2014 ' : 'Nao tenho conta \u2014 '}
            <Text variant="bodySmall" color="accent" weight="600">
              {isRegister ? 'fazer login' : 'cadastrar'}
            </Text>
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  )

  if (isDesktop) {
    return (
      <Box flex={1} bg="background" overflow="hidden">
        <BackgroundDecor />
        <ScrollView
          contentContainerStyle={styles.desktopScroll}
          keyboardShouldPersistTaps="handled"
        >
          <Box
            bg="surface" borderRadius="3xl" p={11}
            maxWidth={440} width="100%"
            shadow="lg" borderWidth={1} borderColor="border"
          >
            {formContent}
          </Box>
          <Box mt={8}>
            <Text variant="caption" color="textTertiary" align="center">
              MyWay — Planeje suas viagens com facilidade
            </Text>
          </Box>
        </ScrollView>
      </Box>
    )
  }

  return (
    <KeyboardView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.mobileScroll}
        keyboardShouldPersistTaps="handled"
      >
        {formContent}
      </ScrollView>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  desktopScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    minHeight: '100%' as any,
  },
  mobileScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
})
