import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import ImagePickerComponent from '../components/ImagePicker'
import { applyDateMask, getLocalDatePlaceholder, toISODateOrNull } from '../lib/date-locale'
import { t } from '../lib/i18n'
import Icon from '../components/Icon'

const C = Colors.dark

export default function NewTripScreen() {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const datePlaceholder = getLocalDatePlaceholder()

  async function handleCreate() {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('session_expired'))

      const { error } = await supabase.from('trips').insert({
        title: title.trim(),
        destination: destination.trim(),
        start_date: startDateISO,
        end_date: endDateISO,
        cover_image: imageUri || null,
        owner_id: user.id,
        status: 'planning',
      })

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
          <Icon name="arrow-back" size={22} color={C.accent} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Nova viagem</Text>

        <Text style={styles.label}>Foto de capa (opcional)</Text>
        <ImagePickerComponent imageUri={imageUri} onImageSelected={setImageUri} />

        <Text style={styles.label}>Nome da viagem *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Ferias em Paris"
          placeholderTextColor={C.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Destino *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Paris"
          placeholderTextColor={C.tertiary}
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={styles.label}>Data de ida (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder={datePlaceholder}
          placeholderTextColor={C.tertiary}
          value={startDate}
          onChangeText={(value) => setStartDate(applyDateMask(value))}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Data de volta (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder={datePlaceholder}
          placeholderTextColor={C.tertiary}
          value={endDate}
          onChangeText={(value) => setEndDate(applyDateMask(value))}
          keyboardType="numeric"
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar viagem</Text>}
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
  input: { backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.primary },
  button: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})
