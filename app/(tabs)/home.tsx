import {
  View, ScrollView, Image, Animated, Platform, StyleSheet
} from 'react-native'
import Icon from '../../components/Icon'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import DesktopLayout from '../../components/DesktopLayout'
import { useResponsive } from '../../hooks/useResponsive'
import { formatBRL } from '../../lib/currency'
import NewTripSheet from '../../components/NewTripSheet'
import {
  Box, Text, HStack, VStack, Card, Badge, Button, Pressable,
  Skeleton, EmptyState, FAB, Avatar, useTheme, IconButton,
} from '../../design-system'

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
  const theme = useTheme()
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
        return { ...trip, nextDateTime, daysRemaining, isCompleted, lastFlightTime, expenseTotal: expenseTotals.get(trip.id) || 0 }
      })

      if (toCompleteIds.length) {
        await supabase.from('trips').update({ status: 'completed' }).in('id', toCompleteIds)
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

  function getBadgeTone(item: TripWithMeta): 'success' | 'neutral' | 'brand' {
    if (item.isCompleted) return 'success'
    if (item.daysRemaining === null) return 'neutral'
    return 'brand'
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
    return (
      <VStack gap={5} mt={2}>
        {[0, 1, 2].map((i) => (
          <Card key={`sk-${i}`} variant="elevated">
            <Skeleton width="100%" height={180} borderRadius="none" />
            <VStack gap={2} p={4}>
              <Skeleton width="55%" height={18} />
              <Skeleton width="40%" height={14} />
              <Skeleton width="35%" height={12} />
            </VStack>
          </Card>
        ))}
      </VStack>
    )
  }

  function renderTrip({ item, index }: { item: TripWithMeta, index: number }) {
    const nextItem = visibleTrips[index + 1]
    const daysBetween = isDesktop ? null : getDaysBetween(item, nextItem)
    const budgetRatio = item.budget ? item.expenseTotal / item.budget : 0
    const budgetColor = budgetRatio >= 0.9 ? theme.colors.error : budgetRatio >= 0.75 ? '#FF9500' : theme.colors.success
    const budgetPct = Math.round(Math.min(budgetRatio * 100, 100))
    const currencyLabel = item.budget_currency || 'R$'
    const remainingAmount = Math.max((item.budget || 0) - item.expenseTotal, 0)
    const exceededAmount = Math.max(item.expenseTotal - (item.budget || 0), 0)
    const remainingLabel = exceededAmount > 0
      ? `${currencyLabel} ${formatBRL(exceededAmount)} excedido`
      : `${currencyLabel} ${formatBRL(remainingAmount)} restante`

    const budgetPanel = item.budget != null ? (
      <View style={styles.budgetPanel}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text variant={isDesktop ? 'body' : 'bodySmall'} weight="600" color="textSecondary">Orçamento da viagem</Text>
        </HStack>

        <HStack mt={3} gap={isDesktop ? 6 : 4}>
          <VStack gap={0.5} flex={1}>
            <Text variant="overline" color="textTertiary">GASTO</Text>
            <Text variant={isDesktop ? 'title' : 'body'} weight="700" style={{ color: budgetColor }}>
              {currencyLabel} {formatBRL(item.expenseTotal)}
            </Text>
          </VStack>
          <VStack gap={0.5} flex={1} alignItems="flex-end">
            <Text variant="overline" color="textTertiary">PLANEJADO</Text>
            <Text variant={isDesktop ? 'title' : 'body'} weight="700">
              {currencyLabel} {formatBRL(item.budget)}
            </Text>
          </VStack>
        </HStack>

        <View style={styles.budgetTrack}>
          <View style={[styles.budgetBar, { width: `${budgetPct}%` as any, backgroundColor: budgetColor }]} />
        </View>

        <HStack justifyContent="space-between" alignItems="center" mt={1.5}>
          <Text variant="caption" weight="600" color="textTertiary">{budgetPct}% consumido</Text>
          <Text variant="caption" weight="600" color="textTertiary">{remainingLabel}</Text>
        </HStack>
      </View>
    ) : null

    if (isDesktop) {
      return (
        <Pressable
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
          style={styles.cardDesktop}
          hoveredStyle={{ opacity: 0.95 }}
        >
          <View style={styles.cardImgWrapDesktop}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cardImgFill} resizeMode="cover" />
            ) : (
              <Box flex={1} alignItems="center" justifyContent="center" bg="surfaceHigh">
                <Icon name="flight" size={44} color={theme.colors.textTertiary} />
              </Box>
            )}
            <Box position="absolute" top={16} left={16}>
              <Badge tone={getBadgeTone(item)} variant="solid" size="sm">
                {getBadgeText(item)}
              </Badge>
            </Box>
          </View>

          <VStack flex={1} px={7} py={6} gap={3}>
            <VStack gap={1.5}>
              <Text variant="h2" weight="800" numberOfLines={1}>{item.destination}</Text>
              <Text variant="body" color="textSecondary" numberOfLines={1}>{item.title}</Text>
            </VStack>

            {(item.start_date || item.end_date) && (
              <HStack gap={1.5} alignItems="center">
                <Icon name="event" size={18} color={theme.colors.brand} />
                <Text variant="title" weight="600" color="textSecondary">
                  {formatDate(item.start_date)}
                  {item.end_date ? ` \u2014 ${formatDate(item.end_date)}` : ''}
                </Text>
              </HStack>
            )}

            {budgetPanel}
          </VStack>
        </Pressable>
      )
    }

    return (
      <View>
        <Pressable
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
          style={[styles.card, theme.shadows.sm]}
        >
          <View style={styles.cardImgWrap}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.cardImgFill} resizeMode="cover" />
            ) : (
              <Box flex={1} alignItems="center" justifyContent="center" bg="surfaceHigh">
                <Icon name="flight" size={44} color={theme.colors.textTertiary} />
              </Box>
            )}
            <Box position="absolute" top={14} left={14}>
              <Badge tone={getBadgeTone(item)} variant="solid" size="sm">
                {getBadgeText(item)}
              </Badge>
            </Box>
          </View>

          <VStack gap={1.5} p={4} pt={3.5}>
            <Text variant="h3" weight="800" numberOfLines={1}>{item.destination}</Text>
            <Text variant="body" color="textSecondary" numberOfLines={1}>{item.title}</Text>

            {(item.start_date || item.end_date) && (
              <HStack gap={1.5} alignItems="center" mt={1.5}>
                <Icon name="event" size={16} color={theme.colors.brand} />
                <Text variant="bodySmall" weight="600" color="textSecondary">
                  {formatDate(item.start_date)}
                  {item.end_date ? ` \u2014 ${formatDate(item.end_date)}` : ''}
                </Text>
              </HStack>
            )}

            {budgetPanel}
          </VStack>
        </Pressable>
        {daysBetween !== null && (
          <Box alignItems="center" mb={4} mt={0} style={{ marginTop: -4 }}>
            <Text variant="caption" color="textTertiary" style={{ backgroundColor: theme.colors.background, paddingHorizontal: 12 }}>
              {daysBetween} {daysBetween === 1 ? 'dia' : 'dias'} entre viagens
            </Text>
          </Box>
        )}
      </View>
    )
  }

  const { isDesktop } = useResponsive()
  const Wrapper = isDesktop ? View : ScrollView

  const content = (
    <>
      <HStack py={isDesktop ? 4 : 6} alignItems="center">
        <Box flex={1}>
          <Text variant={isDesktop ? 'h2' : 'h3'}>
            {isDesktop ? 'Minhas Viagens' : `Ola, ${userName}`}
          </Text>
        </Box>
        {!isDesktop && (
          <HStack gap={2.5}>
            <IconButton
              accessibilityLabel="Estatisticas"
              onPress={() => router.push('/stats')}
              variant="outline"
            >
              <Icon name="bar-chart" size={22} color={theme.colors.text} />
            </IconButton>
            <Pressable onPress={() => router.push('/profile')}>
              <Avatar
                source={avatarUrl ? { uri: avatarUrl } : null}
                name={userName}
                size="md"
              />
            </Pressable>
          </HStack>
        )}
        {isDesktop && (
          <Button
            variant="primary"
            leftIcon={<Icon name="add" size={18} color="#fff" />}
            onPress={() => setShowNewTrip(true)}
          >
            Nova viagem
          </Button>
        )}
      </HStack>

      {/* Segment control */}
      <Box
        bg="surface" borderRadius="xl" borderWidth={0.5} borderColor="border"
        p={1} mb={2.5} flexDirection="row"
        maxWidth={isDesktop ? 300 : undefined}
      >
        {(['open', 'completed'] as const).map(tab => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.radius.lg,
              backgroundColor: activeTab === tab ? theme.colors.surfaceHigh : 'transparent',
            }}
          >
            <Text
              variant="caption" weight="600"
              color={activeTab === tab ? 'text' : 'textTertiary'}
            >
              {tab === 'open' ? 'Viagens planejadas' : 'Viagens concluidas'}
            </Text>
          </Pressable>
        ))}
      </Box>

      {showLoading ? (
        <SkeletonList />
      ) : visibleTrips.length === 0 ? (
        <Box mt={20}>
          <EmptyState
            icon={<Icon name="flight" size={48} color={theme.colors.textTertiary} />}
            title={activeTab === 'open' ? 'Nenhuma viagem em aberto' : 'Nenhuma viagem concluida'}
            description={activeTab === 'open' ? 'Crie sua primeira viagem!' : 'Finalize uma viagem para ver aqui.'}
          />
        </Box>
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
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        {...(!isDesktop && { contentContainerStyle: { paddingHorizontal: 20, paddingBottom: 100 + insets.bottom, paddingTop: insets.top } })}
        {...(isDesktop && { style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 16 } })}
      >
        {content}
      </Wrapper>
      {!isDesktop && (
        <FAB
          accessibilityLabel="Nova viagem"
          onPress={() => setShowNewTrip(true)}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </FAB>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 22,
    overflow: 'hidden',
  },
  cardImgWrap: { width: '100%', aspectRatio: 16 / 10, position: 'relative', overflow: 'hidden' },
  cardImgFill: { width: '100%', height: '100%' },
  cardDesktop: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 22,
    overflow: 'hidden',
    minHeight: 260,
    ...Platform.select({
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 18 },
    }),
  },
  cardImgWrapDesktop: {
    width: 360,
    flexShrink: 0,
    position: 'relative', overflow: 'hidden',
  },
  budgetPanel: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 2,
  },
  budgetTrack: {
    height: 6,
    backgroundColor: '#E9EDF3',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  budgetBar: { height: 6, borderRadius: 999 },
})
