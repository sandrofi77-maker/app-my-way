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
import { applyDateMask, applyDateTimeMask, applyTimeMask, formatDateForInput, formatDateTimeForInput, getLocalDatePlaceholder, getLocalDateTimePlaceholder, getLocalTimePlaceholder, toISODateOrNull, toISODateTimeOrNull, toTimeOrNull } from '../lib/date-locale'
import ImagePickerComponent from '../components/ImagePicker'
import Icon from '../components/Icon'

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

type ItineraryItem = {
  id: string
  title: string
  description: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  location: string | null
  created_at: string
}

const CATEGORY_ICON_NAMES: Record<string, string> = {
  'Hospedagem': 'hotel', 'Alimentação': 'restaurant', 'Transporte': 'directions-car',
  'Passeios': 'attractions', 'Compras': 'shopping-bag', 'Saúde': 'medical-services', 'Outros': 'payments'
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

  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([])
  const [tripMenuVisible, setTripMenuVisible] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadTrip()
      loadFlights()
      loadAccommodations()
      loadExpenses()
      loadItineraryItems()
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

  async function loadItineraryItems() {
    if (!tripId) return
    const { data, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('scheduled_date', { ascending: true })
    if (!error) setItineraryItems(data || [])
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
    setDepartureDatetime(formatDateTimeForInput(flight.departure_datetime))
    setArrivalDatetime(formatDateTimeForInput(flight.arrival_datetime))
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
    setAccommodationCheckInDate(formatDateForInput(accommodation.check_in_date))
    setAccommodationCheckOutDate(formatDateForInput(accommodation.check_out_date))
    setAccommodationCheckIn(accommodation.check_in_time || '')
    setAccommodationCheckOut(accommodation.check_out_time || '')
    setAccommodationDescription(accommodation.description || '')
    setAccommodationImageUri(accommodation.image_url || null)
    setAccommodationModalVisible(true)
  }

  function handleCloseAccommodationModal() {
    setAccommodationModalVisible(false)
    resetAccommodationForm()
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

  function handleOpenTripMenu() {
    setTripMenuVisible(true)
  }

  function handleCloseTripMenu() {
    setTripMenuVisible(false)
  }

  function handleEditFromMenu() {
    setTripMenuVisible(false)
    handleEdit()
  }

  function handleDeleteFromMenu() {
    setTripMenuVisible(false)
    handleDelete()
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
              <Icon name="flight" size={48} color={C.tertiary} />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={handleOpenTripMenu}>
            <Icon name="more-vert" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.title}>{trip.title}</Text>
              <Text style={styles.destination}>{trip.destination}</Text>
            </View>
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Ida</Text>
              <Text style={styles.dateValue}>{formatDate(trip.start_date)}</Text>
            </View>
            <Icon name="arrow-forward" size={18} color={C.tertiary} />
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
                        <Icon name="flight" size={24} color={C.primary} />
                      </View>
                      <View style={styles.flightCardContent}>
                        <View style={styles.flightCardHeader}>
                          <Text style={styles.flightRoute}>{flight.departure_airport} - {flight.arrival_airport}</Text>
                          <Text style={styles.flightCode}>{flight.airline} - {flight.flight_number}</Text>
                        </View>
                        <View style={styles.flightDateRow}>
                          <Icon name="flight-takeoff" size={13} color={C.secondary} />
                          <Text style={styles.flightDateText}>{formatDateTime(flight.departure_datetime)}</Text>
                          {flight.arrival_datetime ? (
                            <>
                              <Text style={styles.flightDateSep}> • </Text>
                              <Icon name="flight-land" size={13} color={C.secondary} />
                              <Text style={styles.flightDateText}>{formatDateTime(flight.arrival_datetime)}</Text>
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
              <Icon name="add" size={16} color={C.accent} /><Text style={styles.addBtnText}>Adicionar voo</Text>
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
              <Icon name="add" size={16} color={C.accent} /><Text style={styles.addBtnText}>Adicionar hospedagem</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Roteiro</Text>
          <TouchableOpacity
            style={styles.sectionCard}
            activeOpacity={0.85}
            onPress={() => trip && router.push({ pathname: '/itinerary', params: { id: tripId, title: trip.title, start_date: trip.start_date, end_date: trip.end_date } })}
          >
            <View style={styles.itineraryPreviewRow}>
              <View style={styles.itineraryPreviewLeft}>
                <Icon name="event-note" size={28} color={C.primary} />
              </View>
              <View style={styles.itineraryPreviewContent}>
                <Text style={styles.itineraryPreviewTitle}>
                  {itineraryItems.length === 0
                    ? 'Nenhum item no roteiro'
                    : `${itineraryItems.length} ${itineraryItems.length === 1 ? 'item' : 'itens'} no roteiro`}
                </Text>
                {itineraryItems.length > 0 && (
                  <Text style={styles.itineraryPreviewSub} numberOfLines={1}>
                    {itineraryItems.slice(0, 2).map(i => i.title).join(' · ')}
                    {itineraryItems.length > 2 ? ` · +${itineraryItems.length - 2}` : ''}
                  </Text>
                )}
                <Text style={styles.itineraryPreviewAction}>Ver e gerenciar roteiro →</Text>
              </View>
            </View>
          </TouchableOpacity>

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
                        <Icon name={(CATEGORY_ICON_NAMES[e.category] || 'payments') as any} size={18} color={C.primary} />
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
              <Icon name="add" size={16} color={C.accent} /><Text style={styles.addBtnText}>Registrar gasto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={flightsModalVisible} animationType="slide" transparent={false}>
        <View style={styles.fullScreenContainer}>
          <KeyboardAvoidingView style={styles.fullScreenKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.fullScreenScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.fullScreenBox}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>{editingFlightId ? 'Editar voo' : 'Novo voo'}</Text>
                  <Text style={styles.modalSubtitle}>Preencha os dados do voo</Text>

                  <Text style={styles.sheetLabel}>Companhia *</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="flight" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder="Ex: LATAM" placeholderTextColor={C.tertiary} value={airline} onChangeText={setAirline} />
                  </View>

                  <Text style={styles.sheetLabel}>Numero do voo *</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="confirmation-number" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder="Ex: LA 1234" placeholderTextColor={C.tertiary} value={flightNumber} onChangeText={setFlightNumber} />
                  </View>

                  <View style={styles.modalRow}>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Saida *</Text>
                      <View style={styles.sheetInputRow}>
                        <Icon name="flight-takeoff" size={18} color={C.secondary} />
                        <TextInput style={styles.sheetInput} placeholder="GRU" placeholderTextColor={C.tertiary} value={departureAirport} onChangeText={setDepartureAirport} autoCapitalize="characters" />
                      </View>
                    </View>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Chegada *</Text>
                      <View style={styles.sheetInputRow}>
                        <Icon name="flight-land" size={18} color={C.secondary} />
                        <TextInput style={styles.sheetInput} placeholder="MAD" placeholderTextColor={C.tertiary} value={arrivalAirport} onChangeText={setArrivalAirport} autoCapitalize="characters" />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.sheetLabel}>Data/hora saida *</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="schedule" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder={dateTimePlaceholder} placeholderTextColor={C.tertiary} value={departureDatetime} onChangeText={(v) => setDepartureDatetime(applyDateTimeMask(v))} keyboardType="numeric" />
                  </View>

                  <Text style={styles.sheetLabel}>Data/hora chegada</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="schedule" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder={dateTimePlaceholder} placeholderTextColor={C.tertiary} value={arrivalDatetime} onChangeText={(v) => setArrivalDatetime(applyDateTimeMask(v))} keyboardType="numeric" />
                  </View>

                  <Text style={styles.sheetLabel}>Observacoes</Text>
                  <View style={[styles.sheetInputRow, styles.sheetInputRowMultiline]}>
                    <Icon name="notes" size={20} color={C.secondary} />
                    <TextInput style={[styles.sheetInput, styles.sheetInputMultiline]} placeholder="Ex: Terminal 2, portao C12" placeholderTextColor={C.tertiary} value={flightNotes} onChangeText={setFlightNotes} multiline />
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveFlight} disabled={savingFlight || deletingFlight}>
                    {savingFlight ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{editingFlightId ? 'Salvar edicao' : 'Salvar voo'}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelSheetBtn} onPress={handleCloseFlightModal}>
                    <Text style={styles.cancelSheetBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  {editingFlightId ? (
                    <TouchableOpacity style={styles.deleteFlightBtn} onPress={handleDeleteFlight} disabled={deletingFlight || savingFlight}>
                      <Text style={styles.deleteFlightBtnText}>{deletingFlight ? 'Excluindo...' : 'Excluir voo'}</Text>
                    </TouchableOpacity>
                  ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={tripMenuVisible} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={handleCloseTripMenu}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditFromMenu}>
              <Text style={styles.menuItemText}>Editar viagem</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteFromMenu}>
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Excluir viagem</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={accommodationModalVisible} animationType="slide" transparent={false}>
        <View style={styles.fullScreenContainer}>
          <KeyboardAvoidingView style={styles.fullScreenKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.fullScreenScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.fullScreenBox}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>{editingAccommodationId ? 'Editar hospedagem' : 'Nova hospedagem'}</Text>
                  <Text style={styles.modalSubtitle}>Preencha os dados da hospedagem</Text>

                  <Text style={styles.sheetLabel}>Imagem do local</Text>
                  <ImagePickerComponent imageUri={accommodationImageUri} onImageSelected={setAccommodationImageUri} />

                  <Text style={styles.sheetLabel}>Nome *</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="hotel" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder="Ex: Hotel Central" placeholderTextColor={C.tertiary} value={accommodationName} onChangeText={setAccommodationName} />
                  </View>

                  <Text style={styles.sheetLabel}>Local *</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="location-on" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder="Ex: Lisboa, Portugal" placeholderTextColor={C.tertiary} value={accommodationLocation} onChangeText={setAccommodationLocation} />
                  </View>

                  <Text style={styles.sheetLabel}>Link</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="link" size={20} color={C.secondary} />
                    <TextInput style={styles.sheetInput} placeholder="https://..." placeholderTextColor={C.tertiary} value={accommodationLink} onChangeText={setAccommodationLink} autoCapitalize="none" keyboardType="url" />
                  </View>

                  <View style={styles.modalRow}>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Data check-in</Text>
                      <View style={styles.sheetInputRow}>
                        <Icon name="calendar-today" size={16} color={C.secondary} />
                        <TextInput style={styles.sheetInput} placeholder={datePlaceholder} placeholderTextColor={C.tertiary} value={accommodationCheckInDate} onChangeText={(v) => setAccommodationCheckInDate(applyDateMask(v))} keyboardType="numeric" />
                      </View>
                    </View>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Horario check-in</Text>
                      <View style={styles.sheetInputRow}>
                        <Icon name="schedule" size={16} color={C.secondary} />
                        <TextInput style={styles.sheetInput} placeholder={timePlaceholder} placeholderTextColor={C.tertiary} value={accommodationCheckIn} onChangeText={(v) => setAccommodationCheckIn(applyTimeMask(v))} keyboardType="numeric" />
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalRow}>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Data check-out</Text>
                      <View style={styles.sheetInputRow}>
                        <Icon name="calendar-today" size={16} color={C.secondary} />
                        <TextInput style={styles.sheetInput} placeholder={datePlaceholder} placeholderTextColor={C.tertiary} value={accommodationCheckOutDate} onChangeText={(v) => setAccommodationCheckOutDate(applyDateMask(v))} keyboardType="numeric" />
                      </View>
                    </View>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Horario check-out</Text>
                      <View style={styles.sheetInputRow}>
                        <Icon name="schedule" size={16} color={C.secondary} />
                        <TextInput style={styles.sheetInput} placeholder={timePlaceholder} placeholderTextColor={C.tertiary} value={accommodationCheckOut} onChangeText={(v) => setAccommodationCheckOut(applyTimeMask(v))} keyboardType="numeric" />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.sheetLabel}>Descricao</Text>
                  <View style={[styles.sheetInputRow, styles.sheetInputRowMultiline]}>
                    <Icon name="notes" size={20} color={C.secondary} />
                    <TextInput style={[styles.sheetInput, styles.sheetInputMultiline]} placeholder="Detalhes da hospedagem" placeholderTextColor={C.tertiary} value={accommodationDescription} onChangeText={setAccommodationDescription} multiline />
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAccommodation} disabled={savingAccommodation || deletingAccommodation}>
                    {savingAccommodation ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{editingAccommodationId ? 'Salvar edicao' : 'Salvar hospedagem'}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelSheetBtn} onPress={handleCloseAccommodationModal}>
                    <Text style={styles.cancelSheetBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  {editingAccommodationId ? (
                    <TouchableOpacity style={styles.deleteFlightBtn} onPress={handleDeleteAccommodation} disabled={deletingAccommodation || savingAccommodation}>
                      <Text style={styles.deleteFlightBtnText}>{deletingAccommodation ? 'Excluindo...' : 'Excluir hospedagem'}</Text>
                    </TouchableOpacity>
                  ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
  menuBtn: { position: 'absolute', top: 54, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 0.5, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'center' },
  addBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menuPanel: { position: 'absolute', top: 104, right: 20, backgroundColor: C.surface, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, minWidth: 180, overflow: 'hidden' },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  menuItemDanger: { color: C.error },
  menuDivider: { height: 1, backgroundColor: C.border },
  fullScreenContainer: { flex: 1, backgroundColor: C.background },
  fullScreenKeyboard: { flex: 1 },
  fullScreenScroll: { flexGrow: 1 },
  fullScreenBox: { flex: 1, backgroundColor: C.background, padding: 24, paddingTop: 50, paddingBottom: 32 },
  modalKeyboard: { flex: 1, justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 48, borderTopRightRadius: 48,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 44,
  },
  modalHandle: {
    width: 48, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center', marginBottom: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: C.primary, marginBottom: 2 },
  modalSubtitle: { fontSize: 14, color: C.secondary, marginBottom: 4 },
  modalCloseBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  modalCloseText: { fontSize: 12, color: C.accent, fontWeight: '600' },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalCol: { flex: 1 },
  modalNotes: { minHeight: 70, textAlignVertical: 'top' },
  sheetLabel: {
    fontSize: 10, fontWeight: '700', color: C.secondary,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginLeft: 4, marginBottom: 8, marginTop: 16,
  },
  sheetInputRow: {
    backgroundColor: C.surfaceHigh, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 4,
  },
  sheetInputRowMultiline: { alignItems: 'flex-start', paddingVertical: 14 },
  sheetInput: { flex: 1, fontSize: 15, color: C.primary, marginLeft: 10, paddingVertical: 14, padding: 0 },
  sheetInputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingVertical: 0 },
  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelSheetBtn: {
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', marginTop: 10,
  },
  cancelSheetBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },
  deleteFlightBtn: { marginTop: 12, borderWidth: 0.5, borderColor: C.error, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
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
  itineraryPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itineraryPreviewLeft: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  itineraryPreviewContent: { flex: 1 },
  itineraryPreviewTitle: { fontSize: 14, fontWeight: '600', color: C.primary, marginBottom: 2 },
  itineraryPreviewSub: { fontSize: 12, color: C.secondary, marginBottom: 6 },
  itineraryPreviewAction: { fontSize: 12, color: C.accent, fontWeight: '600' },
})
