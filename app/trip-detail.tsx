import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Pressable
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t, getDeviceLocale } from '../lib/i18n'
import { applyDateMask, applyDateTimeMask, applyTimeMask, getLocalDatePlaceholder, getLocalDateTimePlaceholder, getLocalTimePlaceholder, toISODateOrNull, toISODateTimeOrNull, toTimeOrNull } from '../lib/date-locale'
import ImagePickerComponent from '../components/ImagePicker'

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

type Accommodation = {
  id: string
  name: string
  location: string
  link: string | null
  check_in_date: string | null
  check_out_date: string | null
  check_in_time: string | null
  check_out_time: string | null
  description: string | null
  image_url: string | null
  created_at: string
}

type Expense = {
  id: string
  category: string
  amount: number
  currency: string
  description: string
  date: string
  created_at: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'Hospedagem': '🏨', 'Alimentação': '🍽️', 'Transporte': '🚗',
  'Passeios': '🎭', 'Compras': '🛍️', 'Saúde': '💊', 'Outros': '💰'
}

function formatDate(date: string) {
  if (!date) return '--'

  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return date

  return parsedDate.toLocaleDateString(getDeviceLocale(), {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

function formatDateTime(value?: string | null) {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return d.toLocaleString(getDeviceLocale(), {
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
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [flightsModalVisible, setFlightsModalVisible] = useState(false)
  const [accommodationModalVisible, setAccommodationModalVisible] = useState(false)
  const [savingFlight, setSavingFlight] = useState(false)
  const [savingAccommodation, setSavingAccommodation] = useState(false)
  const [deletingFlight, setDeletingFlight] = useState(false)
  const [deletingAccommodation, setDeletingAccommodation] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [editingAccommodationId, setEditingAccommodationId] = useState<string | null>(null)

  const [airline, setAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [departureDatetime, setDepartureDatetime] = useState('')
  const [arrivalDatetime, setArrivalDatetime] = useState('')
  const [flightNotes, setFlightNotes] = useState('')
  const dateTimePlaceholder = getLocalDateTimePlaceholder()
  const datePlaceholder = getLocalDatePlaceholder()
  const timePlaceholder = getLocalTimePlaceholder()

  const [accommodationName, setAccommodationName] = useState('')
  const [accommodationLocation, setAccommodationLocation] = useState('')
  const [accommodationLink, setAccommodationLink] = useState('')
  const [accommodationCheckInDate, setAccommodationCheckInDate] = useState('')
  const [accommodationCheckOutDate, setAccommodationCheckOutDate] = useState('')
  const [accommodationCheckIn, setAccommodationCheckIn] = useState('')
  const [accommodationCheckOut, setAccommodationCheckOut] = useState('')
  const [accommodationDescription, setAccommodationDescription] = useState('')
  const [accommodationImageUri, setAccommodationImageUri] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      loadTrip()
      loadFlights()
      loadAccommodations()
      loadExpenses()
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
      .order('departure_datetime', { ascending: true })

    if (!error) setFlights(data || [])
  }

  async function loadAccommodations() {
    if (!tripId) return

    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    if (!error) setAccommodations(data || [])
  }

  async function loadExpenses() {
    if (!tripId) return

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true })

    if (!error) setExpenses(data || [])
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
    const datePart = d.toLocaleDateString(getDeviceLocale())
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

  function handleCloseFlightModal() {
    setFlightsModalVisible(false)
    resetFlightForm()
  }

  async function handleSaveFlight() {
    if (!airline.trim() || !flightNumber.trim() || !departureAirport.trim() || !arrivalAirport.trim() || !departureDatetime.trim()) {
      Alert.alert(t('attention_title'), t('required_flight_fields'))
      return
    }

    const departureISO = toISODateTimeOrNull(departureDatetime)
    const arrivalISO = toISODateTimeOrNull(arrivalDatetime)

    if (!departureISO) {
      Alert.alert(t('attention_title'), t('invalid_departure_datetime'))
      return
    }

    if (arrivalDatetime.trim() && !arrivalISO) {
      Alert.alert(t('attention_title'), t('invalid_arrival_datetime'))
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
      Alert.alert(t('error_title'), err?.message || t('save_flight_failed'))
    } finally {
      setSavingFlight(false)
    }
  }

  async function handleDeleteFlight() {
    if (!editingFlightId) return

    Alert.alert(t('confirm_delete_flight_title'), t('confirm_delete_flight_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'),
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
            Alert.alert(t('error_title'), err?.message || t('delete_flight_failed'))
          } finally {
            setDeletingFlight(false)
          }
        }
      }
    ])
  }

  function resetAccommodationForm() {
    setEditingAccommodationId(null)
    setAccommodationName('')
    setAccommodationLocation('')
    setAccommodationLink('')
    setAccommodationCheckInDate('')
    setAccommodationCheckOutDate('')
    setAccommodationCheckIn('')
    setAccommodationCheckOut('')
    setAccommodationDescription('')
    setAccommodationImageUri(null)
  }

  function openNewAccommodationModal() {
    resetAccommodationForm()
    setAccommodationModalVisible(true)
  }

  function openEditAccommodationModal(accommodation: Accommodation) {
    setEditingAccommodationId(accommodation.id)
    setAccommodationName(accommodation.name || '')
    setAccommodationLocation(accommodation.location || '')
    setAccommodationLink(accommodation.link || '')
    setAccommodationCheckInDate(accommodation.check_in_date ? applyDateMask(accommodation.check_in_date) : '')
    setAccommodationCheckOutDate(accommodation.check_out_date ? applyDateMask(accommodation.check_out_date) : '')
    setAccommodationCheckIn(accommodation.check_in_time || '')
    setAccommodationCheckOut(accommodation.check_out_time || '')
    setAccommodationDescription(accommodation.description || '')
    setAccommodationImageUri(accommodation.image_url || null)
    setAccommodationModalVisible(true)
  }

  async function handleSaveAccommodation() {
    if (!accommodationName.trim() || !accommodationLocation.trim()) {
      Alert.alert(t('attention_title'), t('required_accommodation_fields'))
      return
    }

    const checkInDate = toISODateOrNull(accommodationCheckInDate)
    const checkOutDate = toISODateOrNull(accommodationCheckOutDate)
    const checkIn = toTimeOrNull(accommodationCheckIn)
    const checkOut = toTimeOrNull(accommodationCheckOut)

    if (accommodationCheckInDate.trim() && !checkInDate) {
      Alert.alert(t('attention_title'), t('invalid_checkin_date'))
      return
    }

    if (accommodationCheckOutDate.trim() && !checkOutDate) {
      Alert.alert(t('attention_title'), t('invalid_checkout_date'))
      return
    }

    if (accommodationCheckIn.trim() && !checkIn) {
      Alert.alert(t('attention_title'), t('invalid_checkin_time'))
      return
    }

    if (accommodationCheckOut.trim() && !checkOut) {
      Alert.alert(t('attention_title'), t('invalid_checkout_time'))
      return
    }

    setSavingAccommodation(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        trip_id: tripId,
        user_id: user?.id,
        name: accommodationName.trim(),
        location: accommodationLocation.trim(),
        link: accommodationLink.trim() || null,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        check_in_time: checkIn,
        check_out_time: checkOut,
        description: accommodationDescription.trim() || null,
        image_url: accommodationImageUri || null,
      }

      const request = editingAccommodationId
        ? supabase.from('accommodations').update(payload).eq('id', editingAccommodationId)
        : supabase.from('accommodations').insert(payload)

      const { error } = await request
      if (error) throw error

      setAccommodationModalVisible(false)
      resetAccommodationForm()
      loadAccommodations()
    } catch (err: any) {
      Alert.alert(t('error_title'), err?.message || t('save_accommodation_failed'))
    } finally {
      setSavingAccommodation(false)
    }
  }

  async function handleDeleteAccommodation() {
    if (!editingAccommodationId) return

    Alert.alert(t('confirm_delete_accommodation_title'), t('confirm_delete_accommodation_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'),
        style: 'destructive',
        onPress: async () => {
          setDeletingAccommodation(true)
          try {
            const { error } = await supabase.from('accommodations').delete().eq('id', editingAccommodationId)
            if (error) throw error
            setAccommodationModalVisible(false)
            resetAccommodationForm()
            loadAccommodations()
          } catch (err: any) {
            Alert.alert(t('error_title'), err?.message || t('delete_accommodation_failed'))
          } finally {
            setDeletingAccommodation(false)
          }
        }
      }
    ])
  }

  async function handleDelete() {
    Alert.alert(t('confirm_delete_trip_title'), t('confirm_delete_trip_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'), style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trips').delete().eq('id', tripId)
          if (!error) router.back()
          else Alert.alert(t('error_title'), t('delete_trip_failed'))
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
                    <View style={styles.flightCardInner}>
                      <View style={styles.flightIconCircle}>
                        <Text style={styles.flightIconText}>✈</Text>
                      </View>
                      <View style={styles.flightCardContent}>
                        <View style={styles.flightCardHeader}>
                          <Text style={styles.flightRoute}>{flight.departure_airport} - {flight.arrival_airport}</Text>
                          <Text style={styles.flightCode}>{flight.airline} - {flight.flight_number}</Text>
                        </View>
                        <View style={styles.flightDateRow}>
                          <Text style={styles.flightDateText}>🛫 {formatDateTime(flight.departure_datetime)}</Text>
                          {flight.arrival_datetime ? (
                            <>
                              <Text style={styles.flightDateSep}> • </Text>
                              <Text style={styles.flightDateText}>🛬 {formatDateTime(flight.arrival_datetime)}</Text>
                            </>
                          ) : null}
                        </View>
                        {flight.notes ? <Text style={styles.flightNotes}>{flight.notes}</Text> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={openNewFlightModal}>
              <Text style={styles.addBtnText}>+ Adicionar voo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Hospedagem</Text>
          <View style={styles.sectionCard}>
            {accommodations.length === 0 ? (
              <Text style={styles.emptySectionText}>Nenhuma hospedagem cadastrada</Text>
            ) : (
              <View style={styles.flightsList}>
                {accommodations.map((accommodation) => (
                  <TouchableOpacity
                    key={accommodation.id}
                    style={styles.accommodationCard}
                    activeOpacity={0.85}
                    onPress={() => openEditAccommodationModal(accommodation)}
                  >
                    {accommodation.image_url ? (
                      <Image source={{ uri: accommodation.image_url }} style={styles.accommodationImage} resizeMode="cover" />
                    ) : null}
                    <Text style={styles.flightCode}>{accommodation.name}</Text>
                    <Text style={styles.flightMeta}>{accommodation.location}</Text>
                    {(accommodation.check_in_date || accommodation.check_in_time || accommodation.check_out_date || accommodation.check_out_time) ? (
                      <Text style={styles.flightMeta}>
                        Check-in: {formatDate(accommodation.check_in_date || '')} {accommodation.check_in_time || '--'} | Check-out: {formatDate(accommodation.check_out_date || '')} {accommodation.check_out_time || '--'}
                      </Text>
                    ) : null}
                    {accommodation.link ? <Text style={styles.linkText}>{accommodation.link}</Text> : null}
                    {accommodation.description ? <Text style={styles.flightNotes}>{accommodation.description}</Text> : null}
                    <Text style={styles.editFlightHint}>Toque para editar</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={openNewAccommodationModal}>
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
          <View style={styles.sectionCard}>
            {expenses.length === 0 ? (
              <Text style={styles.emptySectionText}>Nenhum gasto registrado</Text>
            ) : (() => {
              const total = expenses.reduce((sum, e) => sum + e.amount, 0)
              const currency = expenses[expenses.length - 1]?.currency || 'BRL'

              const byDay: Record<string, number> = {}
              for (const e of expenses) {
                byDay[e.date] = (byDay[e.date] || 0) + e.amount
              }

              // Gera os últimos 15 dias a partir de hoje, preenchendo com 0 quando sem gasto
              const last15: { date: string; val: number }[] = []
              for (let i = 14; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const key = d.toISOString().split('T')[0]
                last15.push({ date: key, val: byDay[key] || 0 })
              }
              const maxDay = Math.max(...last15.map((x) => x.val), 1)

              const recent = [...expenses].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)

              return (
                <>
                  <Text style={styles.expensesTotal}>
                    {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.expensesTotalLabel}>total gasto</Text>

                  <View style={styles.barChart}>
                    {last15.map(({ date, val }) => {
                      const [, m, d] = date.split('-')
                      const label = `${d}/${m}`
                      const pct = val / maxDay
                      return (
                        <View key={date} style={styles.barCol}>
                          <View style={styles.barTrack}>
                            {val > 0 ? (
                              <View style={[styles.bar, { height: Math.max(6, pct * 80) }]} />
                            ) : (
                              <View style={styles.barEmpty} />
                            )}
                          </View>
                          <Text style={styles.barLabel}>{label}</Text>
                        </View>
                      )
                    })}
                  </View>

                  <View style={styles.recentExpenses}>
                    {recent.map((e) => (
                      <View key={e.id} style={styles.recentExpenseItem}>
                        <Text style={styles.recentExpenseIcon}>{CATEGORY_ICONS[e.category] || '💰'}</Text>
                        <View style={styles.recentExpenseMiddle}>
                          <Text style={styles.recentExpenseCategory}>{e.category}</Text>
                          {e.description ? <Text style={styles.recentExpenseDesc} numberOfLines={1}>{e.description}</Text> : null}
                        </View>
                        <Text style={styles.recentExpenseAmount}>
                          {e.currency} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )
            })()}

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
        <Pressable style={styles.modalOverlay} onPress={handleCloseFlightModal}>
          <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={styles.modalBox} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingFlightId ? 'Editar voo' : 'Novo voo'}</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseFlightModal}>
                  <Text style={styles.modalCloseText}>Fechar</Text>
                </TouchableOpacity>
              </View>

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
                onPress={handleCloseFlightModal}
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
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={accommodationModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editingAccommodationId ? 'Editar hospedagem' : 'Nova hospedagem'}</Text>

              <Text style={styles.modalLabel}>Imagem do local (1 foto)</Text>
              <ImagePickerComponent imageUri={accommodationImageUri} onImageSelected={setAccommodationImageUri} />

              <Text style={styles.modalLabel}>Nome *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Hotel Central"
                placeholderTextColor={C.tertiary}
                value={accommodationName}
                onChangeText={setAccommodationName}
              />

              <Text style={styles.modalLabel}>Local *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Lisboa, Portugal"
                placeholderTextColor={C.tertiary}
                value={accommodationLocation}
                onChangeText={setAccommodationLocation}
              />

              <Text style={styles.modalLabel}>Link</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://..."
                placeholderTextColor={C.tertiary}
                value={accommodationLink}
                onChangeText={setAccommodationLink}
                autoCapitalize="none"
                keyboardType="url"
              />

              <View style={styles.modalRow}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalLabel}>Data check-in</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={datePlaceholder}
                    placeholderTextColor={C.tertiary}
                    value={accommodationCheckInDate}
                    onChangeText={(value) => setAccommodationCheckInDate(applyDateMask(value))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.modalLabel}>Horario check-in</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={timePlaceholder}
                    placeholderTextColor={C.tertiary}
                    value={accommodationCheckIn}
                    onChangeText={(value) => setAccommodationCheckIn(applyTimeMask(value))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalLabel}>Data check-out</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={datePlaceholder}
                    placeholderTextColor={C.tertiary}
                    value={accommodationCheckOutDate}
                    onChangeText={(value) => setAccommodationCheckOutDate(applyDateMask(value))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.modalLabel}>Horario check-out</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={timePlaceholder}
                    placeholderTextColor={C.tertiary}
                    value={accommodationCheckOut}
                    onChangeText={(value) => setAccommodationCheckOut(applyTimeMask(value))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.modalLabel}>Descricao</Text>
              <TextInput
                style={[styles.modalInput, styles.modalNotes]}
                placeholder="Detalhes da hospedagem"
                placeholderTextColor={C.tertiary}
                value={accommodationDescription}
                onChangeText={setAccommodationDescription}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setAccommodationModalVisible(false)
                    resetAccommodationForm()
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveAccommodation}
                  disabled={savingAccommodation || deletingAccommodation}
                >
                  {savingAccommodation ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingAccommodationId ? 'Salvar edicao' : 'Salvar hospedagem'}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {editingAccommodationId ? (
                <TouchableOpacity
                  style={styles.deleteFlightBtn}
                  onPress={handleDeleteAccommodation}
                  disabled={deletingAccommodation || savingAccommodation}
                >
                  <Text style={styles.deleteFlightBtnText}>{deletingAccommodation ? 'Excluindo...' : 'Excluir hospedagem'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
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
  flightCard: { backgroundColor: C.surfaceHigh, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, padding: 14 },
  flightCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flightIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  flightIconText: { fontSize: 22 },
  flightCardContent: { flex: 1 },
  flightCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  flightRoute: { fontSize: 16, fontWeight: '700', color: C.primary },
  flightCode: { fontSize: 12, color: C.secondary },
  flightDateRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  flightDateText: { fontSize: 12, color: C.secondary },
  flightDateSep: { fontSize: 12, color: C.tertiary },
  flightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flightMeta: { fontSize: 12, color: C.secondary, marginTop: 4 },
  flightNotes: { fontSize: 12, color: C.accent, marginTop: 6 },
  editFlightHint: { fontSize: 11, color: C.accent, marginTop: 10, fontWeight: '500' },
  accommodationCard: { backgroundColor: C.surfaceHigh, borderRadius: 10, borderWidth: 0.5, borderColor: C.border, padding: 12 },
  accommodationImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  linkText: { fontSize: 12, color: C.accent, marginTop: 6 },
  emptySection: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  emptySectionText: { fontSize: 13, color: C.tertiary, marginBottom: 10 },
  addBtn: { borderWidth: 0.5, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'center' },
  addBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalKeyboard: { flex: 1, justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.primary, marginBottom: 8 },
  modalCloseBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  modalCloseText: { fontSize: 12, color: C.accent, fontWeight: '600' },
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
  expensesTotal: { fontSize: 28, fontWeight: '700', color: C.primary, textAlign: 'center', marginTop: 4 },
  expensesTotalLabel: { fontSize: 12, color: C.tertiary, textAlign: 'center', marginBottom: 16 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: '100%', height: 64, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#4A7CF7', borderRadius: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barEmpty: { width: '100%', height: 3, backgroundColor: C.border, borderRadius: 3 },
  barLabel: { fontSize: 10, color: C.tertiary },
  recentExpenses: { gap: 8, marginBottom: 12 },
  recentExpenseItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentExpenseIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  recentExpenseMiddle: { flex: 1 },
  recentExpenseCategory: { fontSize: 13, fontWeight: '600', color: C.primary },
  recentExpenseDesc: { fontSize: 11, color: C.tertiary },
  recentExpenseAmount: { fontSize: 13, fontWeight: '600', color: C.primary },
})
