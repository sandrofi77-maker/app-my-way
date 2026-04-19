import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { offlineQuery } from '../lib/offlineQuery'
import { useNetworkStore } from '../lib/network'
import { enqueue } from '../lib/mutationQueue'
import type { ItineraryItem } from '../types'

type ItineraryState = {
  items: ItineraryItem[]
  loading: boolean

  loadItems: (tripId: string) => Promise<void>
  saveItem: (tripId: string, data: Record<string, unknown>, editingId?: string | null) => Promise<{ error: string | null }>
  deleteItem: (itemId: string, tripId: string) => Promise<{ error: string | null }>
  reset: () => void
}

const initialState = {
  items: [],
  loading: false,
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  ...initialState,

  async loadItems(tripId: string) {
    set({ loading: true })
    const { data } = await offlineQuery<ItineraryItem[]>(
      `itinerary:${tripId}`,
      async () => {
        const r = await supabase
          .from('itinerary_items').select('*').eq('trip_id', tripId)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
        if (r.error) throw r.error
        return r.data || []
      },
    )
    if (data) set({ items: data })
    set({ loading: false })
  },

  async saveItem(tripId, payload, editingId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão expirada' }

    const row = { ...payload, trip_id: tripId, user_id: user.id }

    // Optimistic update para edicao
    const prev = get().items
    if (editingId) {
      set({ items: prev.map(i => i.id === editingId ? { ...i, ...payload } as ItineraryItem : i) })
    }

    if (!useNetworkStore.getState().isOnline) {
      await enqueue('itinerary', editingId ? 'update' : 'insert', [tripId, row, editingId])
      return { error: null }
    }

    const request = editingId
      ? supabase.from('itinerary_items').update(row).eq('id', editingId)
      : supabase.from('itinerary_items').insert(row)

    const { error } = await request
    if (error) {
      if (editingId) set({ items: prev }) // rollback
      return { error: error.message }
    }

    await get().loadItems(tripId)
    return { error: null }
  },

  async deleteItem(itemId, tripId) {
    // Optimistic delete
    const prev = get().items
    set({ items: prev.filter(i => i.id !== itemId) })

    if (!useNetworkStore.getState().isOnline) {
      await enqueue('itinerary', 'delete', [itemId, tripId])
      return { error: null }
    }

    const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)
    if (error) {
      set({ items: prev }) // rollback
      return { error: error.message }
    }
    return { error: null }
  },

  reset() {
    set(initialState)
  },
}))

// Executor para o mutationQueue
export async function itineraryExecutor(action: string, args: unknown[]): Promise<void> {
  if (action === 'insert' || action === 'update') {
    const [, row, editingId] = args as [string, Record<string, unknown>, string | null]
    const request = editingId
      ? supabase.from('itinerary_items').update(row).eq('id', editingId)
      : supabase.from('itinerary_items').insert(row)
    const { error } = await request
    if (error) throw error
  } else if (action === 'delete') {
    const [itemId] = args as [string]
    const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)
    if (error) throw error
  }
}
