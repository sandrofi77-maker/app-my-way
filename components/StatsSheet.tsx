import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { formatBRL } from '../lib/currency'
import Icon from './Icon'
import SheetModal from './SheetModal'

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

type TripRow = { id: string; destination: string; status: string; start_date: string | null }
type ExpenseRow = { amount: number; currency: string; category: string }

type Props = {
  visible: boolean
  onClose: () => void
}

export default function StatsSheet({ visible, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<TripRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])

  useEffect(() => {
    if (visible) loadData()
  }, [visible])

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

  const totalByCurrency: Record<string, number> = {}
  expenses.forEach(e => {
    const cur = e.currency === 'BRL' ? 'R$' : e.currency
    totalByCurrency[cur] = (totalByCurrency[cur] || 0) + e.amount
  })

  const totalByCategory: Record<string, number> = {}
  expenses.forEach(e => {
    totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount
  })
  const topCategories = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCatAmt = topCategories[0]?.[1] || 1

  const destCount: Record<string, number> = {}
  trips.forEach(t => {
    const key = t.destination.trim()
    destCount[key] = (destCount[key] || 0) + 1
  })
  const topDests = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const byYear: Record<string, number> = {}
  trips.forEach(t => {
    if (t.start_date) {
      const year = t.start_date.substring(0, 4)
      byYear[year] = (byYear[year] || 0) + 1
    }
  })
  const yearEntries = Object.entries(byYear).sort((a, b) => Number(b[0]) - Number(a[0]))

  return (
    <SheetModal visible={visible} onClose={onClose} title="Estatísticas" subtitle="Resumo de todas as viagens" drawerWidth={540}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <>
          {/* Cards resumo */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Icon name="flight" size={22} color={C.primary} />
              <Text style={styles.summaryValue}>{totalTrips}</Text>
              <Text style={styles.summaryLabel}>Viagens</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="check-circle" size={22} color={C.success} />
              <Text style={styles.summaryValue}>{completedTrips}</Text>
              <Text style={styles.summaryLabel}>Concluídas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="place" size={22} color="#5856D6" />
              <Text style={styles.summaryValue}>{uniqueDestinations}</Text>
              <Text style={styles.summaryLabel}>Destinos</Text>
            </View>
          </View>

          {/* Total gasto por moeda */}
          {Object.keys(totalByCurrency).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Total gasto</Text>
              {Object.entries(totalByCurrency).map(([cur, amt]) => (
                <View key={cur} style={styles.totalRow}>
                  <Text style={styles.totalCurrency}>{cur}</Text>
                  <Text style={styles.totalAmount}>{formatBRL(amt)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top categorias */}
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
                    <Text style={styles.catAmt}>{mainCur} {formatBRL(amt)}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Destinos mais visitados */}
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

          {/* Viagens por ano */}
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
        </>
      )}
    </SheetModal>
  )
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 60 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  summaryValue: { fontSize: 26, fontWeight: '800', color: C.primary },
  summaryLabel: { fontSize: 11, color: C.secondary, fontWeight: '600' },

  section: { backgroundColor: C.background, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.border },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalCurrency: { fontSize: 15, fontWeight: '600', color: C.secondary },
  totalAmount: { fontSize: 22, fontWeight: '800', color: C.primary },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 110 },
  catLabel: { fontSize: 13, color: C.secondary, flex: 1 },
  catTrack: { flex: 1, height: 8, backgroundColor: C.surfaceHigh, borderRadius: 5, overflow: 'hidden' },
  catBar: { height: 8, borderRadius: 5 },
  catAmt: { fontSize: 13, fontWeight: '700', color: C.primary, width: 80, textAlign: 'right' },

  destRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.border },
  destRank: { fontSize: 14, fontWeight: '800', color: C.tertiary, width: 20 },
  destName: { flex: 1, fontSize: 14, color: C.primary, fontWeight: '600' },
  destCount: { fontSize: 12, color: C.secondary },

  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  yearLabel: { fontSize: 14, fontWeight: '700', color: C.primary, width: 42 },
  yearTrack: { flex: 1, height: 8, backgroundColor: C.surfaceHigh, borderRadius: 5, overflow: 'hidden' },
  yearBar: { height: 8, borderRadius: 5, backgroundColor: C.primary },
  yearCount: { fontSize: 14, fontWeight: '700', color: C.primary, width: 24, textAlign: 'right' },

  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.primary },
  emptyDesc: { fontSize: 13, color: C.secondary, textAlign: 'center' },
})
