import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { offlineQuery } from '../lib/offlineQuery'

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

export type TripWithMeta = Trip & {
  nextDateTime: number | null
  daysRemaining: number | null
  isCompleted: boolean
  lastFlightTime: number | null
  expenseTotal: number
}

// ── Helpers puros ──

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

export function sortOpenTrips(list: TripWithMeta[]) {
  return [...list].sort((a, b) => {
    if (a.nextDateTime === null && b.nextDateTime === null) return 0
    if (a.nextDateTime === null) return 1
    if (b.nextDateTime === null) return -1
    return a.nextDateTime - b.nextDateTime
  })
}

export function sortCompletedTrips(list: TripWithMeta[]) {
  return [...list].sort((a, b) => {
    if (a.lastFlightTime === null && b.lastFlightTime === null) return 0
    if (a.lastFlightTime === null) return 1
    if (b.lastFlightTime === null) return -1
    return b.lastFlightTime - a.lastFlightTime
  })
}

export function formatTripDate(date: string | null) {
  if (!date) return ''
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date
  return parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function getBadgeText(item: TripWithMeta) {
  if (item.isCompleted) return 'Concluida'
  if (item.daysRemaining === null) return 'Sem data'
  if (item.daysRemaining === 0) return 'Hoje'
  if (item.daysRemaining === 1) return 'Falta 1 dia'
  return `Faltam ${item.daysRemaining} dias`
}

export function getBadgeTone(item: TripWithMeta): 'success' | 'neutral' | 'brand' {
  if (item.isCompleted) return 'success'
  if (item.daysRemaining === null) return 'neutral'
  return 'brand'
}

export function getDaysBetween(
  current: TripWithMeta,
  next: TripWithMeta | undefined,
  mode: 'open' | 'completed',
) {
  if (!next) return null
  const currentTime = mode === 'open' ? current.nextDateTime : current.lastFlightTime
  const nextTime = mode === 'open' ? next.nextDateTime : next.lastFlightTime
  if (currentTime === null || nextTime === null) return null
  return Math.max(0, Math.round(Math.abs(nextTime - currentTime) / MS_PER_DAY))
}

// ── Hook principal ──

export function useHomeData() {
  const [trips, setTrips] = useState<TripWithMeta[]>([])
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
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

      const { data: cachedTrips } = await offlineQuery<TripWithMeta[]>(
        'home:trips',
        async () => {
          const { data, error: tripsError } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false })
          if (tripsError) throw tripsError

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

          return prepared
        },
      )

      if (cachedTrips) setTrips(cachedTrips)
    } catch {
      setError('Erro ao carregar viagens.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => { loadData() }, [loadData])
  )

  return { trips, userName, avatarUrl, loading, error, reload: loadData }
}
