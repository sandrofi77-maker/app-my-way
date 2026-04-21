import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { offlineQuery } from '../lib/offlineQuery'
import { useNetworkStore } from '../lib/network'
import { enqueue } from '../lib/mutationQueue'
import { invalidateByPrefix } from '../lib/cache'
import type { Expense, ExpenseSplit } from '../types'

type ExpenseState = {
  expenses: Expense[]
  budget: number | null
  budgetCurrency: string | null
  loading: boolean

  loadExpenses: (tripId: string) => Promise<void>
  loadBudget: (tripId: string) => Promise<void>
  loadAll: (tripId: string) => Promise<void>
  saveExpense: (tripId: string, data: Record<string, unknown>, editingId?: string | null) => Promise<{ error: string | null }>
  saveExpenseWithSplit: (
    tripId: string,
    expense: Record<string, unknown>,
    splits: Array<Pick<ExpenseSplit, 'member_user_id' | 'member_email' | 'amount' | 'notes'>>,
    editingId?: string | null
  ) => Promise<{ error: string | null }>
  deleteExpense: (expenseId: string, tripId: string) => Promise<{ error: string | null }>
  reset: () => void
}

const initialState = {
  expenses: [],
  budget: null,
  budgetCurrency: null,
  loading: false,
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  ...initialState,

  async loadAll(tripId: string) {
    set({ loading: true })
    await Promise.all([
      get().loadExpenses(tripId),
      get().loadBudget(tripId),
    ])
    set({ loading: false })
  },

  async loadExpenses(tripId: string) {
    const { data } = await offlineQuery<Expense[]>(
      `expenses:${tripId}`,
      async () => {
        const r = await supabase
          .from('expenses').select('*').eq('trip_id', tripId)
          .order('created_at', { ascending: false })
        if (r.error) throw r.error
        return r.data || []
      },
    )
    if (data) set({ expenses: data })
  },

  async loadBudget(tripId: string) {
    const { data } = await offlineQuery<{ budget: number | null; budget_currency: string | null }>(
      `budget:${tripId}`,
      async () => {
        const r = await supabase
          .from('trips').select('budget, budget_currency').eq('id', tripId).single()
        if (r.error) throw r.error
        return r.data
      },
    )
    if (data) set({
      budget: data.budget ?? null,
      budgetCurrency: data.budget_currency ?? null,
    })
  },

  async saveExpense(tripId, payload, editingId) {
    const { data: { user } } = await supabase.auth.getUser()
    const row = { ...payload, trip_id: tripId, user_id: user?.id }

    // Optimistic update para edicao
    const prev = get().expenses
    if (editingId) {
      set({ expenses: prev.map(e => e.id === editingId ? { ...e, ...payload } as Expense : e) })
    }

    if (!useNetworkStore.getState().isOnline) {
      await enqueue('expense', editingId ? 'update' : 'insert', [tripId, row, editingId])
      return { error: null }
    }

    const request = editingId
      ? supabase.from('expenses').update(row).eq('id', editingId)
      : supabase.from('expenses').insert(row)

    const { error } = await request
    if (error) {
      if (editingId) set({ expenses: prev }) // rollback
      return { error: error.message }
    }

    await Promise.all([
      get().loadExpenses(tripId),
      invalidateByPrefix('home'),
    ])
    return { error: null }
  },

  async deleteExpense(expenseId, tripId) {
    // Optimistic delete
    const prev = get().expenses
    set({ expenses: prev.filter(e => e.id !== expenseId) })

    if (!useNetworkStore.getState().isOnline) {
      await enqueue('expense', 'delete', [expenseId, tripId])
      return { error: null }
    }

    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (error) {
      set({ expenses: prev }) // rollback
      return { error: error.message }
    }
    invalidateByPrefix('home')
    return { error: null }
  },

  async saveExpenseWithSplit(tripId, expense, splits, editingId) {
    if (!useNetworkStore.getState().isOnline) {
      return { error: 'Split de despesas requer conexao para salvar.' }
    }

    const payloadSplits = splits
      .filter((item) => Number(item.amount) > 0)
      .map((item) => ({
        member_user_id: item.member_user_id ?? null,
        member_email: item.member_email ?? null,
        amount: Number(item.amount),
        notes: item.notes ?? null,
      }))

    const { error } = await supabase.rpc('upsert_expense_with_split', {
      p_trip_id: tripId,
      p_expense: expense,
      p_splits: payloadSplits,
      p_editing_id: editingId ?? null,
    })

    if (error) return { error: error.message }

    await Promise.all([
      get().loadExpenses(tripId),
      invalidateByPrefix('home'),
    ])
    return { error: null }
  },

  reset() {
    set(initialState)
  },
}))

// Executor para o mutationQueue — replay offline mutations
export async function expenseExecutor(action: string, args: unknown[]): Promise<void> {
  if (action === 'insert' || action === 'update') {
    const [, row, editingId] = args as [string, Record<string, unknown>, string | null]
    const request = editingId
      ? supabase.from('expenses').update(row).eq('id', editingId)
      : supabase.from('expenses').insert(row)
    const { error } = await request
    if (error) throw error
  } else if (action === 'delete') {
    const [expenseId] = args as [string]
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (error) throw error
  }
}
