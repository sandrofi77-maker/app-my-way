import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import ImagePickerComponent from './ImagePicker'
import { applyDateMask, getLocalDatePlaceholder, toISODateOrNull } from '../lib/date-locale'
import { t } from '../lib/i18n'
import { showAlert } from '../lib/alert'
import { applyCurrencyMask, parseCurrencyInput } from '../lib/currency'
import SheetModal from './SheetModal'

const C = Colors.dark
const CURRENCIES = ['R$', 'USD', 'EUR', 'GBP']

type Props = {
  visible: boolean
  onClose: () => void
  /** Chamado após criação bem-sucedida com o ID da viagem criada */
  onCreated?: (tripId: string) => void
}

export default function NewTripSheet({ visible, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [budget, setBudget] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState('R$')
  const [loading, setLoading] = useState(false)
  const datePlaceholder = getLocalDatePlaceholder()

  function resetForm() {
    setTitle('')
    setDestination('')
    setStartDate('')
    setEndDate('')
    setImageUri(null)
    setBudget('')
    setBudgetCurrency('R$')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleCreate() {
    if (!title.trim() || !destination.trim()) {
      showAlert(t('attention_title'), t('required_trip_fields'))
      return
    }

    const startDateISO = toISODateOrNull(startDate)
    const endDateISO = toISODateOrNull(endDate)

    if (startDate.trim() && !startDateISO) {
      showAlert(t('attention_title'), t('invalid_departure_date'))
      return
    }

    if (endDate.trim() && !endDateISO) {
      showAlert(t('attention_title'), t('invalid_return_date'))
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('session_expired'))

      const { data: inserted, error } = await supabase.from('trips').insert({
        title: title.trim(),
        destination: destination.trim(),
        start_date: startDateISO,
        end_date: endDateISO,
        cover_image: imageUri || null,
        owner_id: user.id,
        status: 'planning',
        budget: budget.trim() ? parseCurrencyInput(budget) : null,
        budget_currency: budgetCurrency,
      }).select('id').single()

      if (error) throw error
      resetForm()
      onCreated?.(inserted.id)
    } catch (err: unknown) {
      showAlert(t('error_title'), err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SheetModal visible={visible} onClose={handleClose} title="Nova viagem" drawerWidth={520}>
      <Text style={styles.label}>Foto de capa (opcional)</Text>
      <ImagePickerComponent
        imageUri={imageUri}
        onImageSelected={setImageUri}
        uploadFolder="covers"
        onUploadingChange={setImageUploading}
      />

      <Text style={styles.label}>Nome da viagem *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Férias em Paris"
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

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>Data de ida</Text>
          <TextInput
            style={styles.input}
            placeholder={datePlaceholder}
            placeholderTextColor={C.tertiary}
            value={startDate}
            onChangeText={(v) => setStartDate(applyDateMask(v))}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.label}>Data de volta</Text>
          <TextInput
            style={styles.input}
            placeholder={datePlaceholder}
            placeholderTextColor={C.tertiary}
            value={endDate}
            onChangeText={(v) => setEndDate(applyDateMask(v))}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Orçamento total (opcional)</Text>
      <View style={styles.currencyRow}>
        {CURRENCIES.map(cur => (
          <TouchableOpacity
            key={cur}
            style={[styles.currencyChip, budgetCurrency === cur && styles.currencyChipActive]}
            onPress={() => setBudgetCurrency(cur)}
            activeOpacity={0.8}
          >
            <Text style={[styles.currencyChipText, budgetCurrency === cur && styles.currencyChipTextActive]}>
              {cur}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        placeholderTextColor={C.tertiary}
        value={budget}
        onChangeText={(text) => setBudget(applyCurrencyMask(text))}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.button, (loading || imageUploading) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading || imageUploading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Criar viagem</Text>
        }
      </TouchableOpacity>
    </SheetModal>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: C.secondary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.surfaceHigh,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.primary,
  },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 8, marginTop: 2 },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  currencyChipActive: { borderColor: C.primary, backgroundColor: C.primary },
  currencyChipText: { fontSize: 13, fontWeight: '600', color: C.secondary },
  currencyChipTextActive: { color: '#fff' },
  button: {
    backgroundColor: C.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})
