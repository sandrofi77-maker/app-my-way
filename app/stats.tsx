import { ScrollView, ActivityIndicator, View } from 'react-native'
import Icon from '../components/Icon'
import { useState, useCallback } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import DesktopLayout from '../components/DesktopLayout'
import { formatBRL } from '../lib/currency'
import {
  Box, Text, VStack, HStack, Card, EmptyState, useTheme, IconButton,
} from '../design-system'

const EXPENSE_CATEGORY_CONF: Record<string, { icon: string; color: string }> = {
  'Hospedagem':  { icon: 'hotel',             color: '#5856D6' },
  'Alimentacao': { icon: 'restaurant',        color: '#FF9500' },
  'Alimentação': { icon: 'restaurant',        color: '#FF9500' },
  'Transporte':  { icon: 'directions-car',    color: '#32ADE6' },
  'Passeios':    { icon: 'attractions',       color: '#34C759' },
  'Compras':     { icon: 'shopping-bag',      color: '#AF52DE' },
  'Saude':       { icon: 'medical-services',  color: '#FF2D55' },
  'Saúde':       { icon: 'medical-services',  color: '#FF2D55' },
  'Outros':      { icon: 'payments',          color: '#8E8E93' },
}

type TripRow = { id: string; destination: string; status: string; start_date: string | null }
type ExpenseRow = { amount: number; currency: string; category: string }

export default function StatsScreen() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<TripRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])

  useFocusEffect(useCallback(() => { loadData() }, []))

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
  const topCategories = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCatAmt = topCategories[0]?.[1] || 1

  const destCount: Record<string, number> = {}
  trips.forEach(t => { const key = t.destination.trim(); destCount[key] = (destCount[key] || 0) + 1 })
  const topDests = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const byYear: Record<string, number> = {}
  trips.forEach(t => { if (t.start_date) { const year = t.start_date.substring(0, 4); byYear[year] = (byYear[year] || 0) + 1 } })
  const yearEntries = Object.entries(byYear).sort((a, b) => Number(b[0]) - Number(a[0]))

  return (
    <DesktopLayout>
      <Box flex={1} bg="background">
        {/* Header */}
        <Box bg="surface" borderBottomWidth={0.5} borderColor="border" px={5} pt={14} pb={4}>
          <HStack alignItems="center">
            <IconButton accessibilityLabel="Voltar" onPress={() => router.back()} variant="ghost">
              <Icon name="arrow-back" size={22} color={theme.colors.text} />
            </IconButton>
            <Box flex={1} alignItems="center">
              <Text variant="subtitle" weight="700">Estatisticas</Text>
              <Text variant="caption" color="textSecondary">Resumo de todas as viagens</Text>
            </Box>
            <Box width={36} />
          </HStack>
        </Box>

        {loading ? (
          <Box flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" color={theme.colors.brand} />
          </Box>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
            {/* Summary cards */}
            <HStack gap={2.5} mb={4}>
              {[
                { icon: 'flight', color: theme.colors.text, value: totalTrips, label: 'Viagens' },
                { icon: 'check-circle', color: theme.colors.success, value: completedTrips, label: 'Concluidas' },
                { icon: 'place', color: '#5856D6', value: uniqueDestinations, label: 'Destinos' },
              ].map(s => (
                <Card key={s.label} variant="outlined" style={{ flex: 1 }}>
                  <VStack gap={1.5} p={4} alignItems="center">
                    <Icon name={s.icon as any} size={22} color={s.color} />
                    <Text variant="h3" weight="800">{s.value}</Text>
                    <Text variant="caption" color="textSecondary" weight="600">{s.label}</Text>
                  </VStack>
                </Card>
              ))}
            </HStack>

            {/* Total gasto por moeda */}
            {Object.keys(totalByCurrency).length > 0 && (
              <Card variant="outlined" style={{ marginBottom: 12 }}>
                <VStack p={4} gap={2}>
                  <Text variant="overline" color="textTertiary">Total gasto</Text>
                  {Object.entries(totalByCurrency).map(([cur, amt]) => (
                    <HStack key={cur} justifyContent="space-between" alignItems="center">
                      <Text variant="body" color="textSecondary" weight="600">{cur}</Text>
                      <Text variant="h4" weight="800">{formatBRL(amt)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>
            )}

            {/* Top categorias */}
            {topCategories.length > 0 && (
              <Card variant="outlined" style={{ marginBottom: 12 }}>
                <VStack p={4} gap={3.5}>
                  <Text variant="overline" color="textTertiary">Gastos por categoria</Text>
                  {topCategories.map(([cat, amt]) => {
                    const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                    const pct = (amt / maxCatAmt) * 100
                    const mainCur = Object.keys(totalByCurrency)[0] || 'R$'
                    return (
                      <HStack key={cat} gap={2.5} alignItems="center">
                        <HStack gap={2} alignItems="center" style={{ width: 120 }}>
                          <Icon name={conf.icon as any} size={18} color={conf.color} />
                          <Text variant="bodySmall" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>{cat}</Text>
                        </HStack>
                        <View style={{ flex: 1, height: 8, backgroundColor: theme.colors.surfaceHigh, borderRadius: 5, overflow: 'hidden' }}>
                          <View style={{ height: 8, borderRadius: 5, width: `${pct}%` as any, backgroundColor: conf.color }} />
                        </View>
                        <Text variant="bodySmall" weight="700" style={{ width: 80, textAlign: 'right' }}>
                          {mainCur} {formatBRL(amt)}
                        </Text>
                      </HStack>
                    )
                  })}
                </VStack>
              </Card>
            )}

            {/* Destinos mais visitados */}
            {topDests.length > 0 && (
              <Card variant="outlined" style={{ marginBottom: 12 }}>
                <VStack p={4} gap={2.5}>
                  <Text variant="overline" color="textTertiary">Destinos mais visitados</Text>
                  {topDests.map(([dest, count], idx) => (
                    <HStack key={dest} gap={2} alignItems="center" py={2.5}
                      style={idx < topDests.length - 1 ? { borderBottomWidth: 0.5, borderBottomColor: theme.colors.border } : undefined}
                    >
                      <Text variant="body" weight="800" color="textTertiary" style={{ width: 20 }}>{idx + 1}</Text>
                      <Icon name="place" size={16} color={theme.colors.textTertiary} />
                      <Text variant="body" weight="600" numberOfLines={1} style={{ flex: 1 }}>{dest}</Text>
                      <Text variant="bodySmall" color="textSecondary">{count} {count === 1 ? 'viagem' : 'viagens'}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>
            )}

            {/* Viagens por ano */}
            {yearEntries.length > 0 && (
              <Card variant="outlined" style={{ marginBottom: 12 }}>
                <VStack p={4} gap={3}>
                  <Text variant="overline" color="textTertiary">Viagens por ano</Text>
                  {yearEntries.map(([year, count]) => (
                    <HStack key={year} gap={3} alignItems="center">
                      <Text variant="body" weight="700" style={{ width: 42 }}>{year}</Text>
                      <View style={{ flex: 1, height: 8, backgroundColor: theme.colors.surfaceHigh, borderRadius: 5, overflow: 'hidden' }}>
                        <View style={{ height: 8, borderRadius: 5, backgroundColor: theme.colors.brand, width: `${(count / Math.max(...yearEntries.map(e => e[1]))) * 100}%` as any }} />
                      </View>
                      <Text variant="body" weight="700" style={{ width: 24, textAlign: 'right' }}>{count}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>
            )}

            {totalTrips === 0 && (
              <Box mt={14}>
                <EmptyState
                  icon={<Icon name="bar-chart" size={48} color={theme.colors.textTertiary} />}
                  title="Nenhuma viagem ainda"
                  description="Crie viagens para ver suas estatisticas aqui."
                />
              </Box>
            )}
          </ScrollView>
        )}
      </Box>
    </DesktopLayout>
  )
}
