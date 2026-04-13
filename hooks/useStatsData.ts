import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'

type TripRow = { id: string; destination: string; status: string; start_date: string | null }
type ExpenseRow = { amount: number; currency: string; category: string }

export type StatsData = {
  trips: TripRow[]
  expenses: ExpenseRow[]
  loading: boolean
  totalTrips: number
  completedTrips: number
  uniqueDestinations: number
  totalByCurrency: Record<string, number>
  topCategories: [string, number][]
  maxCategoryAmount: number
  topDestinations: [string, number][]
  yearEntries: [string, number][]
}

/**
 * Hook que carrega e computa todas as estatisticas de viagens e gastos.
 */
export function useStatsData(): StatsData {
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<TripRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])

  useFocusEffect(useCallback(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [tripsRes, expensesRes] = await Promise.all([
          supabase.from('trips').select('id, destination, status, start_date').order('created_at', { ascending: false }),
          supabase.from('expenses').select('amount, currency, category'),
        ])
        setTrips((tripsRes.data || []) as TripRow[])
        setExpenses((expensesRes.data || []) as ExpenseRow[])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, []))

  const totalTrips = trips.length
  const completedTrips = trips.filter(t => t.status === 'completed').length
  const uniqueDestinations = new Set(trips.map(t => t.destination.trim().toLowerCase())).size

  const totalByCurrency: Record<string, number> = {}
  expenses.forEach(e => {
    const cur = e.currency === 'BRL' ? 'R$' : e.currency
    totalByCurrency[cur] = (totalByCurrency[cur] || 0) + e.amount
  })

  const totalByCategory: Record<string, number> = {}
  expenses.forEach(e => { totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount })
  const topCategories = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][]
  const maxCategoryAmount = topCategories[0]?.[1] || 1

  const destCount: Record<string, number> = {}
  trips.forEach(t => { const key = t.destination.trim(); destCount[key] = (destCount[key] || 0) + 1 })
  const topDestinations = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][]

  const byYear: Record<string, number> = {}
  trips.forEach(t => { if (t.start_date) { const year = t.start_date.substring(0, 4); byYear[year] = (byYear[year] || 0) + 1 } })
  const yearEntries = Object.entries(byYear).sort((a, b) => Number(b[0]) - Number(a[0])) as [string, number][]

  return {
    trips, expenses, loading,
    totalTrips, completedTrips, uniqueDestinations,
    totalByCurrency, topCategories, maxCategoryAmount,
    topDestinations, yearEntries,
  }
}
