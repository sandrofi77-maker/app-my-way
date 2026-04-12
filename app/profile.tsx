import { ScrollView, ActivityIndicator } from 'react-native'
import { useCallback, useState } from 'react'
import { useFocusEffect, router } from 'expo-router'
import { supabase } from '../lib/supabase'
import ImagePickerComponent from '../components/ImagePicker'
import { t } from '../lib/i18n'
import Icon from '../components/Icon'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import DesktopLayout from '../components/DesktopLayout'
import {
  Box, Text, VStack, Input, Button, useTheme, IconButton,
} from '../design-system'

export default function ProfileScreen() {
  const theme = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
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
      showAlert('Perfil atualizado', 'Suas informacoes foram salvas.')
    } catch (err: any) {
      showAlert(t('error_title'), err?.message || t('generic_error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <DesktopLayout>
      <KeyboardView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 120 }}>
          <Box mb={4}>
            <IconButton accessibilityLabel="Voltar" onPress={() => router.back()} variant="ghost">
              <Icon name="arrow-back" size={22} color={theme.colors.text} />
            </IconButton>
          </Box>

          <Text variant="h3" style={{ marginBottom: 16 }}>Meu perfil</Text>

          {loading ? (
            <ActivityIndicator color={theme.colors.brand} />
          ) : (
            <VStack gap={4}>
              <VStack gap={1.5}>
                <Text variant="label" color="textSecondary">Foto do avatar</Text>
                <ImagePickerComponent
                  imageUri={avatarUri}
                  onImageSelected={setAvatarUri}
                  aspect={[1, 1]}
                  allowsEditing
                  uploadFolder="avatars"
                  onUploadingChange={setAvatarUploading}
                />
              </VStack>

              <Input
                label="Nome de exibicao"
                placeholder="Seu nome"
                value={name}
                onChangeText={setName}
                size="lg"
              />

              <VStack gap={1.5}>
                <Text variant="label" color="textSecondary">Email logado</Text>
                <Box
                  bg="surface" borderWidth={1} borderColor="border"
                  borderRadius="lg" px={3.5} py={3}
                >
                  <Text variant="body" color="text">{email || '--'}</Text>
                </Box>
              </VStack>

              <Box mt={4}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={saving}
                  disabled={avatarUploading}
                  onPress={handleSave}
                >
                  Salvar
                </Button>
              </Box>
            </VStack>
          )}
        </ScrollView>

        <Box
          position="absolute" left={20} right={20} bottom={24}
          borderWidth={1} borderColor="error" borderRadius="lg"
          py={3.5} alignItems="center"
          bg="#FF3B3022"
        >
          <Button variant="ghost" fullWidth onPress={handleLogout}>
            <Text variant="subtitle" color="error">Sair do aplicativo</Text>
          </Button>
        </Box>
      </KeyboardView>
    </DesktopLayout>
  )
}
