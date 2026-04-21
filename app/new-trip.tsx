import { ScrollView } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import ImagePickerComponent from '../components/ImagePicker'
import { applyDateMask, getLocalDatePlaceholder, toISODateOrNull } from '../lib/date-locale'
import { t } from '../lib/i18n'
import Icon from '../components/Icon'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import DesktopLayout from '../components/DesktopLayout'
import { applyCurrencyMask, parseCurrencyInput } from '../lib/currency'
import {
  Box, Text, VStack, HStack, Input, Button, useTheme, Pressable, IconButton,
} from '../design-system'

const CURRENCIES = ['R$', 'USD', 'EUR', 'GBP']

export default function NewTripScreen() {
  const theme = useTheme()
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
    if (startDateISO && endDateISO && endDateISO < startDateISO) {
      showAlert(t('attention_title'), t('end_before_start'))
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
      router.replace({ pathname: '/trip-detail', params: { id: inserted.id } })
    } catch (err: unknown) {
      showAlert(t('error_title'), err instanceof Error ? err.message : t('generic_error'))
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

          <Text variant="h3" style={{ marginBottom: 20 }}>Nova viagem</Text>

          <VStack gap={4}>
            <VStack gap={1.5}>
              <Text variant="label" color="textSecondary">Foto de capa (opcional)</Text>
              <ImagePickerComponent imageUri={imageUri} onImageSelected={setImageUri} uploadFolder="covers" onUploadingChange={setImageUploading} />
            </VStack>

            <Input
              label="Nome da viagem *"
              placeholder="Ex: Ferias em Paris"
              value={title}
              onChangeText={setTitle}
              size="lg"
            />

            <Input
              label="Destino *"
              placeholder="Ex: Paris"
              value={destination}
              onChangeText={setDestination}
              size="lg"
            />

            <Input
              label="Data de ida (opcional)"
              placeholder={datePlaceholder}
              value={startDate}
              onChangeText={(value) => setStartDate(applyDateMask(value))}
              keyboardType="numeric"
              size="lg"
            />

            <Input
              label="Data de volta (opcional)"
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
                onPress={handleCreate}
              >
                Criar viagem
              </Button>
            </Box>
          </VStack>
        </ScrollView>
      </KeyboardView>
    </DesktopLayout>
  )
}
