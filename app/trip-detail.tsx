import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Modal, Platform,
  TextInput, ActivityIndicator, Pressable,
  useWindowDimensions
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t, getDeviceLocale } from '../lib/i18n'
import { applyDateMask, applyDateTimeMask, applyTimeMask, formatDateForInput, formatDateTimeForInput, getLocalDatePlaceholder, getLocalDateTimePlaceholder, getLocalTimePlaceholder, toISODateOrNull, toISODateTimeOrNull, toTimeOrNull } from '../lib/date-locale'
import ImagePickerComponent from '../components/ImagePicker'
import Icon from '../components/Icon'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import SheetModal from '../components/SheetModal'
import { shareAsText, shareAsPDF } from '../lib/share-trip'
import DesktopLayout from '../components/DesktopLayout'
import HScrollable from '../components/HScrollable'
import { formatBRL } from '../lib/currency'
import { useResponsive } from '../hooks/useResponsive'

const C = Colors.dark

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  status: string
  cover_image: string | null
  budget: number | null
  budget_currency: string | null
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
  end_time: string | null
  location: string | null
  category: string | null
  created_at: string
}

const ITINERARY_CATEGORY_CONF: Record<string, { icon: string; color: string }> = {
  'flight':        { icon: 'flight',          color: '#000000' },
  'transport':     { icon: 'directions-car',  color: '#32ADE6' },
  'accommodation': { icon: 'hotel',           color: '#5856D6' },
  'food':          { icon: 'restaurant',      color: '#FF9500' },
  'sightseeing':   { icon: 'place',           color: '#34C759' },
  'event':         { icon: 'event',           color: '#FF2D55' },
  'shopping':      { icon: 'shopping-bag',    color: '#AF52DE' },
  'free':          { icon: 'beach-access',    color: '#8E8E93' },
}

const CATEGORY_ICON_NAMES: Record<string, string> = {
  'Hospedagem': 'hotel', 'Alimentação': 'restaurant', 'Transporte': 'directions-car',
  'Passeios': 'attractions', 'Compras': 'shopping-bag', 'Saúde': 'medical-services', 'Outros': 'payments'
}

const EXPENSE_CATEGORY_CONF: Record<string, { icon: string; color: string }> = {
  'Hospedagem': { icon: 'hotel',             color: '#5856D6' },
  'Alimentação': { icon: 'restaurant',       color: '#FF9500' },
  'Transporte':  { icon: 'directions-car',   color: '#32ADE6' },
  'Passeios':    { icon: 'attractions',      color: '#34C759' },
  'Compras':     { icon: 'shopping-bag',     color: '#AF52DE' },
  'Saúde':       { icon: 'medical-services', color: '#FF2D55' },
  'Outros':      { icon: 'payments',         color: '#8E8E93' },
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

function formatTime(value?: string | null) {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleTimeString(getDeviceLocale(), { hour: '2-digit', minute: '2-digit' })
}

function getDaysUntil(dateStr?: string | null): string | null {
  if (!dateStr) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return null
  const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff < 30) return `Em ${diff} dias`
  const months = Math.round(diff / 30)
  return `Em ${months} ${months === 1 ? 'mês' : 'meses'}`
}

function formatDateRange(checkIn?: string | null, checkOut?: string | null): string {
  const fmt = (d: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
    if (!m) return d
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return dt.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: 'short' })
  }
  if (checkIn && checkOut) return `${fmt(checkIn)} – ${fmt(checkOut)}`
  if (checkIn) return fmt(checkIn)
  if (checkOut) return fmt(checkOut)
  return ''
}

function formatWeekdayDay(dateStr?: string | null): { weekday: string; day: string } | null {
  if (!dateStr) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return null
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return {
    weekday: d.toLocaleDateString(getDeviceLocale(), { weekday: 'short' }).replace('.', ''),
    day: String(d.getDate()),
  }
}

function formatDateShort(value?: string | null) {
  if (!value) return '--'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString(getDeviceLocale(), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
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
  const { width: windowWidth } = useWindowDimensions()
  const { isDesktop } = useResponsive()
  // Desktop: cards compactos lado a lado (max 340px); Mobile: full-width paginado
  const CARD_WIDTH = isDesktop ? Math.min(340, (windowWidth - 300) / 2) : windowWidth - 40
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
  const [accomImageUploading, setAccomImageUploading] = useState(false)

  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([])
  const [tripMenuVisible, setTripMenuVisible] = useState(false)
  const [shareMenuVisible, setShareMenuVisible] = useState(false)
  const [activeFlightIndex, setActiveFlightIndex] = useState(0)
  const [activeAccomIndex, setActiveAccomIndex] = useState(0)

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
      .order('check_in_date', { ascending: true, nullsFirst: false })

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
      showAlert(t('error_title'), err?.message || t('save_flight_failed'))
    } finally {
      setSavingFlight(false)
    }
  }

  async function handleDeleteFlight() {
    if (!editingFlightId) return

    showAlert(t('confirm_delete_flight_title'), t('confirm_delete_flight_body'), [
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
            showAlert(t('error_title'), err?.message || t('delete_flight_failed'))
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
      showAlert(t('attention_title'), t('required_accommodation_fields'))
      return
    }

    const checkInDate = toISODateOrNull(accommodationCheckInDate)
    const checkOutDate = toISODateOrNull(accommodationCheckOutDate)
    const checkIn = toTimeOrNull(accommodationCheckIn)
    const checkOut = toTimeOrNull(accommodationCheckOut)

    if (accommodationCheckInDate.trim() && !checkInDate) {
      showAlert(t('attention_title'), t('invalid_checkin_date'))
      return
    }

    if (accommodationCheckOutDate.trim() && !checkOutDate) {
      showAlert(t('attention_title'), t('invalid_checkout_date'))
      return
    }

    if (accommodationCheckIn.trim() && !checkIn) {
      showAlert(t('attention_title'), t('invalid_checkin_time'))
      return
    }

    if (accommodationCheckOut.trim() && !checkOut) {
      showAlert(t('attention_title'), t('invalid_checkout_time'))
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
      showAlert(t('error_title'), err?.message || t('save_accommodation_failed'))
    } finally {
      setSavingAccommodation(false)
    }
  }

  async function handleDeleteAccommodation() {
    if (!editingAccommodationId) return

    showAlert(t('confirm_delete_accommodation_title'), t('confirm_delete_accommodation_body'), [
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
            showAlert(t('error_title'), err?.message || t('delete_accommodation_failed'))
          } finally {
            setDeletingAccommodation(false)
          }
        }
      }
    ])
  }

  async function handleDelete() {
    showAlert(t('confirm_delete_trip_title'), t('confirm_delete_trip_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'), style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trips').delete().eq('id', tripId)
          if (!error) router.back()
          else showAlert(t('error_title'), t('delete_trip_failed'))
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
        budget: trip.budget != null ? String(trip.budget) : '',
        budget_currency: trip.budget_currency || 'R$',
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

  async function handleShareText() {
    setShareMenuVisible(false)
    try {
      await shareAsText(tripId)
    } catch (err: any) {
      console.warn('[Share Text]', err)
      showAlert('Erro', err?.message || 'Não foi possível compartilhar')
    }
  }

  async function handleSharePDF() {
    setShareMenuVisible(false)
    try {
      await shareAsPDF(tripId)
    } catch (err: any) {
      console.warn('[Share PDF]', err)
      showAlert('Erro', err?.message || 'Não foi possível gerar o PDF')
    }
  }

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <DesktopLayout fullWidth={isDesktop}>
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, isDesktop && styles.heroCardDesktop]}>
          <View style={styles.heroImageWrap}>
            {trip.cover_image ? (
              <Image source={{ uri: trip.cover_image }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Icon name="flight" size={48} color={C.tertiary} />
              </View>
            )}

            {/* Gradiente + info overlay */}
            <View style={[
              styles.heroOverlay,
              Platform.OS === 'web'
                ? { backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 55%, transparent 100%)' } as any
                : { backgroundColor: 'rgba(0,0,0,0.38)' }
            ]}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle} numberOfLines={2}>{trip.title}</Text>
                <Text style={styles.heroDestination}>{trip.destination}</Text>
                {(trip.start_date || trip.end_date) && (
                  <View style={styles.heroDatesRow}>
                    <View style={styles.heroDateBox}>
                      <Text style={styles.heroDateLabel}>Ida</Text>
                      <Text style={styles.heroDateValue}>{formatDate(trip.start_date)}</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroDateBox}>
                      <Text style={styles.heroDateLabel}>Volta</Text>
                      <Text style={styles.heroDateValue}>{formatDate(trip.end_date)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Icon name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topRightBtns}>
              <TouchableOpacity style={styles.topBtn} onPress={() => setShareMenuVisible(true)}>
                <Icon name="share" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={handleOpenTripMenu}>
                <Icon name="more-vert" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.content, isDesktop && styles.contentDesktop]}>

          <View style={styles.flightSectionHeader}>
            <Text style={styles.sectionTitle}>Voos</Text>
            <TouchableOpacity style={styles.flightAddIconBtn} onPress={openNewFlightModal}>
              <Icon name="add" size={20} color={C.icon} />
            </TouchableOpacity>
          </View>

          {flights.length === 0 ? (
            <View style={styles.emptyFlightCard}>
              <Icon name="flight" size={32} color={C.tertiary} />
              <Text style={styles.emptySectionText}>Nenhum voo cadastrado</Text>
            </View>
          ) : (
            <HScrollable
              paginated={!isDesktop}
              itemWidth={CARD_WIDTH}
              itemCount={flights.length}
              activeIndex={activeFlightIndex}
              onIndexChange={setActiveFlightIndex}
              showDots={!isDesktop && flights.length > 1}
              contentContainerStyle={isDesktop ? styles.desktopCarouselRow : undefined}
            >
                {flights.map((flight) => (
                  <TouchableOpacity
                    key={flight.id}
                    style={[styles.flightCarouselCard, { width: CARD_WIDTH }]}
                    activeOpacity={0.93}
                    onPress={() => openEditFlightModal(flight)}
                  >
                    <View style={styles.flightCardTopRow}>
                      <Text style={styles.flightCardDateLabel}>{formatDateShort(flight.departure_datetime)}</Text>
                      <View style={styles.flightNumBadge}>
                        <Icon name="flight" size={11} color="#fff" />
                        <Text style={styles.flightNumBadgeText}>{flight.flight_number}</Text>
                      </View>
                    </View>

                    <Text style={styles.flightCardAirline}>{flight.airline}</Text>

                    <View style={styles.flightCardTimesRow}>
                      <View>
                        <Text style={styles.flightCardTime}>{formatTime(flight.departure_datetime)}</Text>
                        <Text style={styles.flightCardAirport}>{flight.departure_airport}</Text>
                      </View>

                      <View style={styles.flightCardSep}>
                        <View style={styles.flightCardLine} />
                        <View style={{ transform: [{ rotate: '45deg' }] }}>
                          <Icon name="flight" size={20} color={C.secondary} />
                        </View>
                        <View style={styles.flightCardLine} />
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.flightCardTime}>{formatTime(flight.arrival_datetime)}</Text>
                        <Text style={styles.flightCardAirport}>{flight.arrival_airport}</Text>
                      </View>
                    </View>

                    {flight.notes ? (
                      <Text style={styles.flightCardNotes} numberOfLines={2}>{flight.notes}</Text>
                    ) : null}

                  </TouchableOpacity>
                ))}
            </HScrollable>
          )}

          <View style={styles.flightSectionHeader}>
            <Text style={styles.sectionTitle}>Hospedagem</Text>
            <TouchableOpacity style={styles.flightAddIconBtn} onPress={openNewAccommodationModal}>
              <Icon name="add" size={20} color={C.icon} />
            </TouchableOpacity>
          </View>

          {accommodations.length === 0 ? (
            <View style={styles.emptyFlightCard}>
              <Icon name="hotel" size={32} color={C.tertiary} />
              <Text style={styles.emptySectionText}>Nenhuma hospedagem cadastrada</Text>
            </View>
          ) : (
            <HScrollable
              paginated={!isDesktop}
              itemWidth={CARD_WIDTH}
              itemCount={accommodations.length}
              activeIndex={activeAccomIndex}
              onIndexChange={setActiveAccomIndex}
              showDots={!isDesktop && accommodations.length > 1}
              contentContainerStyle={isDesktop ? styles.desktopCarouselRow : undefined}
            >
                {accommodations.map((accom) => {
                  const daysUntil = getDaysUntil(accom.check_in_date)
                  const dateRange = formatDateRange(accom.check_in_date, accom.check_out_date)
                  const checkInDay = formatWeekdayDay(accom.check_in_date)
                  const checkOutDay = formatWeekdayDay(accom.check_out_date)

                  return (
                    <TouchableOpacity
                      key={accom.id}
                      style={[styles.accomCarouselCard, { width: CARD_WIDTH }]}
                      activeOpacity={0.93}
                      onPress={() => openEditAccommodationModal(accom)}
                    >
                      {/* Cover image */}
                      <View style={styles.accomImageWrapper}>
                        {accom.image_url ? (
                          <Image source={{ uri: accom.image_url }} style={styles.accomCoverImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.accomImagePlaceholder}>
                            <Icon name="hotel" size={44} color={C.tertiary} />
                          </View>
                        )}
                        {daysUntil ? (
                          <View style={styles.accomDateBadge}>
                            <Text style={styles.accomDateBadgeText}>{daysUntil}</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Main info */}
                      <View style={styles.accomCardBody}>
                        <Text style={styles.accomCardTitle} numberOfLines={2}>{accom.name}</Text>
                        {(dateRange || accom.location) ? (
                          <Text style={styles.accomCardMeta} numberOfLines={1}>
                            {[dateRange, accom.location].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                        {accom.description ? (
                          <Text style={styles.accomCardDesc} numberOfLines={2}>{accom.description}</Text>
                        ) : null}
                      </View>

                      {/* Check-in / Check-out rows */}
                      {(checkInDay || checkOutDay) ? (
                        <View style={styles.accomCheckRows}>
                          {checkInDay ? (
                            <View style={styles.accomCheckRow}>
                              <View style={styles.accomCheckDayBox}>
                                <Text style={styles.accomCheckWeekday}>{checkInDay.weekday}</Text>
                                <Text style={styles.accomCheckDayNum}>{checkInDay.day}</Text>
                              </View>
                              <View style={styles.accomCheckIconBox}>
                                <Icon name="login" size={20} color={C.secondary} />
                              </View>
                              <Text style={styles.accomCheckLabel}>
                                Check-in{accom.check_in_time ? ` · ${accom.check_in_time}` : ''}
                              </Text>
                            </View>
                          ) : null}
                          {checkOutDay ? (
                            <View style={[styles.accomCheckRow, checkInDay ? styles.accomCheckRowBorder : null]}>
                              <View style={styles.accomCheckDayBox}>
                                <Text style={styles.accomCheckWeekday}>{checkOutDay.weekday}</Text>
                                <Text style={styles.accomCheckDayNum}>{checkOutDay.day}</Text>
                              </View>
                              <View style={styles.accomCheckIconBox}>
                                <Icon name="logout" size={20} color={C.secondary} />
                              </View>
                              <Text style={styles.accomCheckLabel}>
                                Check-out{accom.check_out_time ? ` · ${accom.check_out_time}` : ''}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                    </TouchableOpacity>
                  )
                })}
            </HScrollable>
          )}

          <View style={styles.flightSectionHeader}>
            <Text style={styles.sectionTitle}>Roteiro</Text>
            <TouchableOpacity
              style={styles.flightAddIconBtn}
              onPress={() => trip && router.push({ pathname: '/itinerary', params: { id: tripId, title: trip.title, start_date: trip.start_date, end_date: trip.end_date } })}
            >
              <Icon name="add" size={20} color={C.icon} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.itineraryCard}
            activeOpacity={0.85}
            onPress={() => trip && router.push({ pathname: '/itinerary', params: { id: tripId, title: trip.title, start_date: trip.start_date, end_date: trip.end_date } })}
          >
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const upcoming = itineraryItems
                .filter(i => i.scheduled_date && i.scheduled_date >= today)
                .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || '') || (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
                .slice(0, 3)

              return (
                <>
                  {upcoming.length === 0 ? (
                    <View style={styles.itineraryEmptyState}>
                      <Icon name="event-available" size={24} color={C.tertiary} />
                      <Text style={styles.itineraryEmptyText}>Nenhum evento programado</Text>
                    </View>
                  ) : (
                    upcoming.map((item, idx) => {
                      const conf = ITINERARY_CATEGORY_CONF[item.category || 'free'] ?? ITINERARY_CATEGORY_CONF['free']
                      const dateLabel = item.scheduled_date
                        ? new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                        : null
                      return (
                        <View key={item.id} style={[styles.itineraryPreviewItem, { borderLeftColor: conf.color }, idx < upcoming.length - 1 && { marginBottom: 8 }]}>
                          <View style={styles.itineraryPreviewInner}>
                            <View style={styles.itineraryPreviewTopRow}>
                              <View style={[styles.itineraryPreviewIcon, { backgroundColor: conf.color + '18' }]}>
                                <Icon name={conf.icon as any} size={13} color={conf.color} />
                              </View>
                              <Text style={[styles.itineraryPreviewCat, { color: conf.color }]}>{item.category || 'Livre'}</Text>
                            </View>
                            <Text style={styles.itineraryPreviewTitle} numberOfLines={1}>{item.title}</Text>
                            {[dateLabel, item.scheduled_time, item.location].filter(Boolean).length > 0 && (
                              <Text style={styles.itineraryPreviewMeta} numberOfLines={1}>
                                {[dateLabel, item.scheduled_time, item.location].filter(Boolean).join('  ·  ')}
                              </Text>
                            )}
                          </View>
                        </View>
                      )
                    })
                  )}
                </>
              )
            })()}
          </TouchableOpacity>

          <View style={styles.flightSectionHeader}>
            <Text style={styles.sectionTitle}>Gastos</Text>
            <TouchableOpacity
              style={styles.flightAddIconBtn}
              onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title, openNew: '1' } })}
            >
              <Icon name="add" size={20} color={C.icon} />
            </TouchableOpacity>
          </View>
          {expenses.length === 0 ? (
            <TouchableOpacity
              style={styles.expensesEmptyCard}
              onPress={() => trip && router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title } })}
              activeOpacity={0.85}
            >
              <Icon name="account-balance-wallet" size={28} color={C.tertiary} />
              <Text style={styles.expensesEmptyText}>Nenhum gasto registrado</Text>
              <Text style={styles.expensesEmptySubtext}>Toque para registrar seus gastos</Text>
            </TouchableOpacity>
          ) : (() => {
            const total = expenses.reduce((sum, e) => sum + e.amount, 0)
            const currency = expenses[expenses.length - 1]?.currency || 'R$'
            const recent = [...expenses].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
            const categoryTotals = Object.entries(
              expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1]).slice(0, 4)
            const maxCat = categoryTotals[0]?.[1] || 1
            return (
              <TouchableOpacity
                style={styles.expensesCard}
                onPress={() => trip && router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title } })}
                activeOpacity={0.85}
              >
                {/* Bento: total + contagem inline */}
                <View style={styles.expensesBentoTotal}>
                  <Text style={styles.expensesBentoTotalLabel}>Total gasto</Text>
                  <Text style={styles.expensesBentoTotalValue} numberOfLines={1} adjustsFontSizeToFit>
                    {currency} {formatBRL(total)}
                  </Text>
                  <Text style={styles.expensesBentoCountInline}>
                    {expenses.length} {expenses.length === 1 ? 'lançamento' : 'lançamentos'}
                  </Text>
                </View>

                {/* Breakdown por categoria */}
                <View style={styles.expensesCatSection}>
                  {categoryTotals.map(([cat, amt]) => {
                    const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                    const pct = (amt / maxCat) * 100
                    return (
                      <View key={cat} style={styles.expensesCatRow}>
                        <View style={styles.expensesCatLeft}>
                          <Icon name={conf.icon as any} size={12} color={conf.color} />
                          <Text style={styles.expensesCatLabel} numberOfLines={1}>{cat}</Text>
                        </View>
                        <View style={styles.expensesCatBarTrack}>
                          <View style={[styles.expensesCatBar, { width: `${pct}%` as any, backgroundColor: conf.color }]} />
                        </View>
                        <Text style={styles.expensesCatAmt}>
                          {currency} {formatBRL(amt)}
                        </Text>
                      </View>
                    )
                  })}
                </View>

                <View style={styles.expensesDivider} />

                {/* Últimos gastos */}
                {recent.map((e, idx) => {
                  const conf = EXPENSE_CATEGORY_CONF[e.category] ?? EXPENSE_CATEGORY_CONF['Outros']
                  return (
                    <View key={e.id} style={[styles.expensesRecentRow, idx < recent.length - 1 && styles.expensesRecentRowBorder]}>
                      <View style={[styles.expensesRecentIcon, { backgroundColor: conf.color + '18' }]}>
                        <Icon name={conf.icon as any} size={14} color={conf.color} />
                      </View>
                      <View style={styles.expensesRecentMid}>
                        <Text style={styles.expensesRecentCat}>{e.category}</Text>
                        {e.description ? <Text style={styles.expensesRecentDesc} numberOfLines={1}>{e.description}</Text> : null}
                      </View>
                      <Text style={styles.expensesRecentAmt}>
                        {e.currency} {formatBRL(e.amount)}
                      </Text>
                    </View>
                  )
                })}

              </TouchableOpacity>
            )
          })()}

          {/* ── Checklist ── */}
          <View style={styles.sectionBlock}>
            <View style={styles.flightSectionHeader}>
              <Text style={styles.sectionTitle}>Checklist</Text>
              <TouchableOpacity
                style={styles.flightAddIconBtn}
                onPress={() => trip && router.push({ pathname: '/checklist', params: { id: trip.id, title: trip.title } })}
              >
                <Icon name="open-in-new" size={20} color={C.icon} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.checklistCard}
              activeOpacity={0.85}
              onPress={() => trip && router.push({ pathname: '/checklist', params: { id: trip.id, title: trip.title } })}
            >
              <Icon name="checklist" size={28} color={C.tertiary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checklistCardTitle}>Lista de bagagem e tarefas</Text>
                <Text style={styles.checklistCardSub}>Organize o que levar e o que fazer</Text>
              </View>
              <Icon name="chevron-right" size={20} color={C.tertiary} />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <SheetModal
        visible={flightsModalVisible}
        onClose={handleCloseFlightModal}
        title={editingFlightId ? 'Editar voo' : 'Novo voo'}
        subtitle="Preencha os dados do voo"
        onDelete={editingFlightId ? handleDeleteFlight : undefined}
        deleteDisabled={deletingFlight || savingFlight}
      >

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
      </SheetModal>

      <Modal visible={tripMenuVisible} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={handleCloseTripMenu}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditFromMenu}>
              <View style={styles.menuItemRow}>
                <Icon name="edit" size={16} color={C.primary} />
                <Text style={styles.menuItemText}>Editar viagem</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteFromMenu}>
              <View style={styles.menuItemRow}>
                <Icon name="delete-outline" size={16} color={C.error} />
                <Text style={[styles.menuItemText, styles.menuItemDanger]}>Excluir viagem</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={shareMenuVisible} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setShareMenuVisible(false)}>
          <Pressable style={styles.sharePanel} onPress={() => {}}>
            <Text style={styles.sharePanelTitle}>Compartilhar viagem</Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleShareText}>
              <View style={styles.menuItemRow}>
                <Icon name="chat" size={18} color={C.primary} />
                <View>
                  <Text style={styles.menuItemText}>Texto</Text>
                  <Text style={styles.menuItemHint}>WhatsApp, Telegram, SMS...</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleSharePDF}>
              <View style={styles.menuItemRow}>
                <Icon name="picture-as-pdf" size={18} color={C.primary} />
                <View>
                  <Text style={styles.menuItemText}>PDF</Text>
                  <Text style={styles.menuItemHint}>Email, salvar, imprimir...</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <SheetModal
        visible={accommodationModalVisible}
        onClose={handleCloseAccommodationModal}
        title={editingAccommodationId ? 'Editar hospedagem' : 'Nova hospedagem'}
        subtitle="Preencha os dados da hospedagem"
        onDelete={editingAccommodationId ? handleDeleteAccommodation : undefined}
        deleteDisabled={deletingAccommodation || savingAccommodation}
      >

              <Text style={styles.sheetLabel}>Imagem do local</Text>
              <ImagePickerComponent imageUri={accommodationImageUri} onImageSelected={setAccommodationImageUri} uploadFolder="accommodations" onUploadingChange={setAccomImageUploading} />

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

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAccommodation} disabled={savingAccommodation || deletingAccommodation || accomImageUploading}>
                {savingAccommodation ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{editingAccommodationId ? 'Salvar edicao' : 'Salvar hospedagem'}</Text>}
              </TouchableOpacity>
      </SheetModal>
    </>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.secondary, fontSize: 14 },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surfaceHigh,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 4 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16 },
    }),
  },
  heroCardDesktop: {
    maxWidth: 960,
    width: '100%' as any,
    alignSelf: 'center' as any,
    marginHorizontal: 0,
    marginTop: 24,
    marginBottom: 8,
  },
  heroImageWrap: {
    width: '100%',
    aspectRatio: 32 / 9,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' as any },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECECF0' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },
  heroInfo: { gap: 4 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroDestination: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.82)', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroDatesRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroDateBox: { gap: 2 },
  heroDateLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as any, letterSpacing: 0.6 },
  heroDateValue: { fontSize: 13, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  imagePlaceholderIcon: { fontSize: 24, color: C.tertiary, letterSpacing: 1 },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  menuBtn: { position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topRightBtns: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 10 },
  topBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  contentDesktop: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 960, alignSelf: 'center' as any, width: '100%' },
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
  // Flight carousel
  flightSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 },
  flightAddIconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHigh, borderWidth: 0.5, borderColor: C.border },
  emptyFlightCard: { backgroundColor: C.surface, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', gap: 10 },
  flightCarouselWrapper: { marginBottom: 16 },
  desktopCarouselRow: { gap: 16, paddingRight: 4 },
  flightCarouselCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  flightCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  flightCardDateLabel: { fontSize: 12, color: C.tertiary, fontWeight: '500' },
  flightNumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  flightNumBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  flightCardAirline: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 14 },
  flightCardTimesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  flightCardTime: { fontSize: 26, fontWeight: '800', color: C.primary },
  flightCardAirport: { fontSize: 13, fontWeight: '600', color: C.secondary, marginTop: 2 },
  flightCardSep: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  flightCardLine: { flex: 1, height: 1.5, backgroundColor: C.border },
  flightCardNotes: { fontSize: 12, color: C.secondary, marginBottom: 8, lineHeight: 17 },
  flightPagDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 4 },
  flightPagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  flightPagDotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: C.primary },
  // Legacy (kept for accommodation reuse)
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
  // Accommodation carousel
  accomCarouselCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  accomImageWrapper: { position: 'relative', width: '100%', aspectRatio: 16 / 10 },
  accomCoverImage: { width: '100%', height: '100%' },
  accomImagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: C.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  accomDateBadge: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  accomDateBadgeText: { fontSize: 13, fontWeight: '700', color: C.primary },
  accomCardBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  accomCardTitle: { fontSize: 18, fontWeight: '800', color: C.primary, marginBottom: 4, lineHeight: 24 },
  accomCardMeta: { fontSize: 13, color: C.secondary, marginBottom: 6 },
  accomCardDesc: { fontSize: 12, color: C.tertiary, lineHeight: 17, marginTop: 4 },
  accomCheckRows: { borderTopWidth: 0.5, borderTopColor: C.border, marginTop: 4 },
  accomCheckRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  accomCheckRowBorder: { borderTopWidth: 0.5, borderTopColor: C.border },
  accomCheckDayBox: { width: 40, alignItems: 'center', marginRight: 12 },
  accomCheckWeekday: { fontSize: 11, color: C.tertiary, fontWeight: '600', textTransform: 'lowercase' },
  accomCheckDayNum: { fontSize: 22, fontWeight: '700', color: C.primary },
  accomCheckIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  accomCheckLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.primary },
  // Legacy
  accommodationCard: { backgroundColor: C.surfaceHigh, borderRadius: 10, borderWidth: 0.5, borderColor: C.border, padding: 12 },
  accommodationImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  linkText: { fontSize: 12, color: C.accent, marginTop: 6 },
  emptySection: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  emptySectionText: { fontSize: 13, color: C.tertiary, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 0.5, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'center' },
  addBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetKeyboard: {},
  sheetContainer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  sheetHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  sheetScroll: { paddingHorizontal: 24, paddingBottom: 34 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menuPanel: { position: 'absolute', top: 104, right: 20, backgroundColor: C.surface, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, minWidth: 180, overflow: 'hidden' },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  menuItemDanger: { color: C.error },
  menuDivider: { height: 1, backgroundColor: C.border },
  sharePanel: { position: 'absolute', top: 104, right: 20, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, minWidth: 220, overflow: 'hidden' },
  sharePanelTitle: { fontSize: 12, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  menuItemHint: { fontSize: 11, color: C.tertiary, marginTop: 1 },
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
    backgroundColor: C.buttonPrimary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.buttonPrimary, shadowOffset: { width: 0, height: 6 },
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
  expensesTotalCard: {
    backgroundColor: C.primary, borderRadius: 12, padding: 16, marginBottom: 14,
  },
  expensesTotalCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  expensesTotalCardValue: { fontSize: 28, fontWeight: '700', color: '#fff' },
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

  // Expenses redesign
  expensesEmptyCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 24,
    borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', gap: 6, marginBottom: 16,
  },
  expensesEmptyText: { fontSize: 14, fontWeight: '600', color: C.secondary, marginTop: 4 },
  expensesEmptySubtext: { fontSize: 12, color: C.tertiary },
  expensesCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 16,
  },
  expensesBentoTotal: { backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  expensesBentoTotalLabel: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  expensesBentoTotalValue: { fontSize: 22, fontWeight: '800', color: C.primary },
  expensesBentoCountInline: { fontSize: 12, color: C.tertiary, marginTop: 6 },
  expensesCatSection: { gap: 8, marginBottom: 14 },
  expensesCatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expensesCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 94 },
  expensesCatLabel: { fontSize: 11, color: C.secondary, flex: 1 },
  expensesCatBarTrack: { flex: 1, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  expensesCatBar: { height: 4, borderRadius: 2 },
  expensesCatAmt: { fontSize: 11, fontWeight: '600', color: C.primary, width: 58, textAlign: 'right' },
  expensesDivider: { height: 0.5, backgroundColor: C.border, marginBottom: 4 },
  expensesRecentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  expensesRecentRowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.border },
  expensesRecentIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expensesRecentMid: { flex: 1 },
  expensesRecentCat: { fontSize: 13, fontWeight: '600', color: C.primary },
  expensesRecentDesc: { fontSize: 11, color: C.tertiary },
  expensesRecentAmt: { fontSize: 13, fontWeight: '700', color: C.primary },

  itineraryCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, marginBottom: 16 },
  itineraryEmptyState: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  itineraryEmptyText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  itineraryEmptySubtext: { fontSize: 12, color: C.tertiary },
  itineraryBentoRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  itineraryBentoCard: { width: 72, backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  itineraryBentoNum: { fontSize: 24, fontWeight: '800', color: C.primary },
  itineraryBentoLabel: { fontSize: 10, color: C.secondary, fontWeight: '500', marginTop: 1 },
  itineraryBentoCats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'flex-end' },
  itineraryCatDot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  itineraryDayHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  itineraryDayLabel: { fontSize: 13, fontWeight: '700', color: C.primary },
  itineraryDayDate: { fontSize: 11, color: C.tertiary },
  itineraryDivider: { height: 0.5, backgroundColor: C.border, marginBottom: 10 },
  itineraryPreviewItem: {
    backgroundColor: C.surfaceHigh, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 4,
    overflow: 'hidden',
  },
  itineraryPreviewInner: { padding: 12 },
  itineraryPreviewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  itineraryPreviewIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  itineraryPreviewCat: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itineraryPreviewInfo: { flex: 1 },
  itineraryPreviewTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 3 },
  itineraryPreviewMeta: { fontSize: 12, color: C.secondary },

  // Checklist card
  sectionBlock: { marginBottom: 16 },
  checklistCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  checklistCardTitle: { fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 2 },
  checklistCardSub: { fontSize: 12, color: C.secondary },
})
