import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Animated, Platform
} from 'react-native'
import Icon from '../../components/Icon'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'
import DesktopLayout from '../../components/DesktopLayout'
import { useResponsive } from '../../hooks/useResponsive'
import { formatBRL } from '../../lib/currency'
import NewTripSheet from '../../components/NewTripSheet'

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
  const [showNewTrip, setShowNewTrip] = useState(false)
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
    const budgetRatio = item.budget ? item.expenseTotal / item.budget : 0
    const budgetColor = budgetRatio >= 0.9 ? C.error : budgetRatio >= 0.75 ? '#FF9500' : C.success
    const budgetPct = Math.round(Math.min(budgetRatio * 100, 100))

    if (isDesktop) {
      return (
        <TouchableOpacity
          style={styles.cardDesktop}
          activeOpacity={0.92}
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
        >
          {/* Imagem lateral */}
          <View style={styles.cardImgWrapDesktop}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cardImgFill} resizeMode="cover" />
            ) : (
              <View style={styles.cardImgPlaceholderInner}>
                <Icon name="flight" size={44} color={C.tertiary} />
              </View>
            )}
            <View style={styles.cardOverlayDesktop}>
              <View style={[styles.badge, { backgroundColor: getBadgeColor(item) }]}>
                <Text style={styles.badgeText}>{getBadgeText(item)}</Text>
              </View>
            </View>
          </View>

          {/* Conteúdo */}
          <View style={styles.cardBodyDesktop}>
            <View style={styles.cardBodyTop}>
              <Text style={styles.cardDestDesktop} numberOfLines={1}>{item.destination}</Text>
              <Text style={styles.cardTitleDesktop} numberOfLines={1}>{item.title}</Text>
            </View>

            {(item.start_date || item.end_date) && (
              <View style={styles.cardDateRow}>
                <Icon name="event" size={16} color={C.tertiary} />
                <Text style={styles.cardDateDesktop}>
                  {formatDate(item.start_date)}
                  {item.end_date ? ` — ${formatDate(item.end_date)}` : ''}
                </Text>
              </View>
            )}

            {/* Separador */}
            {item.budget != null && <View style={styles.cardDivider} />}

            {/* Gastos */}
            {item.budget != null && (
              <View style={styles.cardBudgetDesktop}>
                <View style={styles.cardBudgetHeaderDesktop}>
                  <View style={styles.cardBudgetLabelRow}>
                    <Icon name="payments" size={15} color={C.tertiary} />
                    <Text style={styles.cardBudgetLabel}>Gastos</Text>
                  </View>
                  <View style={styles.cardBudgetPctBadge}>
                    <Text style={[styles.cardBudgetPctText, { color: budgetColor }]}>{budgetPct}%</Text>
                  </View>
                </View>
                <View style={styles.cardBudgetAmountsDesktop}>
                  <Text style={[styles.cardBudgetSpentDesktop, { color: budgetColor }]}>
                    {item.budget_currency || 'R$'} {formatBRL(item.expenseTotal)}
                  </Text>
                  <Text style={styles.cardBudgetTotalDesktop}>
                    {' '}de {item.budget_currency || 'R$'} {formatBRL(item.budget)}
                  </Text>
                </View>
                <View style={styles.cardBudgetTrackDesktop}>
                  <View style={[styles.cardBudgetBarDesktop, { width: `${budgetPct}%` as any, backgroundColor: budgetColor }]} />
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <View>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.92}
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
        >
          {/* Imagem */}
          <View style={styles.cardImgWrap}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cardImgFill} resizeMode="cover" />
            ) : (
              <View style={styles.cardImgPlaceholderInner}>
                <Icon name="flight" size={44} color={C.tertiary} />
              </View>
            )}
            {/* Badge status */}
            <View style={styles.cardOverlay}>
              <View style={[styles.badge, { backgroundColor: getBadgeColor(item) }]}>
                <Text style={styles.badgeText}>{getBadgeText(item)}</Text>
              </View>
            </View>
          </View>

          {/* Conteúdo */}
          <View style={styles.cardBody}>
            <Text style={styles.cardDest} numberOfLines={1}>{item.destination}</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

            {(item.start_date || item.end_date) && (
              <View style={styles.cardDateRow}>
                <Icon name="event" size={14} color={C.tertiary} />
                <Text style={styles.cardDate}>
                  {formatDate(item.start_date)}
                  {item.end_date ? ` — ${formatDate(item.end_date)}` : ''}
                </Text>
              </View>
            )}

            {item.budget != null && (
              <View style={styles.cardBudgetRow}>
                <View style={styles.cardBudgetInfo}>
                  <Text style={styles.cardBudgetSpent}>
                    {item.budget_currency || 'R$'} {formatBRL(item.expenseTotal)}
                  </Text>
                  <Text style={styles.cardBudgetTotal}>
                    {' '}/ {formatBRL(item.budget)}
                  </Text>
                </View>
                <View style={styles.cardBudgetTrack}>
                  <View style={[
                    styles.cardBudgetBar,
                    { width: `${Math.min(budgetRatio * 100, 100)}%` as any, backgroundColor: budgetColor }
                  ]} />
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
        {daysBetween !== null ? (
          <View style={styles.betweenTrips}>
            <Text style={styles.betweenTripsText}>
              {daysBetween} {daysBetween === 1 ? 'dia' : 'dias'} entre viagens
            </Text>
          </View>
        ) : null}
      </View>
    )
  }


  const { isDesktop } = useResponsive()

  const Wrapper = isDesktop ? View : ScrollView

  const content = (
    <>
      <View style={[styles.header, { paddingTop: isDesktop ? 16 : 24 }]}>
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
          <TouchableOpacity style={styles.desktopNewBtn} onPress={() => setShowNewTrip(true)} activeOpacity={0.85}>
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
            Viagens planejadas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentItem, activeTab === 'completed' && styles.segmentItemActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.85}
        >
          <Text style={[styles.segmentText, activeTab === 'completed' && styles.segmentTextActive]}>
            Viagens concluídas
          </Text>
        </TouchableOpacity>
      </View>

      {showLoading ? (
        <SkeletonList />
      ) : visibleTrips.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="flight" size={48} color={C.tertiary} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'open' ? 'Nenhuma viagem em aberto' : 'Nenhuma viagem concluida'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'open' ? 'Crie sua primeira viagem!' : 'Finalize uma viagem para ver aqui.'}
          </Text>
        </View>
      ) : (
        visibleTrips.map((item, index) => (
          <View key={item.id}>{renderTrip({ item, index })}</View>
        ))
      )}
    </>
  )

  return (
    <DesktopLayout>
    <Wrapper
      style={styles.container}
      {...(!isDesktop && { contentContainerStyle: [styles.list, { paddingBottom: 100 + insets.bottom, paddingTop: insets.top }] })}
      {...(isDesktop && { style: [styles.container, styles.list, styles.listDesktop] })}
    >
      {content}
    </Wrapper>
    {!isDesktop && (
      <TouchableOpacity
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => setShowNewTrip(true)}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    )}
    <NewTripSheet
      visible={showNewTrip}
      onClose={() => setShowNewTrip(false)}
      onCreated={() => { setShowNewTrip(false); loadData() }}
    />
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.primary },
  headerTitleDesktop: { fontSize: 28, fontWeight: '800' },
  desktopNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.buttonPrimary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  desktopNewBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { color: C.accent, fontSize: 18, fontWeight: '600' },
  segment: { flexDirection: 'row', marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentDesktop: { maxWidth: 300 },
  segmentItemActive: { backgroundColor: C.surfaceHigh },
  segmentText: { fontSize: 12, color: C.tertiary, fontWeight: '600' },
  segmentTextActive: { color: C.primary },
  list: { paddingHorizontal: 20, paddingTop: 0 },
  listDesktop: { paddingHorizontal: 0, paddingTop: 16 },
  skeletonList: { paddingTop: 6 },

  /* ── Card Mobile ── */
  card: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 20, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }, android: { elevation: 3 }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 } }) },
  cardImgWrap: { width: '100%', aspectRatio: 3 / 2, backgroundColor: C.surfaceHigh, position: 'relative', overflow: 'hidden' },
  cardImgFill: { width: '100%', height: '100%' },
  cardImgPlaceholderInner: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECECF0' },
  cardOverlay: { position: 'absolute', top: 14, left: 14 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  cardBody: { padding: 16, paddingTop: 14, gap: 4 },
  cardDest: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: C.secondary },
  cardDate: { fontSize: 13, color: C.tertiary, fontWeight: '500' },
  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardBudgetRow: { marginTop: 10, gap: 6 },
  cardBudgetInfo: { flexDirection: 'row', alignItems: 'baseline' },
  cardBudgetSpent: { fontSize: 15, fontWeight: '700', color: C.primary },
  cardBudgetTotal: { fontSize: 13, fontWeight: '500', color: C.tertiary },
  cardBudgetTrack: { height: 5, backgroundColor: '#ECECF0', borderRadius: 4, overflow: 'hidden' },
  cardBudgetBar: { height: 5, borderRadius: 4 },

  /* ── Card Desktop (horizontal, 1 por linha) ── */
  cardDesktop: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 220,
    ...Platform.select({
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 14 },
    }),
  },
  cardImgWrapDesktop: {
    width: 340,
    flexShrink: 0,
    backgroundColor: '#ECECF0',
    position: 'relative',
    overflow: 'hidden',
  },
  cardOverlayDesktop: { position: 'absolute', top: 16, left: 16 },
  cardBodyDesktop: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  cardBodyTop: { gap: 6, marginBottom: 10 },
  cardDestDesktop: { fontSize: 26, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  cardTitleDesktop: { fontSize: 16, fontWeight: '500', color: C.secondary },
  cardDateDesktop: { fontSize: 15, color: C.tertiary, fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },

  /* Gastos desktop */
  cardBudgetDesktop: { gap: 8 },
  cardBudgetHeaderDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBudgetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardBudgetLabel: { fontSize: 13, fontWeight: '600', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBudgetPctBadge: { backgroundColor: C.surfaceHigh, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  cardBudgetPctText: { fontSize: 13, fontWeight: '700' },
  cardBudgetAmountsDesktop: { flexDirection: 'row', alignItems: 'baseline', gap: 0 },
  cardBudgetSpentDesktop: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  cardBudgetTotalDesktop: { fontSize: 15, fontWeight: '500', color: C.tertiary },
  cardBudgetTrackDesktop: { height: 7, backgroundColor: '#ECECF0', borderRadius: 6, overflow: 'hidden' },
  cardBudgetBarDesktop: { height: 7, borderRadius: 6 },
  skeletonImage: { width: '100%', aspectRatio: 3 / 2, backgroundColor: '#ECECF0' },
  skeletonLine: { height: 10, borderRadius: 6, backgroundColor: '#ECECF0', marginBottom: 8 },
  skeletonTitle: { width: '55%', height: 16 },
  skeletonSubtitle: { width: '40%', height: 12 },
  skeletonDate: { width: '35%' },
  skeletonBadge: { width: 80, height: 22, backgroundColor: '#ECECF0', borderRadius: 20 },
  betweenTrips: { alignItems: 'center', marginBottom: 16, marginTop: -4 },
  betweenTripsText: { fontSize: 11, color: C.tertiary, fontWeight: '500', backgroundColor: C.background, paddingHorizontal: 12 },
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
