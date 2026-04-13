import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import ImagePickerComponent from './ImagePicker'
import { t } from '../lib/i18n'
import { showAlert } from '../lib/alert'
import SheetModal from './SheetModal'

const C = Colors.dark

type Props = {
  visible: boolean
  onClose: () => void
}

export default function ProfileSheet({ visible, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible) loadProfile()
  }, [visible])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setName((user.user_metadata?.full_name as string | undefined) || '')
        const rawAvatar = (user.user_metadata?.avatar_url as string | undefined) || null
        setAvatarUri(rawAvatar?.startsWith('https://') ? rawAvatar : null)
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
      showAlert('Perfil atualizado', 'Suas informações foram salvas.')
    } catch (err: unknown) {
      showAlert(t('error_title'), err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    onClose()
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <SheetModal visible={visible} onClose={onClose} title="Meu perfil" drawerWidth={480}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.label}>Foto do avatar</Text>
          <ImagePickerComponent
            imageUri={avatarUri}
            onImageSelected={setAvatarUri}
            aspect={[1, 1]}
            allowsEditing
            uploadFolder="avatars"
            onUploadingChange={setAvatarUploading}
          />

          <Text style={styles.label}>Nome de exibição</Text>
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
            style={[styles.saveButton, (saving || avatarUploading) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || avatarUploading}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.9}>
            <Text style={styles.logoutText}>Sair do aplicativo</Text>
          </TouchableOpacity>
        </>
      )}
    </SheetModal>
  )
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 60 },
  label: { fontSize: 13, color: C.secondary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.background,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.primary,
  },
  readOnlyBox: {
    backgroundColor: C.background,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: { color: C.primary, fontSize: 15 },
  saveButton: {
    backgroundColor: C.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  logoutButton: {
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: C.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FF3B3022',
  },
  logoutText: { color: C.error, fontSize: 14, fontWeight: '600' },
})
