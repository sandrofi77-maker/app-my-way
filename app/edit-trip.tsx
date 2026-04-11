import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import ImagePickerComponent from '../components/ImagePicker'
import { applyDateMask, formatDateForInput, getLocalDatePlaceholder, toISODateOrNull } from '../lib/date-locale'
import { t } from '../lib/i18n'
import Icon from '../components/Icon'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import DesktopLayout from '../components/DesktopLayout'
import { applyCurrencyMask, parseCurrencyInput, numberToCurrencyInput } from '../lib/currency'

const C = Colors.dark
const CURRENCIES = ['R$', 'USD', 'EUR', 'GBP']

export default function EditTripScreen() {
  const {
    id,
    title: initialTitle,
    destination: initialDest,
    start_date: initialStart,
    end_date: initialEnd,
    cover_image: initialImage,
    budget: initialBudget,
    budget_currency: initialBudgetCurrency,
  } = useLocalSearchParams()

  const [title, setTitle] = useState((initialTitle as string) || '')
  const [destination, setDestination] = useState((initialDest as string) || '')
  const [startDate, setStartDate] = useState(formatDateForInput(initialStart as string))
  const [endDate, setEndDate] = useState(formatDateForInput(initialEnd as string))
  const [imageUri, setImageUri] = useState<string | null>(initialImage ? (initialImage as string) : null)
  const [imageUploading, setImageUploading] = useState(false)
  const [budget, setBudget] = useState(initialBudget ? numberToCurrencyInput(Number(initialBudget)) : '')
  const [budgetCurrency, setBudgetCurrency] = useState((initialBudgetCurrency as string) || 'R$')
  const [loading, setLoading] = useState(false)
  const datePlaceholder = getLocalDatePlaceholder()

  async function handleSave() {
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
      const { error } = await supabase
        .from('trips')
        .update({
          title: title.trim(),
          destination: destination.trim(),
          start_date: startDateISO,
          end_date: endDateISO,
          cover_image: imageUri || null,
          budget: budget.trim() ? parseCurrencyInput(budget) : null,
          budget_currency: budgetCurrency,
        })
        .eq('id', id)

      if (error) throw error
      router.back()
    } catch (err: any) {
      showAlert(t('error_title'), err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DesktopLayout>
    <KeyboardView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Icon name="arrow-back" size={22} color={C.icon} />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Editar viagem</Text>

        <Text style={styles.label}>Foto de capa</Text>
        <ImagePickerComponent imageUri={imageUri} onImageSelected={setImageUri} uploadFolder="covers" onUploadingChange={setImageUploading} />

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

        <Text style={styles.label}>Orçamento total (opcional)</Text>
        <View style={styles.budgetRow}>
          <View style={styles.currencyScroll}>
            {CURRENCIES.map(cur => (
              <TouchableOpacity
                key={cur}
                style={[styles.currencyChip, budgetCurrency === cur && styles.currencyChipActive]}
                onPress={() => setBudgetCurrency(cur)}
                activeOpacity={0.8}
              >
                <Text style={[styles.currencyChipText, budgetCurrency === cur && styles.currencyChipTextActive]}>{cur}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.budgetInput]}
            placeholder="0,00"
            placeholderTextColor={C.tertiary}
            value={budget}
            onChangeText={(text) => setBudget(applyCurrencyMask(text))}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={[styles.button, (loading || imageUploading) && styles.buttonDisabled]} onPress={handleSave} disabled={loading || imageUploading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar alteracoes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardView>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { padding: 24, paddingTop: 60, maxWidth: 600, width: '100%', alignSelf: 'center' as any },
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
    backgroundColor: C.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  budgetRow: { gap: 8 },
  currencyScroll: { flexDirection: 'row', gap: 8 },
  currencyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  currencyChipActive: { borderColor: C.primary, backgroundColor: C.primary },
  currencyChipText: { fontSize: 13, fontWeight: '600', color: C.secondary },
  currencyChipTextActive: { color: '#fff' },
  budgetInput: { marginTop: 0 },
})
