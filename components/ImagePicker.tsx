import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import { Colors } from '../constants/Colors'
import { t } from '../lib/i18n'
import Icon from './Icon'

const C = Colors.dark

type Props = {
  imageUri: string | null
  onImageSelected: (uri: string) => void
  aspect?: [number, number]
  allowsEditing?: boolean
}

export default function ImagePickerComponent({ imageUri, onImageSelected, aspect, allowsEditing }: Props) {

  async function pickImage() {
    const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(t('permission_needed_title'), t('permission_needed_body'))
      return
    }
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: allowsEditing ?? true,
      aspect: aspect ?? [16, 9],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri)
    }
  }

  return (
    <TouchableOpacity style={styles.container} onPress={pickImage} activeOpacity={0.8}>
      {imageUri ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <View style={styles.changeOverlay}>
            <Text style={styles.changeText}>Trocar foto</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Icon name="flight" size={36} color={C.tertiary} />
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
  placeholder: {
    height: 160, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6
  },
placeholderText: { fontSize: 14, fontWeight: '500', color: C.secondary },
  placeholderSub: { fontSize: 12, color: C.tertiary },
})
