import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import ImagePickerComponent from '../components/ImagePicker'
import { applyDateMask, getLocalDatePlaceholder, toISODateOrNull } from '../lib/date-locale'
import { t } from '../lib/i18n'

const C = Colors.dark

export default function EditTripScreen() {
  const {
    id,
    title: initialTitle,
    destination: initialDest,
    start_date: initialStart,
    end_date: initialEnd,
    cover_image: initialImage,
  } = useLocalSearchParams()

  const [title, setTitle] = useState((initialTitle as string) || '')
  const [destination, setDestination] = useState((initialDest as string) || '')
  const [startDate, setStartDate] = useState((initialStart as string) || '')
  const [endDate, setEndDate] = useState((initialEnd as string) || '')
  const [imageUri, setImageUri] = useState<string | null>(initialImage ? (initialImage as string) : null)
  const [loading, setLoading] = useState(false)
  const datePlaceholder = getLocalDatePlaceholder()

  async function handleSave() {
    if (!title.trim() || !destination.trim()) {
      Alert.alert(t('attention_title'), t('required_trip_fields'))
      return
    }

    const startDateISO = toISODateOrNull(startDate)
    const endDateISO = toISODateOrNull(endDate)

    if (startDate.trim() && !startDateISO) {
      Alert.alert(t('attention_title'), t('invalid_departure_date'))
      return
    }

    if (endDate.trim() && !endDateISO) {
      Alert.alert(t('attention_title'), t('invalid_return_date'))
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          title: title.trim(),
          destination: destination.trim(),
          start_date: startDateISO,
          end_date: endDateISO,
          cover_image: imageUri || null,
        })
        .eq('id', id)

      if (error) throw error
      router.back()
    } catch (err: any) {
      Alert.alert(t('error_title'), err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{'<'} Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Editar viagem</Text>

        <Text style={styles.label}>Foto de capa</Text>
        <ImagePickerComponent imageUri={imageUri} onImageSelected={setImageUri} />

        <Text style={styles.label}>Nome da viagem *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da viagem"
          placeholderTextColor={C.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Destino *</Text>
        <TextInput
          style={styles.input}
          placeholder="Destino"
          placeholderTextColor={C.tertiary}
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={styles.label}>Data de ida</Text>
        <TextInput
          style={styles.input}
          placeholder={datePlaceholder}
          placeholderTextColor={C.tertiary}
          value={startDate}
          onChangeText={(value) => setStartDate(applyDateMask(value))}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Data de volta</Text>
        <TextInput
          style={styles.input}
          placeholder={datePlaceholder}
          placeholderTextColor={C.tertiary}
          value={endDate}
          onChangeText={(value) => setEndDate(applyDateMask(value))}
          keyboardType="numeric"
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar alteracoes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { padding: 24, paddingTop: 60 },
  back: { marginBottom: 20 },
  backText: { color: C.accent, fontSize: 14 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: C.primary, marginBottom: 20 },
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
  button: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})
