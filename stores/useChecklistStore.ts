import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { offlineQuery } from '../lib/offlineQuery'
import { useNetworkStore } from '../lib/network'
import { enqueue } from '../lib/mutationQueue'
import type { ChecklistItem } from '../types'

type ChecklistState = {
  items: ChecklistItem[]
  userId: string | null
  loading: boolean

  loadItems: (tripId: string) => Promise<void>
  toggleItem: (item: ChecklistItem) => Promise<{ error: string | null }>
  deleteItem: (itemId: string) => Promise<{ error: string | null }>
  addItem: (tripId: string, title: string, category: string) => Promise<{ error: string | null; data: ChecklistItem | null }>
  addTemplate: (tripId: string, categoryKey: string, templateTitles: string[]) => Promise<{ error: string | null; alreadyExists: boolean }>
  reset: () => void
}

const initialState = {
  items: [] as ChecklistItem[],
  userId: null as string | null,
  loading: false,
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  ...initialState,

  async loadItems(tripId: string) {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }
    set({ userId: user.id })

    const { data } = await offlineQuery<ChecklistItem[]>(
      `checklist:${tripId}:${user.id}`,
      async () => {
        const r = await supabase
          .from('trip_checklists').select('*')
          .eq('trip_id', tripId).eq('user_id', user.id)
          .order('created_at', { ascending: true })
        if (r.error) throw r.error
        return (r.data || []) as ChecklistItem[]
      },
    )

    if (data) set({ items: data })
    set({ loading: false })
  },

  async toggleItem(item: ChecklistItem) {
    // Optimistic update
    const prev = get().items
    set({ items: prev.map(i => i.id === item.id ? { ...i, is_done: !i.is_done } : i) })

    if (!useNetworkStore.getState().isOnline) {
      await enqueue('checklist', 'toggle', [item.id, !item.is_done])
      return { error: null }
    }

    const { error } = await supabase.from('trip_checklists').update({ is_done: !item.is_done }).eq('id', item.id)
    if (error) {
      set({ items: prev }) // rollback
      return { error: error.message }
    }
    return { error: null }
  },

  async deleteItem(itemId: string) {
    // Optimistic delete
    const prev = get().items
    set({ items: prev.filter(i => i.id !== itemId) })

    if (!useNetworkStore.getState().isOnline) {
      await enqueue('checklist', 'delete', [itemId])
      return { error: null }
    }

    const { error } = await supabase.from('trip_checklists').delete().eq('id', itemId)
    if (error) {
      set({ items: prev }) // rollback
      return { error: error.message }
    }
    return { error: null }
  },

  async addItem(tripId: string, title: string, category: string) {
    const userId = get().userId
    if (!userId) return { error: 'Sessão expirada', data: null }

    const row = { trip_id: tripId, user_id: userId, title, category, is_done: false }

    if (!useNetworkStore.getState().isOnline) {
      // Optimistic: cria item local com id temporario
      const tempItem = { ...row, id: 'temp_' + Date.now(), created_at: new Date().toISOString() } as unknown as ChecklistItem
      set({ items: [...get().items, tempItem] })
      await enqueue('checklist', 'addItem', [tripId, userId, title, category])
      return { error: null, data: tempItem }
    }

    const { data, error } = await supabase.from('trip_checklists').insert(row).select().single()
    if (error) return { error: error.message, data: null }
    if (data) set({ items: [...get().items, data as ChecklistItem] })
    return { error: null, data: data as ChecklistItem }
  },

  async addTemplate(tripId: string, categoryKey: string, templateTitles: string[]) {
    const userId = get().userId
    if (!userId) return { error: 'Sessão expirada', alreadyExists: false }

    const existingTitles = new Set(get().items.map(i => i.title.toLowerCase()))
    const toInsert = templateTitles
      .filter(t => !existingTitles.has(t.toLowerCase()))
      .map(title => ({ trip_id: tripId, user_id: userId, title, category: categoryKey, is_done: false }))

    if (!toInsert.length) return { error: null, alreadyExists: true }

    if (!useNetworkStore.getState().isOnline) {
      const tempItems = toInsert.map((row, i) => ({
        ...row, id: 'temp_' + Date.now() + '_' + i, created_at: new Date().toISOString(),
      })) as unknown as ChecklistItem[]
      set({ items: [...get().items, ...tempItems] })
      await enqueue('checklist', 'addTemplate', [tripId, userId, categoryKey, templateTitles])
      return { error: null, alreadyExists: false }
    }

    const { data, error } = await supabase.from('trip_checklists').insert(toInsert).select()
    if (error) return { error: error.message, alreadyExists: false }
    if (data) set({ items: [...get().items, ...(data as ChecklistItem[])] })
    return { error: null, alreadyExists: false }
  },

  reset() {
    set(initialState)
  },
}))

// Executor para o mutationQueue
export async function checklistExecutor(action: string, args: unknown[]): Promise<void> {
  if (action === 'toggle') {
    const [itemId, isDone] = args as [string, boolean]
    const { error } = await supabase.from('trip_checklists').update({ is_done: isDone }).eq('id', itemId)
    if (error) throw error
  } else if (action === 'delete') {
    const [itemId] = args as [string]
    const { error } = await supabase.from('trip_checklists').delete().eq('id', itemId)
    if (error) throw error
  } else if (action === 'addItem') {
    const [tripId, userId, title, category] = args as [string, string, string, string]
    const { error } = await supabase.from('trip_checklists').insert({
      trip_id: tripId, user_id: userId, title, category, is_done: false,
    })
    if (error) throw error
  } else if (action === 'addTemplate') {
    const [tripId, userId, categoryKey, templateTitles] = args as [string, string, string, string[]]
    const rows = templateTitles.map(title => ({
      trip_id: tripId, user_id: userId, title, category: categoryKey, is_done: false,
    }))
    const { error } = await supabase.from('trip_checklists').insert(rows)
    if (error) throw error
  }
}
