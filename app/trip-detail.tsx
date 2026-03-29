import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { applyDateTimeMask, getLocalDateTimePlaceholder, toISODateTimeOrNull } from '../lib/date-locale'

const C = Colors.dark

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  status: string
  cover_image: string | null
}

type Flight = {
  id: string
  airline: string
  flight_number: string
  departure_airport: string
  arrival_airport: string
  departure_datetime: string
  arrival_datetime: string | null
  notes: string | null
  created_at: string
}

function formatDate(date: string) {
  if (!date) return '--'

  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return date

  return parsedDate.toLocaleDateString(undefined, {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function formatDateTime(value?: string | null) {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams()
  const tripId = String(id || '')

  const [trip, setTrip] = useState<Trip | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [flightsModalVisible, setFlightsModalVisible] = useState(false)
  const [savingFlight, setSavingFlight] = useState(false)
  const [deletingFlight, setDeletingFlight] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)

  const [airline, setAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [departureDatetime, setDepartureDatetime] = useState('')
  const [arrivalDatetime, setArrivalDatetime] = useState('')
  const [flightNotes, setFlightNotes] = useState('')
  const dateTimePlaceholder = getLocalDateTimePlaceholder()

  useFocusEffect(
    useCallback(() => {
      loadTrip()
      loadFlights()
    }, [tripId])
  )

  async function loadTrip() {
    const { data, error } = await supabase
      .from('trips').select('*').eq('id', tripId).single()
    if (!error) setTrip(data)
  }

  async function loadFlights() {
    if (!tripId) return

    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    if (!error) setFlights(data || [])
  }

  function resetFlightForm() {
    setEditingFlightId(null)
    setAirline('')
    setFlightNumber('')
    setDepartureAirport('')
    setArrivalAirport('')
    setDepartureDatetime('')
    setArrivalDatetime('')
    setFlightNotes('')
  }

  function formatInputDateTime(value?: string | null) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const datePart = d.toLocaleDateString(undefined)
    const timePart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return `${datePart} ${timePart}`
  }

  function openNewFlightModal() {
    resetFlightForm()
    setFlightsModalVisible(true)
  }

  function openEditFlightModal(flight: Flight) {
    setEditingFlightId(flight.id)
    setAirline(flight.airline || '')
    setFlightNumber(flight.flight_number || '')
    setDepartureAirport(flight.departure_airport || '')
    setArrivalAirport(flight.arrival_airport || '')
    setDepartureDatetime(formatInputDateTime(flight.departure_datetime))
    setArrivalDatetime(formatInputDateTime(flight.arrival_datetime))
    setFlightNotes(flight.notes || '')
    setFlightsModalVisible(true)
  }

  async function handleSaveFlight() {
    if (!airline.trim() || !flightNumber.trim() || !departureAirport.trim() || !arrivalAirport.trim() || !departureDatetime.trim()) {
      Alert.alert('Atencao', 'Preencha os campos obrigatorios do voo.')
      return
    }

    const departureISO = toISODateTimeOrNull(departureDatetime)
    const arrivalISO = toISODateTimeOrNull(arrivalDatetime)

    if (!departureISO) {
      Alert.alert('Atencao', 'Data/hora de saida invalida. Use o formato local do dispositivo.')
      return
    }

    if (arrivalDatetime.trim() && !arrivalISO) {
      Alert.alert('Atencao', 'Data/hora de chegada invalida. Use o formato local do dispositivo.')
      return
    }

    setSavingFlight(true)
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

      const request = editingFlightId
        ? supabase.from('flights').update(payload).eq('id', editingFlightId)
        : supabase.from('flights').insert(payload)

      const { error } = await request

      if (error) throw error

      setFlightsModalVisible(false)
      resetFlightForm()
      loadFlights()
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Nao foi possivel salvar o voo.')
    } finally {
      setSavingFlight(false)
    }
  }

  async function handleDeleteFlight() {
    if (!editingFlightId) return

    Alert.alert('Excluir voo', 'Tem certeza que deseja excluir este voo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setDeletingFlight(true)
          try {
            const { error } = await supabase.from('flights').delete().eq('id', editingFlightId)
            if (error) throw error
            setFlightsModalVisible(false)
            resetFlightForm()
            loadFlights()
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Nao foi possivel excluir o voo.')
          } finally {
            setDeletingFlight(false)
          }
        }
      }
    ])
  }

  async function handleDelete() {
    Alert.alert('Excluir viagem', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trips').delete().eq('id', tripId)
          if (!error) router.back()
          else Alert.alert('Erro', 'Nao foi possivel excluir.')
        }
      }
    ])
  }

  function handleEdit() {
    if (!trip) return

    router.push({
      pathname: '/edit-trip',
      params: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        cover_image: trip.cover_image || '',
      }
    })
  }

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {trip.cover_image ? (
            <Image source={{ uri: trip.cover_image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>FLIGHT</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.title}>{trip.title}</Text>
              <Text style={styles.destination}>{trip.destination}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Ida</Text>
              <Text style={styles.dateValue}>{formatDate(trip.start_date)}</Text>
            </View>
            <Text style={styles.dateSep}>{'->'}</Text>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Volta</Text>
              <Text style={styles.dateValue}>{formatDate(trip.end_date)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Voos</Text>
          <View style={styles.sectionCard}>
            {flights.length === 0 ? (
              <Text style={styles.emptySectionText}>Nenhum voo cadastrado</Text>
            ) : (
              <View style={styles.flightsList}>
                {flights.map((flight) => (
                  <TouchableOpacity key={flight.id} style={styles.flightCard} activeOpacity={0.85} onPress={() => openEditFlightModal(flight)}>
                    <View style={styles.flightHeader}>
                      <Text style={styles.flightCode}>{flight.airline} - {flight.flight_number}</Text>
                      <Text style={styles.flightCreatedAt}>{formatDateTime(flight.created_at)}</Text>
                    </View>
                    <Text style={styles.flightRoute}>{flight.departure_airport} {'->'} {flight.arrival_airport}</Text>
                    <Text style={styles.flightMeta}>Saida: {formatDateTime(flight.departure_datetime)}</Text>
                    {flight.arrival_datetime ? (
                      <Text style={styles.flightMeta}>Chegada: {formatDateTime(flight.arrival_datetime)}</Text>
                    ) : null}
                    {flight.notes ? <Text style={styles.flightNotes}>{flight.notes}</Text> : null}
                    <Text style={styles.editFlightHint}>Toque para editar</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={openNewFlightModal}>
              <Text style={styles.addBtnText}>+ Adicionar voo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Hospedagem</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhuma hospedagem cadastrada</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Adicionar hospedagem</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Roteiro</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum item no roteiro</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Adicionar ao roteiro</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Gastos</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>Nenhum gasto registrado</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title } })}
            >
              <Text style={styles.addBtnText}>+ Registrar gasto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={flightsModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingFlightId ? 'Editar voo' : 'Novo voo'}</Text>

            <Text style={styles.modalLabel}>Companhia *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: LATAM"
              placeholderTextColor={C.tertiary}
              value={airline}
              onChangeText={setAirline}
            />

            <Text style={styles.modalLabel}>Numero do voo *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: LA 1234"
              placeholderTextColor={C.tertiary}
              value={flightNumber}
              onChangeText={setFlightNumber}
            />

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>Aeroporto saida *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: GRU"
                  placeholderTextColor={C.tertiary}
                  value={departureAirport}
                  onChangeText={setDepartureAirport}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>Aeroporto chegada *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: MAD"
                  placeholderTextColor={C.tertiary}
                  value={arrivalAirport}
                  onChangeText={setArrivalAirport}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>Data/hora saida *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={dateTimePlaceholder}
              placeholderTextColor={C.tertiary}
              value={departureDatetime}
              onChangeText={(value) => setDepartureDatetime(applyDateTimeMask(value))}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Data/hora chegada</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={dateTimePlaceholder}
              placeholderTextColor={C.tertiary}
              value={arrivalDatetime}
              onChangeText={(value) => setArrivalDatetime(applyDateTimeMask(value))}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Observacoes (opcional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalNotes]}
              placeholder="Ex: Terminal 2, portao C12"
              placeholderTextColor={C.tertiary}
              value={flightNotes}
              onChangeText={setFlightNotes}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setFlightsModalVisible(false)
                  resetFlightForm()
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFlight} disabled={savingFlight || deletingFlight}>
                {savingFlight ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingFlightId ? 'Salvar edicao' : 'Salvar voo'}</Text>}
              </TouchableOpacity>
            </View>

            {editingFlightId ? (
              <TouchableOpacity style={styles.deleteFlightBtn} onPress={handleDeleteFlight} disabled={deletingFlight || savingFlight}>
                <Text style={styles.deleteFlightBtnText}>{deletingFlight ? 'Excluindo...' : 'Excluir voo'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.secondary, fontSize: 14 },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 280 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 0.5, borderBottomColor: C.border },
  imagePlaceholderIcon: { fontSize: 24, color: C.tertiary, letterSpacing: 1 },
  backBtn: { position: 'absolute', top: 54, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 60 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, marginTop: 16 },
  titleLeft: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: C.primary, marginBottom: 4 },
  destination: { fontSize: 14, color: C.secondary },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  editBtn: { backgroundColor: C.accent + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
  deleteBtn: { backgroundColor: '#FF3B3022', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: C.error, fontSize: 12, fontWeight: '500' },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 0.5, borderColor: C.border },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 11, color: C.tertiary, marginBottom: 4 },
  dateValue: { fontSize: 13, color: C.primary, fontWeight: '500' },
  dateSep: { fontSize: 16, color: C.tertiary },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.primary, marginBottom: 10, marginTop: 8 },
  sectionCard: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border },
  flightsList: { gap: 10, marginBottom: 12 },
  flightCard: { backgroundColor: C.surfaceHigh, borderRadius: 10, borderWidth: 0.5, borderColor: C.border, padding: 12 },
  flightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flightCode: { fontSize: 13, color: C.primary, fontWeight: '600' },
  flightCreatedAt: { fontSize: 10, color: C.tertiary },
  flightRoute: { fontSize: 13, color: C.primary, marginTop: 6, fontWeight: '500' },
  flightMeta: { fontSize: 12, color: C.secondary, marginTop: 4 },
  flightNotes: { fontSize: 12, color: C.tertiary, marginTop: 8 },
  editFlightHint: { fontSize: 11, color: C.accent, marginTop: 10, fontWeight: '500' },
  emptySection: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  emptySectionText: { fontSize: 13, color: C.tertiary, marginBottom: 10 },
  addBtn: { borderWidth: 0.5, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'center' },
  addBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.primary, marginBottom: 8 },
  modalLabel: { fontSize: 12, color: C.secondary, marginBottom: 6, marginTop: 10 },
  modalInput: { backgroundColor: C.surfaceHigh, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.primary },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalCol: { flex: 1 },
  modalNotes: { minHeight: 70, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: C.secondary, fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deleteFlightBtn: { marginTop: 12, borderWidth: 0.5, borderColor: C.error, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  deleteFlightBtnText: { color: C.error, fontSize: 14, fontWeight: '600' },
})
