import { ScrollView } from 'react-native'
import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'
import ImagePickerComponent from '../components/ImagePicker'
import { applyDateMask, formatDateForInput, getLocalDatePlaceholder, toISODateOrNull } from '../lib/date-locale'
import { t } from '../lib/i18n'
import Icon from '../components/Icon'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import DesktopLayout from '../components/DesktopLayout'
import { applyCurrencyMask, parseCurrencyInput, numberToCurrencyInput } from '../lib/currency'
import {
  Box, Text, VStack, HStack, Input, Button, useTheme, Pressable, IconButton,
} from '../design-system'

const CURRENCIES = ['R$', 'USD', 'EUR', 'GBP']

export default function EditTripScreen() {
  const theme = useTheme()
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
      <KeyboardView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, maxWidth: 600, width: '100%', alignSelf: 'center' as any }}>
          <Box mb={5}>
            <IconButton accessibilityLabel="Voltar" onPress={() => router.back()} variant="ghost">
              <Icon name="arrow-back" size={22} color={theme.colors.text} />
            </IconButton>
          </Box>

          <Text variant="h3" style={{ marginBottom: 20 }}>Editar viagem</Text>

          <VStack gap={4}>
            <VStack gap={1.5}>
              <Text variant="label" color="textSecondary">Foto de capa</Text>
              <ImagePickerComponent imageUri={imageUri} onImageSelected={setImageUri} uploadFolder="covers" onUploadingChange={setImageUploading} />
            </VStack>

            <Input
              label="Nome da viagem *"
              placeholder="Nome da viagem"
              value={title}
              onChangeText={setTitle}
              size="lg"
            />

            <Input
              label="Destino *"
              placeholder="Destino"
              value={destination}
              onChangeText={setDestination}
              size="lg"
            />

            <Input
              label="Data de ida"
              placeholder={datePlaceholder}
              value={startDate}
              onChangeText={(value) => setStartDate(applyDateMask(value))}
              keyboardType="numeric"
              size="lg"
            />

            <Input
              label="Data de volta"
              placeholder={datePlaceholder}
              value={endDate}
              onChangeText={(value) => setEndDate(applyDateMask(value))}
              keyboardType="numeric"
              size="lg"
            />

            <VStack gap={2}>
              <Text variant="label" color="textSecondary">Orcamento total (opcional)</Text>
              <HStack gap={2}>
                {CURRENCIES.map(cur => (
                  <Pressable
                    key={cur}
                    onPress={() => setBudgetCurrency(cur)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8,
                      borderRadius: theme.radius.full,
                      borderWidth: 1.5,
                      borderColor: budgetCurrency === cur ? theme.colors.brand : theme.colors.border,
                      backgroundColor: budgetCurrency === cur ? theme.colors.brand : theme.colors.surface,
                    }}
                  >
                    <Text
                      variant="label"
                      color={budgetCurrency === cur ? 'textOnBrand' : 'textSecondary'}
                    >
                      {cur}
                    </Text>
                  </Pressable>
                ))}
              </HStack>
              <Input
                placeholder="0,00"
                value={budget}
                onChangeText={(text) => setBudget(applyCurrencyMask(text))}
                keyboardType="numeric"
                size="lg"
              />
            </VStack>

            <Box mt={6} mb={10}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={imageUploading}
                onPress={handleSave}
              >
                Salvar alteracoes
              </Button>
            </Box>
          </VStack>
        </ScrollView>
      </KeyboardView>
    </DesktopLayout>
  )
}
