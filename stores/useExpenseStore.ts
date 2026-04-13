import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Expense } from '../types'

type ExpenseState = {
  expenses: Expense[]
  budget: number | null
  budgetCurrency: string | null
  loading: boolean

  loadExpenses: (tripId: string) => Promise<void>
  loadBudget: (tripId: string) => Promise<void>
  loadAll: (tripId: string) => Promise<void>
  saveExpense: (tripId: string, data: Record<string, unknown>, editingId?: string | null) => Promise<{ error: string | null }>
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
    const { data, error } = await supabase
      .from('expenses').select('*').eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (!error) set({ expenses: data || [] })
  },

  async loadBudget(tripId: string) {
    const { data } = await supabase
      .from('trips').select('budget, budget_currency').eq('id', tripId).single()
    if (data) set({
      budget: data.budget ?? null,
      budgetCurrency: data.budget_currency ?? null,
    })
  },

  async saveExpense(tripId, payload, editingId) {
    const { data: { user } } = await supabase.auth.getUser()
    const row = { ...payload, trip_id: tripId, user_id: user?.id }

    const request = editingId
      ? supabase.from('expenses').update(row).eq('id', editingId)
      : supabase.from('expenses').insert(row)

    const { error } = await request
    if (error) return { error: error.message }

    await get().loadExpenses(tripId)
    return { error: null }
  },

  async deleteExpense(expenseId, tripId) {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (error) return { error: error.message }
    await get().loadExpenses(tripId)
    return { error: null }
  },

  reset() {
    set(initialState)
  },
}))
