import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useState } from 'react'
import Icon from './Icon'
import SheetModal from './SheetModal'
import { Colors } from '../constants/Colors'
import { t } from '../lib/i18n'
import { applyDateTimeMask, formatDateTimeForInput, getLocalDateTimePlaceholder, toISODateTimeOrNull } from '../lib/date-locale'
import { showAlert } from '../lib/alert'
import { supabase } from '../lib/supabase'
import type { Flight } from '../types'

const C = Colors.dark
const dateTimePlaceholder = getLocalDateTimePlaceholder()

type Props = {
  visible: boolean
  tripId: string
  editingFlight: Flight | null
  onClose: () => void
  onSaved: () => void
}

export default function FlightFormModal({ visible, tripId, editingFlight, onClose, onSaved }: Props) {
  const [airline, setAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [departureDatetime, setDepartureDatetime] = useState('')
  const [arrivalDatetime, setArrivalDatetime] = useState('')
  const [flightNotes, setFlightNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Populate form when editingFlight changes
  const populateForm = (flight: Flight | null) => {
    if (flight) {
      setAirline(flight.airline || '')
      setFlightNumber(flight.flight_number || '')
      setDepartureAirport(flight.departure_airport || '')
      setArrivalAirport(flight.arrival_airport || '')
      setDepartureDatetime(formatDateTimeForInput(flight.departure_datetime))
      setArrivalDatetime(formatDateTimeForInput(flight.arrival_datetime))
      setFlightNotes(flight.notes || '')
    } else {
      resetForm()
    }
  }

  // Reset when visibility changes
  if (visible && airline === '' && editingFlight) {
    populateForm(editingFlight)
  }

  function resetForm() {
    setAirline('')
    setFlightNumber('')
    setDepartureAirport('')
    setArrivalAirport('')
    setDepartureDatetime('')
    setArrivalDatetime('')
    setFlightNotes('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSave() {
    if (!airline.trim() || !flightNumber.trim() || !departureAirport.trim() || !arrivalAirport.trim() || !departureDatetime.trim()) {
      showAlert(t('attention_title'), t('required_flight_fields'))
      return
    }

    const departureISO = toISODateTimeOrNull(departureDatetime)
    const arrivalISO = toISODateTimeOrNull(arrivalDatetime)

    if (!departureISO) {
      showAlert(t('attention_title'), t('invalid_departure_datetime'))
      return
    }

    if (arrivalDatetime.trim() && !arrivalISO) {
      showAlert(t('attention_title'), t('invalid_arrival_datetime'))
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        trip_id: tripId,
        user_id: user?.id,
        airline: airline.trim(),
        flight_number: flightNumber.trim(),
        departure_airport: departureAirport.trim().toUpperCase(),
        arrival_airport: arrivalAirport.trim().toUpperCase(),
        departure_datetime: departureISO,
        arrival_datetime: arrivalISO,
        notes: flightNotes.trim() || null,
      }

      const request = editingFlight
        ? supabase.from('flights').update(payload).eq('id', editingFlight.id)
        : supabase.from('flights').insert(payload)

      const { error } = await request
      if (error) throw error

      resetForm()
      onSaved()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('save_flight_failed')
      showAlert(t('error_title'), message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingFlight) return

    showAlert(t('confirm_delete_flight_title'), t('confirm_delete_flight_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            const { error } = await supabase.from('flights').delete().eq('id', editingFlight.id)
            if (error) throw error
            resetForm()
            onSaved()
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('delete_flight_failed')
            showAlert(t('error_title'), message)
          } finally {
            setDeleting(false)
          }
        }
      }
    ])
  }

  return (
    <SheetModal
      visible={visible}
      onClose={handleClose}
      title={editingFlight ? 'Editar voo' : 'Novo voo'}
      subtitle="Preencha os dados do voo"
      onDelete={editingFlight ? handleDelete : undefined}
      deleteDisabled={deleting || saving}
    >
      <Text style={styles.label}>Companhia *</Text>
      <View style={styles.inputRow}>
        <Icon name="flight" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder="Ex: LATAM" placeholderTextColor={C.tertiary} value={airline} onChangeText={setAirline} accessibilityLabel="Companhia aérea" />
      </View>

      <Text style={styles.label}>Numero do voo *</Text>
      <View style={styles.inputRow}>
        <Icon name="confirmation-number" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder="Ex: LA 1234" placeholderTextColor={C.tertiary} value={flightNumber} onChangeText={setFlightNumber} accessibilityLabel="Número do voo" />
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Saida *</Text>
          <View style={styles.inputRow}>
            <Icon name="flight-takeoff" size={18} color={C.secondary} />
            <TextInput style={styles.input} placeholder="GRU" placeholderTextColor={C.tertiary} value={departureAirport} onChangeText={setDepartureAirport} autoCapitalize="characters" accessibilityLabel="Aeroporto de saída" />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Chegada *</Text>
          <View style={styles.inputRow}>
            <Icon name="flight-land" size={18} color={C.secondary} />
            <TextInput style={styles.input} placeholder="MAD" placeholderTextColor={C.tertiary} value={arrivalAirport} onChangeText={setArrivalAirport} autoCapitalize="characters" accessibilityLabel="Aeroporto de chegada" />
          </View>
        </View>
      </View>

      <Text style={styles.label}>Data/hora saida *</Text>
      <View style={styles.inputRow}>
        <Icon name="schedule" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder={dateTimePlaceholder} placeholderTextColor={C.tertiary} value={departureDatetime} onChangeText={(v) => setDepartureDatetime(applyDateTimeMask(v))} keyboardType="numeric" accessibilityLabel="Data e hora de saída" />
      </View>

      <Text style={styles.label}>Data/hora chegada</Text>
      <View style={styles.inputRow}>
        <Icon name="schedule" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder={dateTimePlaceholder} placeholderTextColor={C.tertiary} value={arrivalDatetime} onChangeText={(v) => setArrivalDatetime(applyDateTimeMask(v))} keyboardType="numeric" accessibilityLabel="Data e hora de chegada" />
      </View>

      <Text style={styles.label}>Observacoes</Text>
      <View style={[styles.inputRow, styles.inputRowMultiline]}>
        <Icon name="notes" size={20} color={C.secondary} />
        <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Ex: Terminal 2, portao C12" placeholderTextColor={C.tertiary} value={flightNotes} onChangeText={setFlightNotes} multiline accessibilityLabel="Observações" />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving || deleting} accessibilityRole="button" accessibilityLabel={editingFlight ? 'Salvar edição' : 'Salvar voo'}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{editingFlight ? 'Salvar edição' : 'Salvar voo'}</Text>}
      </TouchableOpacity>
    </SheetModal>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 4, marginBottom: 8, marginTop: 16 },
  inputRow: { backgroundColor: C.surfaceHigh, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4 },
  inputRowMultiline: { alignItems: 'flex-start', paddingVertical: 14 },
  input: { flex: 1, fontSize: 15, color: C.primary, marginLeft: 10, paddingVertical: 14, padding: 0 },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingVertical: 0 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  primaryBtn: {
    backgroundColor: C.buttonPrimary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.buttonPrimary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
