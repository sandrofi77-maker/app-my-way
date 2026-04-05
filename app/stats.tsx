import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native'
import Icon from '../components/Icon'
import { useState, useCallback } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import DesktopLayout from '../components/DesktopLayout'

const C = Colors.dark

const EXPENSE_CATEGORY_CONF: Record<string, { icon: string; color: string }> = {
  'Hospedagem':  { icon: 'hotel',             color: '#5856D6' },
  'Alimentação': { icon: 'restaurant',        color: '#FF9500' },
  'Transporte':  { icon: 'directions-car',    color: '#32ADE6' },
  'Passeios':    { icon: 'attractions',       color: '#34C759' },
  'Compras':     { icon: 'shopping-bag',      color: '#AF52DE' },
  'Saúde':       { icon: 'medical-services',  color: '#FF2D55' },
  'Outros':      { icon: 'payments',          color: '#8E8E93' },
}

type TripRow = {
  id: string
  destination: string
  status: string
  start_date: string | null
}

type ExpenseRow = {
  amount: number
  currency: string
  category: string
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<TripRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])

  useFocusEffect(
    useCallback(() => { loadData() }, [])
  )

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

  // ── Cálculos ──
  const totalTrips = trips.length
  const completedTrips = trips.filter(t => t.status === 'completed').length
  const uniqueDestinations = new Set(trips.map(t => t.destination.trim().toLowerCase())).size

  // Total por moeda
  const totalByCurrency: Record<string, number> = {}
  expenses.forEach(e => {
    const cur = e.currency === 'BRL' ? 'R$' : e.currency
    totalByCurrency[cur] = (totalByCurrency[cur] || 0) + e.amount
  })

  // Gasto por categoria (top 5)
  const totalByCategory: Record<string, number> = {}
  expenses.forEach(e => {
    totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount
  })
  const topCategories = Object.entries(totalByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCatAmt = topCategories[0]?.[1] || 1

  // Destinos mais visitados
  const destCount: Record<string, number> = {}
  trips.forEach(t => {
    const key = t.destination.trim()
    destCount[key] = (destCount[key] || 0) + 1
  })
  const topDests = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Viagens por ano
  const byYear: Record<string, number> = {}
  trips.forEach(t => {
    if (t.start_date) {
      const year = t.start_date.substring(0, 4)
      byYear[year] = (byYear[year] || 0) + 1
    }
  })
  const yearEntries = Object.entries(byYear).sort((a, b) => Number(b[0]) - Number(a[0]))

  return (
    <DesktopLayout>
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={22} color={C.icon} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Estatísticas</Text>
          <Text style={styles.headerSub}>Resumo de todas as viagens</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Cards resumo ── */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Icon name="flight" size={22} color={C.primary} />
              <Text style={styles.summaryValue}>{totalTrips}</Text>
              <Text style={styles.summaryLabel}>Viagens</Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Icon name="check-circle" size={22} color={C.success} />
              <Text style={styles.summaryValue}>{completedTrips}</Text>
              <Text style={styles.summaryLabel}>Concluídas</Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Icon name="place" size={22} color="#5856D6" />
              <Text style={styles.summaryValue}>{uniqueDestinations}</Text>
              <Text style={styles.summaryLabel}>Destinos</Text>
            </View>
          </View>

          {/* ── Total gasto por moeda ── */}
          {Object.keys(totalByCurrency).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Total gasto</Text>
              {Object.entries(totalByCurrency).map(([cur, amt]) => (
                <View key={cur} style={styles.totalRow}>
                  <Text style={styles.totalCurrency}>{cur}</Text>
                  <Text style={styles.totalAmount}>
                    {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Top categorias ── */}
          {topCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gastos por categoria</Text>
              {topCategories.map(([cat, amt]) => {
                const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                const pct = (amt / maxCatAmt) * 100
                const mainCur = Object.keys(totalByCurrency)[0] || 'R$'
                return (
                  <View key={cat} style={styles.catRow}>
                    <View style={styles.catLeft}>
                      <Icon name={conf.icon as any} size={18} color={conf.color} />
                      <Text style={styles.catLabel}>{cat}</Text>
                    </View>
                    <View style={styles.catTrack}>
                      <View style={[styles.catBar, { width: `${pct}%` as any, backgroundColor: conf.color }]} />
                    </View>
                    <Text style={styles.catAmt}>
                      {mainCur} {amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Destinos mais visitados ── */}
          {topDests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destinos mais visitados</Text>
              {topDests.map(([dest, count], idx) => (
                <View key={dest} style={styles.destRow}>
                  <Text style={styles.destRank}>{idx + 1}</Text>
                  <Icon name="place" size={16} color={C.tertiary} />
                  <Text style={styles.destName} numberOfLines={1}>{dest}</Text>
                  <Text style={styles.destCount}>{count} {count === 1 ? 'viagem' : 'viagens'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Viagens por ano ── */}
          {yearEntries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Viagens por ano</Text>
              {yearEntries.map(([year, count]) => (
                <View key={year} style={styles.yearRow}>
                  <Text style={styles.yearLabel}>{year}</Text>
                  <View style={styles.yearTrack}>
                    <View style={[styles.yearBar, {
                      width: `${(count / Math.max(...yearEntries.map(e => e[1]))) * 100}%` as any
                    }]} />
                  </View>
                  <Text style={styles.yearCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}

          {totalTrips === 0 && (
            <View style={styles.empty}>
              <Icon name="bar-chart" size={48} color={C.tertiary} />
              <Text style={styles.emptyTitle}>Nenhuma viagem ainda</Text>
              <Text style={styles.emptyDesc}>Crie viagens para ver suas estatísticas aqui.</Text>
            </View>
          )}

        </ScrollView>
      )}
    </View>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  headerSub: { fontSize: 12, color: C.secondary, marginTop: 1 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 60 },

  // Summary cards
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: C.border,
  },
  summaryValue: { fontSize: 26, fontWeight: '800', color: C.primary },
  summaryLabel: { fontSize: 11, color: C.secondary, fontWeight: '600' },

  // Section
  section: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.border },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },

  // Total por moeda
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalCurrency: { fontSize: 15, fontWeight: '600', color: C.secondary },
  totalAmount: { fontSize: 22, fontWeight: '800', color: C.primary },

  // Categories
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 120 },
  catLabel: { fontSize: 13, color: C.secondary, flex: 1 },
  catTrack: { flex: 1, height: 8, backgroundColor: C.surfaceHigh, borderRadius: 5, overflow: 'hidden' },
  catBar: { height: 8, borderRadius: 5 },
  catAmt: { fontSize: 13, fontWeight: '700', color: C.primary, width: 80, textAlign: 'right' },

  // Destinations
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.border },
  destRank: { fontSize: 14, fontWeight: '800', color: C.tertiary, width: 20 },
  destName: { flex: 1, fontSize: 14, color: C.primary, fontWeight: '600' },
  destCount: { fontSize: 12, color: C.secondary },

  // Year
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  yearLabel: { fontSize: 14, fontWeight: '700', color: C.primary, width: 42 },
  yearTrack: { flex: 1, height: 8, backgroundColor: C.surfaceHigh, borderRadius: 5, overflow: 'hidden' },
  yearBar: { height: 8, borderRadius: 5, backgroundColor: C.primary },
  yearCount: { fontSize: 14, fontWeight: '700', color: C.primary, width: 24, textAlign: 'right' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.primary },
  emptyDesc: { fontSize: 13, color: C.secondary, textAlign: 'center' },
})
