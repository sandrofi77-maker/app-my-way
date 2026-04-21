import {
  View, FlatList, Platform, StyleSheet
} from 'react-native'
import Icon from '../../components/Icon'
import CachedImage from '../../components/CachedImage'
import { useState, useEffect, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import DesktopLayout from '../../components/DesktopLayout'
import { useResponsive } from '../../hooks/useResponsive'
import { formatBRL } from '../../lib/currency'
import { t } from '../../lib/i18n'
import NewTripSheet from '../../components/NewTripSheet'
import {
  useHomeData, sortOpenTrips, sortCompletedTrips,
  formatTripDate, getBadgeText, getDaysBetween,
  type TripWithMeta,
} from '../../hooks/useHomeData'
import {
  Box, Text, HStack, VStack, Card, Button, Pressable,
  Skeleton, EmptyState, FAB, Avatar, useTheme, IconButton, useToast,
} from '../../design-system'

export default function HomeScreen() {
  const theme = useTheme()
  const toast = useToast()
  const { trips, userName, avatarUrl, loading, error, reload } = useHomeData()
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open')
  const [showNewTrip, setShowNewTrip] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (error) toast.show({ message: error, tone: 'error' })
  }, [error])

  const openTrips = sortOpenTrips(trips.filter((trip) => !trip.isCompleted))
  const completedTrips = sortCompletedTrips(trips.filter((trip) => trip.isCompleted))
  const visibleTrips = activeTab === 'open' ? openTrips : completedTrips
  const showLoading = loading && trips.length === 0

  function SkeletonList() {
    return (
      <VStack gap={5} mt={2}>
        {[0, 1, 2].map((i) => (
          <Card key={`sk-${i}`} variant="elevated">
            <Skeleton width="100%" height={180} borderRadius="none" />
            <VStack gap={2} p={4}>
              <Skeleton width="55%" height={18} />
              <Skeleton width="40%" height={14} />
              <Skeleton width="35%" height={12} />
            </VStack>
          </Card>
        ))}
      </VStack>
    )
  }

  function renderTrip({ item, index }: { item: TripWithMeta, index: number }) {
    const nextItem = visibleTrips[index + 1]
    const daysBetween = isDesktop ? null : getDaysBetween(item, nextItem, activeTab)
    const budgetRatio = item.budget ? item.expenseTotal / item.budget : 0
    const budgetColor = budgetRatio >= 0.9 ? theme.colors.error : budgetRatio >= 0.75 ? '#FF9500' : theme.colors.success
    const budgetPct = Math.round(Math.min(budgetRatio * 100, 100))
    const currencyLabel = item.budget_currency || 'R$'
    const remainingAmount = Math.max((item.budget || 0) - item.expenseTotal, 0)
    const exceededAmount = Math.max(item.expenseTotal - (item.budget || 0), 0)
    const remainingLabel = exceededAmount > 0
      ? `${currencyLabel} ${formatBRL(exceededAmount)} excedido`
      : `${currencyLabel} ${formatBRL(remainingAmount)} restante`

    const budgetPanel = item.budget != null ? (
      <View style={styles.budgetPanel}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text variant={isDesktop ? 'body' : 'bodySmall'} weight="600" color="textSecondary">Orçamento da viagem</Text>
        </HStack>

        <HStack mt={3} gap={isDesktop ? 6 : 4}>
          <VStack gap={0.5} flex={1}>
            <Text variant="overline" color="textTertiary">GASTO</Text>
            <Text variant={isDesktop ? 'title' : 'body'} weight="700" style={{ color: budgetColor }}>
              {currencyLabel} {formatBRL(item.expenseTotal)}
            </Text>
          </VStack>
          <VStack gap={0.5} flex={1} alignItems="flex-end">
            <Text variant="overline" color="textTertiary">PLANEJADO</Text>
            <Text variant={isDesktop ? 'title' : 'body'} weight="700">
              {currencyLabel} {formatBRL(item.budget)}
            </Text>
          </VStack>
        </HStack>

        <View style={styles.budgetTrack}>
          <View style={[styles.budgetBar, { width: `${budgetPct}%` as any, backgroundColor: budgetColor }]} />
        </View>

        <HStack justifyContent="space-between" alignItems="center" mt={1.5}>
          <Text variant="caption" weight="600" color="textTertiary">{budgetPct}% consumido</Text>
          <Text variant="caption" weight="600" color="textTertiary">{remainingLabel}</Text>
        </HStack>
      </View>
    ) : null

    if (isDesktop) {
      return (
        <Pressable
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
          style={styles.cardDesktop}
          hoveredStyle={{ opacity: 0.95 }}
        >
          <View style={styles.cardImgWrapDesktop}>
            {item.cover_image ? (
              <CachedImage uri={item.cover_image} style={styles.cardImgFill} />
            ) : (
              <Box flex={1} alignItems="center" justifyContent="center" bg="surfaceHigh">
                <Icon name="flight" size={44} color={theme.colors.textTertiary} />
              </Box>
            )}
            <View style={styles.daysBadge}>
              <Text variant="bodySmall" weight="700">{getBadgeText(item)}</Text>
            </View>
          </View>

          <VStack flex={1} px={7} py={6} gap={3}>
            <VStack gap={1.5}>
              <Text variant="h2" weight="800" numberOfLines={1}>{item.destination}</Text>
              <Text variant="body" color="textSecondary" numberOfLines={1}>{item.title}</Text>
            </VStack>

            {(item.start_date || item.end_date) && (
              <HStack gap={1.5} alignItems="center">
                <Icon name="event" size={18} color={theme.colors.brand} />
                <Text variant="title" weight="600" color="textSecondary">
                  {formatTripDate(item.start_date)}
                  {item.end_date ? ` \u2014 ${formatTripDate(item.end_date)}` : ''}
                </Text>
              </HStack>
            )}

            {budgetPanel}
          </VStack>
        </Pressable>
      )
    }

    return (
      <View>
        <Pressable
          onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
          style={[styles.card, theme.shadows.sm]}
        >
          <View style={styles.cardImgWrap}>
            {item.cover_image ? (
              <CachedImage uri={item.cover_image} style={styles.cardImgFill} />
            ) : (
              <Box flex={1} alignItems="center" justifyContent="center" bg="surfaceHigh">
                <Icon name="flight" size={44} color={theme.colors.textTertiary} />
              </Box>
            )}
            <View style={styles.daysBadge}>
              <Text variant="bodySmall" weight="700">{getBadgeText(item)}</Text>
            </View>
          </View>

          <VStack gap={1.5} p={4} pt={3.5}>
            <Text variant="h3" weight="800" numberOfLines={1}>{item.destination}</Text>
            <Text variant="body" color="textSecondary" numberOfLines={1}>{item.title}</Text>

            {(item.start_date || item.end_date) && (
              <HStack gap={1.5} alignItems="center" mt={1.5}>
                <Icon name="event" size={16} color={theme.colors.brand} />
                <Text variant="bodySmall" weight="600" color="textSecondary">
                  {formatTripDate(item.start_date)}
                  {item.end_date ? ` \u2014 ${formatTripDate(item.end_date)}` : ''}
                </Text>
              </HStack>
            )}

            {budgetPanel}
          </VStack>
        </Pressable>
        {daysBetween !== null && (
          <Box alignItems="center" mb={4} mt={0} style={{ marginTop: -4 }}>
            <Text variant="caption" color="textTertiary" style={{ backgroundColor: theme.colors.background, paddingHorizontal: 12 }}>
              {t('days_between_trips').replace('{count}', String(daysBetween)).replace(/\{count, =1\{(.+?)\} other\{(.+?)\}\}/, daysBetween === 1 ? '$1' : '$2')}
            </Text>
          </Box>
        )}
      </View>
    )
  }

  const { isDesktop } = useResponsive()

  const renderFlatItem = useCallback(({ item, index }: { item: TripWithMeta; index: number }) => (
    <View>{renderTrip({ item, index })}</View>
  ), [visibleTrips, isDesktop, theme])

  const keyExtractor = useCallback((item: TripWithMeta) => item.id, [])

  const listHeader = (
    <>
      <HStack py={isDesktop ? 4 : 6} alignItems="center">
        <Box flex={1}>
          <Text variant={isDesktop ? 'h2' : 'h3'}>
            {isDesktop ? 'Minhas Viagens' : `Ola, ${userName}`}
          </Text>
        </Box>
        {!isDesktop && (
          <HStack gap={2.5}>
            <IconButton
              accessibilityLabel="Estatisticas"
              onPress={() => router.push('/stats')}
              variant="outline"
            >
              <Icon name="bar-chart" size={22} color={theme.colors.text} />
            </IconButton>
            <Pressable onPress={() => router.push('/profile')}>
              <Avatar
                source={avatarUrl ? { uri: avatarUrl } : null}
                name={userName}
                size="md"
              />
            </Pressable>
          </HStack>
        )}
        {isDesktop && (
          <Button
            variant="primary"
            leftIcon={<Icon name="add" size={18} color="#fff" />}
            onPress={() => setShowNewTrip(true)}
          >
            Nova viagem
          </Button>
        )}
      </HStack>

      {/* Segment control */}
      <Box
        bg="surface" borderRadius="xl" borderWidth={0.5} borderColor="border"
        p={1} mb={2.5} flexDirection="row"
        maxWidth={isDesktop ? 300 : undefined}
      >
        {(['open', 'completed'] as const).map(tab => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.radius.lg,
              backgroundColor: activeTab === tab ? theme.colors.surfaceHigh : 'transparent',
            }}
          >
            <Text
              variant="caption" weight="600"
              color={activeTab === tab ? 'text' : 'textTertiary'}
            >
              {tab === 'open' ? t('planned_trips_tab') : t('completed_trips_tab')}
            </Text>
          </Pressable>
        ))}
      </Box>

      {showLoading && <SkeletonList />}
    </>
  )

  const listEmpty = !showLoading ? (
    <Box mt={20}>
      <EmptyState
        icon={<Icon name="flight" size={48} color={theme.colors.textTertiary} />}
        title={activeTab === 'open' ? t('no_open_trips') : t('no_completed_trips')}
        description={activeTab === 'open' ? t('create_first_trip') : t('finish_trip_hint')}
      />
    </Box>
  ) : null

  return (
    <DesktopLayout>
      <FlatList
        data={showLoading ? [] : visibleTrips}
        renderItem={renderFlatItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        style={isDesktop
          ? { flex: 1, backgroundColor: theme.colors.background, paddingTop: 16 }
          : { flex: 1, backgroundColor: theme.colors.background }
        }
        contentContainerStyle={!isDesktop
          ? { paddingHorizontal: 20, paddingBottom: 100 + insets.bottom, paddingTop: insets.top }
          : undefined
        }
      />
      {!isDesktop && (
        <FAB
          accessibilityLabel="Nova viagem"
          onPress={() => setShowNewTrip(true)}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </FAB>
      )}
      <NewTripSheet
        visible={showNewTrip}
        onClose={() => setShowNewTrip(false)}
        onCreated={(tripId) => {
          setShowNewTrip(false)
          router.push({ pathname: '/trip-detail', params: { id: tripId } })
        }}
      />
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 22,
    overflow: 'hidden',
  },
  cardImgWrap: { width: '100%', aspectRatio: 16 / 10, position: 'relative', overflow: 'hidden' },
  cardImgFill: { width: '100%', height: '100%' },
  cardDesktop: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 22,
    overflow: 'hidden',
    minHeight: 260,
    ...Platform.select({
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 18 },
    }),
  },
  cardImgWrapDesktop: {
    width: 360,
    flexShrink: 0,
    position: 'relative', overflow: 'hidden',
  },
  budgetPanel: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 2,
  },
  budgetTrack: {
    height: 6,
    backgroundColor: '#E9EDF3',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  budgetBar: { height: 6, borderRadius: 999 },
  daysBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
})
