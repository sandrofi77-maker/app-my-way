import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from 'react-native'
import { useCallback, useState } from 'react'
import { useFocusEffect, router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import ImagePickerComponent from '../components/ImagePicker'
import { t } from '../lib/i18n'

const C = Colors.dark

export default function ProfileScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useFocusEffect(
    useCallback(() => { loadProfile() }, [])
  )

  async function loadProfile() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setName((user.user_metadata?.full_name as string | undefined) || '')
        setAvatarUri((user.user_metadata?.avatar_url as string | undefined) || null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const trimmedName = name.trim()
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          display_name: trimmedName,
          avatar_url: avatarUri,
        }
      })
      if (error) throw error
      Alert.alert('Perfil atualizado', 'Suas informacoes foram salvas.')
    } catch (err: any) {
      Alert.alert(t('error_title'), err?.message || t('generic_error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>{'<'} Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Meu perfil</Text>

        {loading ? (
          <ActivityIndicator color={C.primary} />
        ) : (
          <>
            <Text style={styles.label}>Foto do avatar</Text>
            <ImagePickerComponent
              imageUri={avatarUri}
              onImageSelected={setAvatarUri}
              aspect={[1, 1]}
              allowsEditing
            />

            <Text style={styles.label}>Nome de exibicao</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={C.tertiary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email logado</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{email || '--'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.9}>
        <Text style={styles.logoutText}>Sair do aplicativo</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  back: { marginBottom: 16 },
  backText: { color: C.accent, fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: C.primary, marginBottom: 16 },
  label: { fontSize: 13, color: C.secondary, marginBottom: 6, marginTop: 14 },
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
  readOnlyBox: {
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: { color: C.primary, fontSize: 15 },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  logoutButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    borderWidth: 0.5,
    borderColor: C.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FF3B3022',
  },
  logoutText: { color: C.error, fontSize: 14, fontWeight: '600' },
})
