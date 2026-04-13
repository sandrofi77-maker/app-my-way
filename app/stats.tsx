import { ScrollView, ActivityIndicator, View } from 'react-native'
import Icon from '../components/Icon'
import { router } from 'expo-router'
import DesktopLayout from '../components/DesktopLayout'
import { formatBRL } from '../lib/currency'
import {
  Box, Text, VStack, HStack, Card, EmptyState, useTheme, IconButton,
} from '../design-system'

import { EXPENSE_CATEGORY_CONF } from '../constants/categories'
import { useStatsData } from '../hooks/useStatsData'

export default function StatsScreen() {
  const theme = useTheme()
  const {
    loading, totalTrips, completedTrips, uniqueDestinations,
    totalByCurrency, topCategories, maxCategoryAmount: maxCatAmt,
    topDestinations: topDests, yearEntries,
  } = useStatsData()

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
