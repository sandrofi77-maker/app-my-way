import { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Icon from './Icon'
import CachedImage from './CachedImage'
import HScrollable from './HScrollable'
import { Colors } from '../constants/Colors'
import { getDeviceLocale, t } from '../lib/i18n'
import type { Accommodation } from '../types'

const C = Colors.dark

function getDaysUntil(dateStr?: string | null): string | null {
  if (!dateStr) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return null
  const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return t('today_badge')
  if (diff === 1) return t('days_remaining_one')
  return t('days_remaining_other').replace('{count}', String(diff))
}

function formatDateRange(checkIn?: string | null, checkOut?: string | null): string {
  const fmt = (d: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
    if (!m) return d
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return dt.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: 'short' })
  }
  if (checkIn && checkOut) return `${fmt(checkIn)} – ${fmt(checkOut)}`
  if (checkIn) return fmt(checkIn)
  if (checkOut) return fmt(checkOut)
  return ''
}

function formatWeekdayDay(dateStr?: string | null): { weekday: string; day: string } | null {
  if (!dateStr) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!match) return null
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return {
    weekday: d.toLocaleDateString(getDeviceLocale(), { weekday: 'short' }).replace('.', ''),
    day: String(d.getDate()),
  }
}

type Props = {
  accommodations: Accommodation[]
  cardWidth: number
  isDesktop: boolean
  activeIndex: number
  onIndexChange: (i: number) => void
  onAdd: () => void
  onEdit: (accommodation: Accommodation) => void
}

export default memo(function AccommodationSection({ accommodations, cardWidth, isDesktop, activeIndex, onIndexChange, onAdd, onEdit }: Props) {
  return (
    <>
      {accommodations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="hotel" size={32} color={C.tertiary} />
          <Text style={styles.emptyText}>{t('no_accommodations')}</Text>
        </View>
      ) : (
        <HScrollable
          paginated={!isDesktop}
          itemWidth={cardWidth}
          itemCount={accommodations.length}
          activeIndex={activeIndex}
          onIndexChange={onIndexChange}
          showDots={!isDesktop && accommodations.length > 1}
          contentContainerStyle={isDesktop ? styles.desktopRow : undefined}
        >
          {accommodations.map((accom) => {
            const daysUntil = getDaysUntil(accom.check_in_date)
            const dateRange = formatDateRange(accom.check_in_date, accom.check_out_date)
            const checkInDay = formatWeekdayDay(accom.check_in_date)
            const checkOutDay = formatWeekdayDay(accom.check_out_date)

            return (
              <TouchableOpacity
                key={accom.id}
                style={[styles.card, { width: cardWidth }]}
                activeOpacity={0.93}
                onPress={() => onEdit(accom)}
                accessibilityLabel={`Hospedagem ${accom.name}`}
                accessibilityRole="button"
              >
                <View style={styles.imageWrapper}>
                  {accom.image_url ? (
                    <CachedImage uri={accom.image_url} style={styles.coverImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="hotel" size={44} color={C.tertiary} />
                    </View>
                  )}
                  {daysUntil ? (
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{daysUntil}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{accom.name}</Text>
                  {(dateRange || accom.location) ? (
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {[dateRange, accom.location].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  {accom.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{accom.description}</Text>
                  ) : null}
                </View>

                {(checkInDay || checkOutDay) ? (
                  <View style={styles.checkRows}>
                    {checkInDay ? (
                      <View style={styles.checkRow}>
                        <View style={styles.checkDayBox}>
                          <Text style={styles.checkWeekday}>{checkInDay.weekday}</Text>
                          <Text style={styles.checkDayNum}>{checkInDay.day}</Text>
                        </View>
                        <View style={styles.checkIconBox}>
                          <Icon name="login" size={20} color={C.secondary} />
                        </View>
                        <Text style={styles.checkLabel}>
                          Check-in{accom.check_in_time ? ` · ${accom.check_in_time}` : ''}
                        </Text>
                      </View>
                    ) : null}
                    {checkOutDay ? (
                      <View style={[styles.checkRow, checkInDay ? styles.checkRowBorder : null]}>
                        <View style={styles.checkDayBox}>
                          <Text style={styles.checkWeekday}>{checkOutDay.weekday}</Text>
                          <Text style={styles.checkDayNum}>{checkOutDay.day}</Text>
                        </View>
                        <View style={styles.checkIconBox}>
                          <Icon name="logout" size={20} color={C.secondary} />
                        </View>
                        <Text style={styles.checkLabel}>
                          Check-out{accom.check_out_time ? ` · ${accom.check_out_time}` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            )
          })}
        </HScrollable>
      )}
    </>
  )
})

const styles = StyleSheet.create({
  emptyCard: { backgroundColor: C.surface, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, color: C.tertiary, marginBottom: 10 },
  desktopRow: { gap: 16, paddingRight: 4 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  imageWrapper: { position: 'relative', width: '100%', aspectRatio: 16 / 10 },
  coverImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  dateBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  dateBadgeText: { fontSize: 13, fontWeight: '700', color: C.primary },
  cardBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.primary, marginBottom: 4, lineHeight: 24 },
  cardMeta: { fontSize: 13, color: C.secondary, marginBottom: 6 },
  cardDesc: { fontSize: 12, color: C.tertiary, lineHeight: 17, marginTop: 4 },
  checkRows: { borderTopWidth: 0.5, borderTopColor: C.border, marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  checkRowBorder: { borderTopWidth: 0.5, borderTopColor: C.border },
  checkDayBox: { width: 40, alignItems: 'center', marginRight: 12 },
  checkWeekday: { fontSize: 11, color: C.tertiary, fontWeight: '600', textTransform: 'lowercase' },
  checkDayNum: { fontSize: 22, fontWeight: '700', color: C.primary },
  checkIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.primary },
})
