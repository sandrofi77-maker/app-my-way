import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Trip, Flight, Accommodation, Expense, ItineraryItem } from '../types'

type TripDetailState = {
  trip: Trip | null
  flights: Flight[]
  accommodations: Accommodation[]
  expenses: Expense[]
  itineraryItems: ItineraryItem[]
  loading: boolean

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
}

export const useTripStore = create<TripDetailState>((set, get) => ({
  ...initialState,

  async loadAll(tripId: string) {
    set({ loading: true })
    await Promise.all([
      get().loadTrip(tripId),
      get().loadFlights(tripId),
      get().loadAccommodations(tripId),
      get().loadExpenses(tripId),
      get().loadItineraryItems(tripId),
    ])
    set({ loading: false })
  },

  async loadTrip(tripId: string) {
    const { data, error } = await supabase
      .from('trips').select('*').eq('id', tripId).single()
    if (!error && data) set({ trip: data })
  },

  async loadFlights(tripId: string) {
    const { data, error } = await supabase
      .from('flights').select('*').eq('trip_id', tripId)
      .order('departure_datetime', { ascending: true })
    if (!error) set({ flights: data || [] })
  },

  async loadAccommodations(tripId: string) {
    const { data, error } = await supabase
      .from('accommodations').select('*').eq('trip_id', tripId)
      .order('check_in_date', { ascending: true, nullsFirst: false })
    if (!error) set({ accommodations: data || [] })
  },

  async loadExpenses(tripId: string) {
    const { data, error } = await supabase
      .from('expenses').select('*').eq('trip_id', tripId)
      .order('date', { ascending: true })
    if (!error) set({ expenses: data || [] })
  },

  async loadItineraryItems(tripId: string) {
    const { data, error } = await supabase
      .from('itinerary_items').select('*').eq('trip_id', tripId)
      .order('scheduled_date', { ascending: true })
    if (!error) set({ itineraryItems: data || [] })
  },

  reset() {
    set(initialState)
  },
}))
