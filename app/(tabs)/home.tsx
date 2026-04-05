import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Animated, Platform
} from 'react-native'
import Icon from '../../components/Icon'
import { useState, useCallback, useEffect, useRef } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import DesktopLayout from '../../components/DesktopLayout'
import { useResponsive } from '../../hooks/useResponsive'

const C = Colors.dark
const MS_PER_DAY = 1000 * 60 * 60 * 24

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string | null
  end_date: string | null
  status: string
  cover_image: string | null
  budget: number | null
  budget_currency: string | null
}

type FlightSummary = {
  trip_id: string
  departure_datetime: string
  arrival_datetime: string | null
}

type TripWithMeta = Trip & {
  nextDateTime: number | null
  daysRemaining: number | null
  isCompleted: boolean
  lastFlightTime: number | null
  expenseTotal: number
}

export default function HomeScreen() {
  const [trips, setTrips] = useState<TripWithMeta[]>([])
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open')
  const [loading, setLoading] = useState(true)
  const insets = useSafeAreaInsets()

  useFocusEffect(
    useCallback(() => { loadData() }, [])
  )

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const displayName = (user.user_metadata?.full_name as string | undefined)
          || (user.user_metadata?.display_name as string | undefined)
          || user.email?.split('@')[0]
          || 'viajante'
        setUserName(displayName)
        const rawAvatar = (user.user_metadata?.avatar_url as string | undefined) || null
        setAvatarUrl(rawAvatar?.startsWith('https://') ? rawAvatar : null)
      }
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return

      const tripsData = (data || []) as Trip[]
      const tripIds = tripsData.map((trip) => trip.id)
      let flightsData: FlightSummary[] = []
      const expenseTotals = new Map<string, number>()

      if (tripIds.length) {
        const { data: flights, error: flightsError } = await supabase
          .from('flights')
          .select('trip_id, departure_datetime, arrival_datetime')
          .in('trip_id', tripIds)

        if (!flightsError) flightsData = (flights || []) as FlightSummary[]

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('trip_id, amount')
          .in('trip_id', tripIds)

        if (expensesData) {
          expensesData.forEach((e: { trip_id: string; amount: number }) => {
            expenseTotals.set(e.trip_id, (expenseTotals.get(e.trip_id) || 0) + e.amount)
          })
        }
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const flightsByTrip = groupFlightsByTrip(flightsData)
      const toCompleteIds: string[] = []

      const prepared = tripsData.map((trip) => {
        const tripFlights = flightsByTrip.get(trip.id) || []
        const lastFlightTime = getLastFlightTime(tripFlights)
        const isCompleted = trip.status === 'completed' || (lastFlightTime !== null && lastFlightTime < now.getTime())
        if (isCompleted && trip.status !== 'completed') toCompleteIds.push(trip.id)
        const nextDateTime = getNextTripDate(trip, tripFlights, todayStart)
        const daysRemaining = nextDateTime !== null
          ? Math.max(0, Math.ceil((nextDateTime - todayStart) / MS_PER_DAY))
          : null
        return {
          ...trip,
          nextDateTime,
          daysRemaining,
          isCompleted,
          lastFlightTime,
          expenseTotal: expenseTotals.get(trip.id) || 0,
        }
      })

      if (toCompleteIds.length) {
        await supabase
          .from('trips')
          .update({ status: 'completed' })
          .in('id', toCompleteIds)
      }

      setTrips(prepared)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function formatDate(date: string | null) {
    if (!date) return ''
    const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    const parsedDate = onlyDate
      ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
      : new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return date
    return parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  function parseTripDate(date: string | null | undefined) {
    if (!date) return null
    const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    const parsed = onlyDate
      ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
      : new Date(date)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.getTime()
  }

  function groupFlightsByTrip(list: FlightSummary[]) {
    const map = new Map<string, FlightSummary[]>()
    list.forEach((flight) => {
      if (!map.has(flight.trip_id)) map.set(flight.trip_id, [])
      map.get(flight.trip_id)!.push(flight)
    })
    return map
  }

  function getLastFlightTime(list: FlightSummary[]) {
    if (!list.length) return null
    let lastTime = -1
    list.forEach((flight) => {
      const time = parseTripDate(flight.arrival_datetime || flight.departure_datetime)
      if (time !== null && time > lastTime) lastTime = time
    })
    return lastTime >= 0 ? lastTime : null
  }

  function getNextTripDate(trip: Trip, flights: FlightSummary[], todayStart: number) {
    const candidates: number[] = []

    const startTime = parseTripDate(trip.start_date)
    if (startTime !== null) candidates.push(startTime)

    flights.forEach((flight) => {
      const depTime = parseTripDate(flight.departure_datetime)
      if (depTime !== null) candidates.push(depTime)
    })

    const upcoming = candidates.filter((time) => time >= todayStart)
    if (!upcoming.length) {
      const endTime = parseTripDate(trip.end_date)
      if (endTime !== null && endTime >= todayStart) return todayStart
      return null
    }
    return Math.min(...upcoming)
  }

  function sortOpenTrips(list: TripWithMeta[]) {
    return [...list].sort((a, b) => {
      if (a.nextDateTime === null && b.nextDateTime === null) return 0
      if (a.nextDateTime === null) return 1
      if (b.nextDateTime === null) return -1
      return a.nextDateTime - b.nextDateTime
    })
  }

  function sortCompletedTrips(list: TripWithMeta[]) {
    return [...list].sort((a, b) => {
      if (a.lastFlightTime === null && b.lastFlightTime === null) return 0
      if (a.lastFlightTime === null) return 1
      if (b.lastFlightTime === null) return -1
      return b.lastFlightTime - a.lastFlightTime
    })
  }

  function getBadgeText(item: TripWithMeta) {
    if (item.isCompleted) return 'Concluida'
    if (item.daysRemaining === null) return 'Sem data'
    if (item.daysRemaining === 0) return 'Hoje'
    if (item.daysRemaining === 1) return 'Falta 1 dia'
    return `Faltam ${item.daysRemaining} dias`
  }

  function getBadgeColor(item: TripWithMeta) {
    if (item.isCompleted) return C.success
    if (item.daysRemaining === null) return C.tertiary
    return C.accent
  }

  const openTrips = sortOpenTrips(trips.filter((trip) => !trip.isCompleted))
  const completedTrips = sortCompletedTrips(trips.filter((trip) => trip.isCompleted))
  const visibleTrips = activeTab === 'open' ? openTrips : completedTrips
  const showLoading = loading && trips.length === 0

  function getReferenceTime(item: TripWithMeta) {
    return activeTab === 'open' ? item.nextDateTime : item.lastFlightTime
  }

  function getDaysBetween(current: TripWithMeta, next?: TripWithMeta) {
    if (!next) return null
    const currentTime = getReferenceTime(current)
    const nextTime = getReferenceTime(next)
    if (currentTime === null || nextTime === null) return null
    return Math.max(0, Math.round(Math.abs(nextTime - currentTime) / MS_PER_DAY))
  }

  function SkeletonList() {
    const shimmer = useRef(new Animated.Value(0)).current

    useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        ])
      )
      animation.start()
      return () => animation.stop()
    }, [shimmer])

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] })

    return (
      <View style={styles.skeletonList}>
        {[0, 1, 2].map((index) => (
          <View key={`skeleton-${index}`} style={styles.card}>
            <Animated.View style={[styles.skeletonImage, { opacity }]} />
            <View style={styles.cardBody}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { opacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonSubtitle, { opacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonDate, { opacity }]} />
            </View>
            <View style={styles.cardOverlay}>
              <Animated.View style={[styles.badge, styles.skeletonBadge, { opacity }]} />
            </View>
          </View>
        ))}
      </View>
    )
  }

  function renderTrip({ item, index }: { item: TripWithMeta, index: number }) {
    const nextItem = visibleTrips[index + 1]
    const daysBetween = isDesktop ? null : getDaysBetween(item, nextItem)
    return (
      <View style={isDesktop && gridColumns > 1 ? { flex: 1, maxWidth: `${100 / gridColumns}%` as any } : undefined}>
        <TouchableOpacity
          style={[styles.card, isDesktop && styles.cardDesktop]}
          activeOpacity={0.92}
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
        >
          {/* Imagem com aspect ratio fixo */}
          <View style={[styles.cardImgWrap, isDesktop && styles.cardImgWrapDesktop]}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cardImgFill} resizeMode="cover" />
            ) : (
              <View style={styles.cardImgPlaceholderInner}>
                <Icon name="flight" size={isDesktop ? 36 : 40} color={C.tertiary} />
              </View>
            )}
            <View style={styles.cardOverlay}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
                <Text style={[styles.badgeText, { color: getBadgeColor(item) }]}>
                  {getBadgeText(item)}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.cardBody, isDesktop && styles.cardBodyDesktop]}>
            <Text style={[styles.cardTitle, isDesktop && styles.cardTitleDesktop]}>{item.title}</Text>
            <Text style={styles.cardDest}>{item.destination}</Text>
            {(item.start_date || item.end_date) && (
              <View style={styles.cardDateRow}>
                <Text style={styles.cardDate}>{formatDate(item.start_date)}</Text>
                <Icon name="arrow-forward" size={12} color={C.tertiary} />
                <Text style={styles.cardDate}>{formatDate(item.end_date)}</Text>
              </View>
            )}
            {item.budget != null && (
              <View style={styles.cardBudgetRow}>
                <View style={styles.cardBudgetTrack}>
                  <View style={[
                    styles.cardBudgetBar,
                    {
                      width: `${Math.min((item.expenseTotal / item.budget) * 100, 100)}%` as any,
                      backgroundColor: item.expenseTotal / item.budget >= 0.9
                        ? C.error
                        : item.expenseTotal / item.budget >= 0.75
                        ? '#FF9500'
                        : C.success,
                    }
                  ]} />
                </View>
                <Text style={styles.cardBudgetText}>
                  {item.budget_currency || 'R$'} {item.expenseTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {item.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        {daysBetween !== null ? (
          <View style={styles.betweenTrips}>
            <Text style={styles.betweenTripsText}>
              Entre as viagens: {daysBetween} {daysBetween === 1 ? 'dia' : 'dias'}
            </Text>
          </View>
        ) : null}
      </View>
    )
  }


  const { isDesktop, gridColumns } = useResponsive()

  return (
    <DesktopLayout>
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: isDesktop ? 32 : 24 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>
            {isDesktop ? 'Minhas Viagens' : `Olá, ${userName}`}
          </Text>
        </View>
        {!isDesktop && (
          <>
            <TouchableOpacity style={styles.statsBtn} onPress={() => router.push('/stats')}>
              <Icon name="bar-chart" size={22} color={C.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        {isDesktop && (
          <TouchableOpacity style={styles.desktopNewBtn} onPress={() => router.push('/new-trip')} activeOpacity={0.85}>
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.desktopNewBtnText}>Nova viagem</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.segment, isDesktop && styles.segmentDesktop]}>
        <TouchableOpacity
          style={[styles.segmentItem, activeTab === 'open' && styles.segmentItemActive]}
          onPress={() => setActiveTab('open')}
          activeOpacity={0.85}
        >
          <Text style={[styles.segmentText, activeTab === 'open' && styles.segmentTextActive]}>
            Em abertas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentItem, activeTab === 'completed' && styles.segmentItemActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.85}
        >
          <Text style={[styles.segmentText, activeTab === 'completed' && styles.segmentTextActive]}>
            Concluidas
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={showLoading ? [] : visibleTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        {...(isDesktop && gridColumns > 1 ? {
          numColumns: gridColumns,
          key: `grid-${gridColumns}`,
          columnWrapperStyle: { gap: 16 },
        } : {})}
        contentContainerStyle={[styles.list, isDesktop && styles.listDesktop, { paddingBottom: 100 + insets.bottom }]}
        ListEmptyComponent={
          showLoading ? (
            <SkeletonList />
          ) : (
            <View style={styles.empty}>
            <Icon name="flight" size={48} color={C.tertiary} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'open' ? 'Nenhuma viagem em aberto' : 'Nenhuma viagem concluida'}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'open' ? 'Crie sua primeira viagem!' : 'Finalize uma viagem para ver aqui.'}
            </Text>
          </View>
          )
        }
      />
      {!isDesktop && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 16 + insets.bottom }]}
          onPress={() => router.push('/new-trip')}
          activeOpacity={0.85}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.primary },
  headerTitleDesktop: { fontSize: 28, fontWeight: '800' },
  desktopNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.buttonPrimary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  desktopNewBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { color: C.accent, fontSize: 18, fontWeight: '600' },
  segment: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentDesktop: { maxWidth: 300 },
  segmentItemActive: { backgroundColor: C.surfaceHigh },
  segmentText: { fontSize: 12, color: C.tertiary, fontWeight: '600' },
  segmentTextActive: { color: C.primary },
  list: { padding: 20, paddingTop: 10 },
  listDesktop: { paddingHorizontal: 24, paddingTop: 16 },
  skeletonList: { paddingTop: 6 },
  card: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  cardDesktop: { borderRadius: 14, borderWidth: 0, marginBottom: 20 },
  cardImgWrap: { width: '100%', aspectRatio: 16 / 10, backgroundColor: C.surfaceHigh, position: 'relative', overflow: 'hidden' },
  cardImgWrapDesktop: { aspectRatio: 4 / 3, borderRadius: 14 },
  cardImgFill: { width: '100%', height: '100%' },
  cardImgPlaceholderInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardOverlay: { position: 'absolute', top: 12, right: 12 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  cardBody: { padding: 14 },
  cardBodyDesktop: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 4 },
  cardTitleDesktop: { fontSize: 15 },
  cardDest: { fontSize: 13, color: C.secondary, marginBottom: 4 },
  cardDate: { fontSize: 12, color: C.tertiary },
  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardBudgetRow: { marginTop: 8, gap: 4 },
  cardBudgetTrack: { height: 4, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  cardBudgetBar: { height: 4, borderRadius: 3 },
  cardBudgetText: { fontSize: 11, color: C.tertiary },
  skeletonImage: { width: '100%', height: 140, backgroundColor: C.surfaceHigh },
  skeletonLine: { height: 10, borderRadius: 6, backgroundColor: C.surfaceHigh, marginBottom: 8 },
  skeletonTitle: { width: '60%', height: 12 },
  skeletonSubtitle: { width: '45%' },
  skeletonDate: { width: '35%' },
  skeletonBadge: { width: 70, height: 18, backgroundColor: C.surfaceHigh },
  betweenTrips: { alignItems: 'center', marginBottom: 12 },
  betweenTripsText: { fontSize: 11, color: C.tertiary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.primary, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: C.secondary, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#FFFFFF' },
})
