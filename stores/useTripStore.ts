import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { offlineQuery } from '../lib/offlineQuery'
import type { Trip, Flight, Accommodation, Expense, ItineraryItem } from '../types'

type TripDetailState = {
  trip: Trip | null
  flights: Flight[]
  accommodations: Accommodation[]
  expenses: Expense[]
  itineraryItems: ItineraryItem[]
  loading: boolean
  error: string | null

  loadAll: (tripId: string) => Promise<void>
  loadTrip: (tripId: string) => Promise<void>
  loadFlights: (tripId: string) => Promise<void>
  loadAccommodations: (tripId: string) => Promise<void>
  loadExpenses: (tripId: string) => Promise<void>
  loadItineraryItems: (tripId: string) => Promise<void>
  reset: () => void
}

const initialState = {
  trip: null,
  flights: [],
  accommodations: [],
  expenses: [],
  itineraryItems: [],
  loading: false,
  error: null as string | null,
}

export const useTripStore = create<TripDetailState>((set, get) => ({
  ...initialState,

  async loadAll(tripId: string) {
    set({ loading: true, error: null })
    const results = await Promise.allSettled([
      get().loadTrip(tripId),
      get().loadFlights(tripId),
      get().loadAccommodations(tripId),
      get().loadExpenses(tripId),
      get().loadItineraryItems(tripId),
    ])
    const failed = results.some(r => r.status === 'rejected')
    if (failed) set({ error: 'Não foi possível carregar todos os dados da viagem.' })
    set({ loading: false })
  },

  async loadTrip(tripId: string) {
    const { data } = await offlineQuery<Trip>(
      `trip:${tripId}`,
      async () => {
        const r = await supabase.from('trips').select('*').eq('id', tripId).single()
        if (r.error) throw r.error
        return r.data
      },
    )
    if (data) set({ trip: data })
  },

  async loadFlights(tripId: string) {
    const { data } = await offlineQuery<Flight[]>(
      `flights:${tripId}`,
      async () => {
        const r = await supabase.from('flights').select('*').eq('trip_id', tripId)
          .order('departure_datetime', { ascending: true })
        if (r.error) throw r.error
        return r.data || []
      },
    )
    if (data) set({ flights: data })
  },

  async loadAccommodations(tripId: string) {
    const { data } = await offlineQuery<Accommodation[]>(
      `accommodations:${tripId}`,
      async () => {
        const r = await supabase.from('accommodations').select('*').eq('trip_id', tripId)
          .order('check_in_date', { ascending: true, nullsFirst: false })
        if (r.error) throw r.error
        return r.data || []
      },
    )
    if (data) set({ accommodations: data })
  },

  async loadExpenses(tripId: string) {
    const { data } = await offlineQuery<Expense[]>(
      `trip_expenses:${tripId}`,
      async () => {
        const r = await supabase.from('expenses').select('*').eq('trip_id', tripId)
          .order('date', { ascending: true })
        if (r.error) throw r.error
        return r.data || []
      },
    )
    if (data) set({ expenses: data })
  },

  async loadItineraryItems(tripId: string) {
    const { data } = await offlineQuery<ItineraryItem[]>(
      `trip_itinerary:${tripId}`,
      async () => {
        const r = await supabase.from('itinerary_items').select('*').eq('trip_id', tripId)
          .order('scheduled_date', { ascending: true })
        if (r.error) throw r.error
        return r.data || []
      },
    )
    if (data) set({ itineraryItems: data })
  },

  reset() {
    set(initialState)
  },
}))
