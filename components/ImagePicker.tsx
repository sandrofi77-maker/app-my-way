import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Colors } from '../constants/Colors'
import { t } from '../lib/i18n'
import Icon from './Icon'
import { uploadImage } from '../lib/storage'
import { showAlert } from '../lib/alert'

const C = Colors.dark

type Props = {
  imageUri: string | null
  onImageSelected: (uri: string) => void
  aspect?: [number, number]
  allowsEditing?: boolean
  /** Se fornecido, faz upload automático para o Supabase Storage e retorna a URL pública */
  uploadFolder?: string
  /** Callback para informar o pai quando upload esta em andamento */
  onUploadingChange?: (uploading: boolean) => void
}

export default function ImagePickerComponent({ imageUri, onImageSelected, aspect, allowsEditing, uploadFolder, onUploadingChange }: Props) {
  const [uploading, setUploading] = useState(false)
  // URI gerenciado internamente: nunca depende do pai para re-exibir apos upload
  const [pickedUri, setPickedUri] = useState<string | null>(null)

  async function pickImage() {
    if (Platform.OS !== 'web') {
      const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        showAlert(t('permission_needed_title'), t('permission_needed_body'))
        return
      }
    }
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: allowsEditing ?? true,
      aspect: aspect ?? [16, 9],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri

      if (uploadFolder) {
        setPickedUri(localUri)
        setUploading(true)
        onUploadingChange?.(true)
        try {
          const publicUrl = await uploadImage(localUri, uploadFolder)
          setPickedUri(publicUrl)
          onImageSelected(publicUrl)
        } catch (err) {
          setPickedUri(null)
          console.error('[ImagePicker] Upload failed:', err)
          showAlert('Erro', 'Não foi possível fazer o upload da imagem. Tente novamente.')
        } finally {
          setUploading(false)
          onUploadingChange?.(false)
        }
      } else {
        setPickedUri(localUri)
        onImageSelected(localUri)
      }
    }
  }

  // pickedUri tem prioridade (imagem recém selecionada), fallback para imageUri do pai (imagem existente do banco)
  const displayUri = pickedUri || imageUri

  return (
    <TouchableOpacity style={styles.container} onPress={pickImage} activeOpacity={0.8} disabled={uploading}>
      {displayUri ? (
        <View style={styles.imageWrapper}>
          <Image
            key={displayUri}
            source={{ uri: displayUri }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) => console.warn('[ImagePicker] Image load error:', e.nativeEvent.error, displayUri)}
          />
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.uploadingText}>Enviando...</Text>
            </View>
          ) : (
            <View style={styles.changeOverlay}>
              <Text style={styles.changeText}>Trocar foto</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Icon name="add-photo-alternate" size={36} color={C.tertiary} />
          <Text style={styles.placeholderText}>Adicionar foto de capa</Text>
          <Text style={styles.placeholderSub}>Toque para escolher da galeria</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 180 },
  changeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 10, alignItems: 'center'
  },
  changeText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  uploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  uploadingText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  placeholder: {
    height: 160, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6
  },
  placeholderText: { fontSize: 14, fontWeight: '500', color: C.secondary },
  placeholderSub: { fontSize: 12, color: C.tertiary },
})
