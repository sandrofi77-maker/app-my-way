import { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Icon from './Icon'
import { Colors } from '../constants/Colors'
import { formatBRL } from '../lib/currency'
import { t } from '../lib/i18n'
import { EXPENSE_CATEGORY_CONF } from '../constants/categories'
import type { Expense } from '../types'

const C = Colors.dark

type Props = {
  tripId: string
  tripTitle: string
  expenses: Expense[]
}

export default memo(function ExpensesPreviewSection({ tripId, tripTitle, expenses }: Props) {
  const navigateToExpenses = () =>
    router.push({ pathname: '/expenses', params: { id: tripId, title: tripTitle } })

  if (expenses.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyCard}
        onPress={navigateToExpenses}
        activeOpacity={0.85}
        accessibilityLabel="Registrar gastos"
        accessibilityRole="button"
      >
        <Icon name="account-balance-wallet" size={28} color={C.tertiary} />
        <Text style={styles.emptyText}>{t('no_expenses')}</Text>
        <Text style={styles.emptySubtext}>Toque para registrar seus gastos</Text>
      </TouchableOpacity>
    )
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currency = expenses[expenses.length - 1]?.currency || 'R$'
  const recent = [...expenses].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
  const categoryTotals = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxCat = categoryTotals[0]?.[1] || 1

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={navigateToExpenses}
      activeOpacity={0.85}
      accessibilityLabel={`Total gasto: ${currency} ${formatBRL(total)}`}
      accessibilityRole="button"
    >
      <View style={styles.bentoTotal}>
        <Text style={styles.bentoTotalLabel}>Total gasto</Text>
        <Text style={styles.bentoTotalValue} numberOfLines={1} adjustsFontSizeToFit>
          {currency} {formatBRL(total)}
        </Text>
        <Text style={styles.bentoCountInline}>
          {expenses.length} {expenses.length === 1 ? 'lançamento' : 'lançamentos'}
        </Text>
      </View>

      <View style={styles.catSection}>
        {categoryTotals.map(([cat, amt]) => {
          const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
          const pct = (amt / maxCat) * 100
          return (
            <View key={cat} style={styles.catRow}>
              <View style={styles.catLeft}>
                <Icon name={conf.icon} size={12} color={conf.color} />
                <Text style={styles.catLabel} numberOfLines={1}>{cat}</Text>
              </View>
              <View style={styles.catBarTrack}>
                <View style={[styles.catBar, { width: `${pct}%` as any, backgroundColor: conf.color }]} />
              </View>
              <Text style={styles.catAmt}>{currency} {formatBRL(amt)}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.divider} />

      {recent.map((e, idx) => {
        const conf = EXPENSE_CATEGORY_CONF[e.category] ?? EXPENSE_CATEGORY_CONF['Outros']
        return (
          <View key={e.id} style={[styles.recentRow, idx < recent.length - 1 && styles.recentRowBorder]}>
            <View style={[styles.recentIcon, { backgroundColor: conf.color + '18' }]}>
              <Icon name={conf.icon} size={14} color={conf.color} />
            </View>
            <View style={styles.recentMid}>
              <Text style={styles.recentCat}>{e.category}</Text>
              {e.description ? <Text style={styles.recentDesc} numberOfLines={1}>{e.description}</Text> : null}
            </View>
            <Text style={styles.recentAmt}>{e.currency} {formatBRL(e.amount)}</Text>
          </View>
        )
      })}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  emptyCard: { backgroundColor: C.surface, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', gap: 6, marginBottom: 16 },
  emptyText: { fontSize: 14, fontWeight: '600', color: C.secondary, marginTop: 4 },
  emptySubtext: { fontSize: 12, color: C.tertiary },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, marginBottom: 16 },
  bentoTotal: { backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  bentoTotalLabel: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase' as any, letterSpacing: 0.8, marginBottom: 4 },
  bentoTotalValue: { fontSize: 22, fontWeight: '800', color: C.primary },
  bentoCountInline: { fontSize: 12, color: C.tertiary, marginTop: 6 },
  catSection: { gap: 8, marginBottom: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 94 },
  catLabel: { fontSize: 11, color: C.secondary, flex: 1 },
  catBarTrack: { flex: 1, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  catBar: { height: 4, borderRadius: 2 },
  catAmt: { fontSize: 11, fontWeight: '600', color: C.primary, width: 58, textAlign: 'right' },
  divider: { height: 0.5, backgroundColor: C.border, marginBottom: 4 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  recentRowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.border },
  recentIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recentMid: { flex: 1 },
  recentCat: { fontSize: 13, fontWeight: '600', color: C.primary },
  recentDesc: { fontSize: 11, color: C.tertiary },
  recentAmt: { fontSize: 13, fontWeight: '700', color: C.primary },
})
