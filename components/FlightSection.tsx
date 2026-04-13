import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import Icon from './Icon'
import HScrollable from './HScrollable'
import { Colors } from '../constants/Colors'
import { getDeviceLocale } from '../lib/i18n'
import type { Flight } from '../types'

const C = Colors.dark

function formatDateShort(value?: string | null) {
  if (!value) return '--'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString(getDeviceLocale(), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value?: string | null) {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleTimeString(getDeviceLocale(), { hour: '2-digit', minute: '2-digit' })
}

type Props = {
  flights: Flight[]
  cardWidth: number
  isDesktop: boolean
  activeIndex: number
  onIndexChange: (i: number) => void
  onAdd: () => void
  onEdit: (flight: Flight) => void
}

export default function FlightSection({ flights, cardWidth, isDesktop, activeIndex, onIndexChange, onAdd, onEdit }: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Voos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} accessibilityLabel="Adicionar voo" accessibilityRole="button">
          <Icon name="add" size={20} color={C.icon} />
        </TouchableOpacity>
      </View>

      {flights.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="flight" size={32} color={C.tertiary} />
          <Text style={styles.emptyText}>Nenhum voo cadastrado</Text>
        </View>
      ) : (
        <HScrollable
          paginated={!isDesktop}
          itemWidth={cardWidth}
          itemCount={flights.length}
          activeIndex={activeIndex}
          onIndexChange={onIndexChange}
          showDots={!isDesktop && flights.length > 1}
          contentContainerStyle={isDesktop ? styles.desktopRow : undefined}
        >
          {flights.map((flight) => (
            <TouchableOpacity
              key={flight.id}
              style={[styles.card, { width: cardWidth }]}
              activeOpacity={0.93}
              onPress={() => onEdit(flight)}
              accessibilityLabel={`Voo ${flight.flight_number} ${flight.departure_airport} para ${flight.arrival_airport}`}
              accessibilityRole="button"
            >
              <View style={styles.topRow}>
                <Text style={styles.dateLabel}>{formatDateShort(flight.departure_datetime)}</Text>
                <View style={styles.numBadge}>
                  <Icon name="flight" size={11} color="#fff" />
                  <Text style={styles.numBadgeText}>{flight.flight_number}</Text>
                </View>
              </View>

              <Text style={styles.airline}>{flight.airline}</Text>

              <View style={styles.timesRow}>
                <View>
                  <Text style={styles.time}>{formatTime(flight.departure_datetime)}</Text>
                  <Text style={styles.airport}>{flight.departure_airport}</Text>
                </View>

                <View style={styles.sep}>
                  <View style={styles.line} />
                  <View style={{ transform: [{ rotate: '45deg' }] }}>
                    <Icon name="flight" size={20} color={C.secondary} />
                  </View>
                  <View style={styles.line} />
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.time}>{formatTime(flight.arrival_datetime)}</Text>
                  <Text style={styles.airport}>{flight.arrival_airport}</Text>
                </View>
              </View>

              {flight.notes ? (
                <Text style={styles.notes} numberOfLines={2}>{flight.notes}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </HScrollable>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.primary, marginBottom: 10, marginTop: 8 },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHigh, borderWidth: 0.5, borderColor: C.border },
  emptyCard: { backgroundColor: C.surface, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, color: C.tertiary, marginBottom: 10 },
  desktopRow: { gap: 16, paddingRight: 4 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dateLabel: { fontSize: 12, color: C.tertiary, fontWeight: '500' },
  numBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  numBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  airline: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 14 },
  timesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  time: { fontSize: 26, fontWeight: '800', color: C.primary },
  airport: { fontSize: 13, fontWeight: '600', color: C.secondary, marginTop: 2 },
  sep: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  line: { flex: 1, height: 1.5, backgroundColor: C.border },
  notes: { fontSize: 12, color: C.secondary, marginBottom: 8, lineHeight: 17 },
})
