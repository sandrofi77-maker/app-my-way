import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Icon from './Icon'
import { Colors } from '../constants/Colors'
import { ITINERARY_CATEGORY_CONF } from '../constants/categories'
import type { ItineraryItem } from '../types'

const C = Colors.dark

type Props = {
  tripId: string
  tripTitle: string
  startDate: string
  endDate: string
  itineraryItems: ItineraryItem[]
}

export default function ItineraryPreviewSection({ tripId, tripTitle, startDate, endDate, itineraryItems }: Props) {
  const navigateToItinerary = () =>
    router.push({ pathname: '/itinerary', params: { id: tripId, title: tripTitle, start_date: startDate, end_date: endDate } })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = itineraryItems
    .filter(i => i.scheduled_date && i.scheduled_date >= today)
    .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || '') || (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
    .slice(0, 3)

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={navigateToItinerary}
      accessibilityLabel="Ver roteiro completo"
      accessibilityRole="button"
    >
      {upcoming.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="event-available" size={24} color={C.tertiary} />
          <Text style={styles.emptyText}>Nenhum evento programado</Text>
        </View>
      ) : (
        upcoming.map((item, idx) => {
          const conf = ITINERARY_CATEGORY_CONF[item.category || 'free'] ?? ITINERARY_CATEGORY_CONF['free']
          const dateLabel = item.scheduled_date
            ? new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : null
          return (
            <View key={item.id} style={[styles.previewItem, { borderLeftColor: conf.color }, idx < upcoming.length - 1 && { marginBottom: 8 }]}>
              <View style={styles.previewInner}>
                <View style={styles.previewTopRow}>
                  <View style={[styles.previewIcon, { backgroundColor: conf.color + '18' }]}>
                    <Icon name={conf.icon as string} size={13} color={conf.color} />
                  </View>
                  <Text style={[styles.previewCat, { color: conf.color }]}>{item.category || 'Livre'}</Text>
                </View>
                <Text style={styles.previewTitle} numberOfLines={1}>{item.title}</Text>
                {[dateLabel, item.scheduled_time, item.location].filter(Boolean).length > 0 && (
                  <Text style={styles.previewMeta} numberOfLines={1}>
                    {[dateLabel, item.scheduled_time, item.location].filter(Boolean).join('  ·  ')}
                  </Text>
                )}
              </View>
            </View>
          )
        })
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, marginBottom: 16 },
  emptyState: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  emptyText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  previewItem: {
    backgroundColor: C.surfaceHigh, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 4,
    overflow: 'hidden',
  },
  previewInner: { padding: 12 },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  previewIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  previewCat: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 3 },
  previewMeta: { fontSize: 12, color: C.secondary },
})
