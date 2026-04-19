import {
  View, Image, TouchableOpacity, StyleSheet, Platform,
  ActivityIndicator, Modal, Dimensions, ScrollView, Linking,
} from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useState, useCallback, useRef } from 'react'
import Icon from './Icon'
import { uploadImage } from '../lib/storage'
import { showAlert } from '../lib/alert'
import { t } from '../lib/i18n'
import { Text, HStack, VStack, useTheme } from '../design-system'

type Props = {
  /** JSON-stringified array or single URL (retrocompat) */
  imageUris: string[]
  onChanged: (uris: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

const SCREEN = Dimensions.get('window')

export default function ReceiptPicker({ imageUris, onChanged, onUploadingChange }: Props) {
  const theme = useTheme()
  const [uploading, setUploading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const closingRef = useRef(false)

  const closePreview = useCallback(() => {
    closingRef.current = true
    setPreviewVisible(false)
    setTimeout(() => { closingRef.current = false }, 600)
  }, [])

  const addUri = useCallback((uri: string) => {
    onChanged([...imageUris, uri])
  }, [imageUris, onChanged])

  const removeAt = useCallback((index: number) => {
    onChanged(imageUris.filter((_, i) => i !== index))
    closePreview()
  }, [imageUris, onChanged])

  async function handleUpload(localUri: string) {
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const publicUrl = await uploadImage(localUri, 'receipts')
      addUri(publicUrl)
    } catch (err) {
      console.error('[ReceiptPicker] Upload failed:', err)
      showAlert('Erro', 'Não foi possível enviar o comprovante. Tente novamente.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  async function pickFromCamera() {
    if (Platform.OS !== 'web') {
      const permission = await ExpoImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        showAlert(t('permission_needed_title'), 'Permita o acesso à câmera nas configurações.')
        return
      }
    }
    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri)
    }
  }

  async function pickFromGallery() {
    if (Platform.OS !== 'web') {
      const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        showAlert(t('permission_needed_title'), t('permission_needed_body'))
        return
      }
    }
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri)
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    })
    if (!result.canceled && result.assets?.[0]) {
      await handleUpload(result.assets[0].uri)
    }
  }

  function openPreview(index: number) {
    if (closingRef.current) return
    const uri = imageUris[index]
    if (isPdf(uri)) {
      Linking.openURL(uri)
    } else {
      setPreviewIndex(index)
      setPreviewVisible(true)
    }
  }

  // ── Render ──

  return (
    <View style={styles.wrap}>
      <Text variant="overline" color="textSecondary" style={{ marginBottom: 10 }}>
        Comprovantes {imageUris.length > 0 ? `(${imageUris.length})` : ''}
      </Text>

      {/* Thumbnails grid */}
      {imageUris.length > 0 && (
        <View style={styles.thumbGrid}>
          {imageUris.map((uri, i) => (
            <View key={uri + i} style={styles.thumbWrap}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => openPreview(i)}>
                {isPdf(uri) ? (
                  <View style={[styles.thumbPdf, { backgroundColor: theme.colors.surfaceHigh }]}>
                    <Icon name="description" size={28} color={theme.colors.textTertiary} />
                    <Text variant="caption" color="textTertiary" numberOfLines={1}>PDF</Text>
                  </View>
                ) : (
                  <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: theme.colors.error }]}
                onPress={() => removeAt(i)}
                activeOpacity={0.8}
              >
                <Icon name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add buttons */}
      <HStack gap={3} justifyContent="center" style={{ marginTop: imageUris.length > 0 ? 12 : 0 }}>
        <TouchableOpacity
          style={[styles.optionBtn, { backgroundColor: theme.colors.surfaceHigh, borderColor: theme.colors.border }]}
          onPress={pickFromCamera}
          activeOpacity={0.8}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={theme.colors.brand} />
          ) : (
            <Icon name="photo-camera" size={22} color={theme.colors.brand} />
          )}
          <Text variant="caption" weight="600" color="textSecondary">Câmera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBtn, { backgroundColor: theme.colors.surfaceHigh, borderColor: theme.colors.border }]}
          onPress={pickFromGallery}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Icon name="photo-library" size={22} color={theme.colors.brand} />
          <Text variant="caption" weight="600" color="textSecondary">Galeria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBtn, { backgroundColor: theme.colors.surfaceHigh, borderColor: theme.colors.border }]}
          onPress={pickDocument}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Icon name="attach-file" size={22} color={theme.colors.brand} />
          <Text variant="caption" weight="600" color="textSecondary">Arquivo</Text>
        </TouchableOpacity>
      </HStack>

      {/* Fullscreen preview modal */}
      {previewVisible && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={closePreview}
        >
          <View style={styles.modalBg}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text variant="body" weight="700" style={{ color: '#fff' }}>
                {previewIndex + 1} / {imageUris.filter(u => !isPdf(u)).length}
              </Text>
              <HStack gap={3}>
                <TouchableOpacity
                  onPress={() => removeAt(previewIndex)}
                  activeOpacity={0.8}
                  style={styles.modalBtn}
                >
                  <Icon name="delete" size={22} color={theme.colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closePreview}
                  activeOpacity={0.8}
                  style={styles.modalBtn}
                >
                  <Icon name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </HStack>
            </View>

            {/* Swipeable images */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: previewIndex * SCREEN.width, y: 0 }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN.width)
                setPreviewIndex(idx)
              }}
            >
              {imageUris.filter(u => !isPdf(u)).map((uri, i) => (
                <View key={uri + i} style={{ width: SCREEN.width, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri }}
                    style={{ width: SCREEN.width, height: SCREEN.height * 0.75 }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Dots */}
            {imageUris.filter(u => !isPdf(u)).length > 1 && (
              <HStack gap={2} justifyContent="center" style={{ paddingBottom: 40 }}>
                {imageUris.filter(u => !isPdf(u)).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === previewIndex && styles.dotActive]}
                  />
                ))}
              </HStack>
            )}
          </View>
        </Modal>
      )}
    </View>
  )
}

function isPdf(uri: string) {
  return uri.toLowerCase().endsWith('.pdf')
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbWrap: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  thumbPdf: {
    width: 80,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  modalBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
    borderRadius: 4,
  },
})
