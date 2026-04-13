import {
  View, Text, TouchableOpacity, Pressable, Image,
  StyleSheet, Modal, TextInput,
  ScrollView, ActivityIndicator, Linking, Platform
} from 'react-native'
import Icon from '../components/Icon'
import ImagePickerComponent from '../components/ImagePicker'
import { useState, useCallback } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { Colors } from '../constants/Colors'
import { useItineraryStore } from '../stores/useItineraryStore'
import { t, getDeviceLocale } from '../lib/i18n'
import {
  applyDateMask, applyTimeMask,
  formatDateForInput,
  getLocalDatePlaceholder, getLocalTimePlaceholder,
  toISODateOrNull, toTimeOrNull
} from '../lib/date-locale'
import { showAlert } from '../lib/alert'
import KeyboardView from '../components/KeyboardView'
import SheetModal from '../components/SheetModal'
import MapView from '../components/MapView'
import { geocodeLocation } from '../lib/geocoding'
import DesktopLayout from '../components/DesktopLayout'
import HScrollable from '../components/HScrollable'
import { Input, Button, useTheme } from '../design-system'

const C = Colors.dark

import { ITINERARY_CATEGORIES, getItineraryCategoryConf } from '../constants/categories'
import type { ItineraryItem } from '../types'

const CATEGORIES = ITINERARY_CATEGORIES

function getCategoryConfig(value?: string | null) {
  return getItineraryCategoryConf(value)
}

function openInGoogleMaps(lat: number, lng: number, label?: string) {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=&center=${lat},${lng}`)
}

// Tipo ItineraryItem importado de ../types

function getDaysArray(start: string, end: string): string[] {
  const days: string[] = []
  const current = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  if (isNaN(current.getTime()) || isNaN(endDate.getTime())) return days
  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}


const HOUR_HEIGHT = 80
const GRID_START_HOUR = 0
const GRID_END_HOUR = 24
const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i)

function timeToMinutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(t)
  if (!m) return 0
  return Number(m[1]) * 60 + Number(m[2])
}

function getTopOffset(time: string): number {
  const mins = timeToMinutes(time) - GRID_START_HOUR * 60
  return Math.max(0, (mins / 60) * HOUR_HEIGHT)
}

function getEventHeight(startTime: string, endTime: string | null): number {
  if (!endTime) return HOUR_HEIGHT
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime)
  return Math.max((duration / 60) * HOUR_HEIGHT, 56)
}

export default function ItineraryScreen() {
  const params    = useLocalSearchParams()
  const tripId    = String(params.id         || '')
  const tripTitle = String(params.title      || '')
  const startDate = String(params.start_date || '')
  const endDate   = String(params.end_date   || '')

  const days = getDaysArray(startDate, endDate)

  const [selectedDate, setSelectedDate] = useState<string | null>(days[0] || null)
  // ── Store ──
  const { items, loading, loadItems, saveItem, deleteItem } = useItineraryStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)

  // Form fields
  const [itemTitle,       setItemTitle]       = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemDate,        setItemDate]        = useState('')
  const [itemTime,        setItemTime]        = useState('')
  const [itemEndTime,     setItemEndTime]     = useState('')
  const [itemLocation,    setItemLocation]    = useState('')
  const [itemCategory,    setItemCategory]    = useState('free')
  const [itemImageUri,    setItemImageUri]    = useState<string | null>(null)
  const [imageUploading, setImageUploading]  = useState(false)
  const [itemLat,         setItemLat]         = useState<number | null>(null)
  const [itemLng,         setItemLng]         = useState<number | null>(null)
  const [mapVisible,      setMapVisible]      = useState(false)

  const datePlaceholder = getLocalDatePlaceholder()
  const timePlaceholder = getLocalTimePlaceholder()

  useFocusEffect(
    useCallback(() => { loadItems(tripId) }, [tripId])
  )

  function resetForm() {
    setEditingId(null)
    setItemTitle('')
    setItemDescription('')
    setItemDate('')
    setItemTime('')
    setItemEndTime('')
    setItemLocation('')
    setItemCategory('free')
    setItemImageUri(null)
    setItemLat(null)
    setItemLng(null)
    setMapVisible(false)
  }

  function openNewModal() {
    resetForm()
    if (selectedDate) setItemDate(formatDateForInput(selectedDate))
    setModalVisible(true)
  }

  function openEditModal(item: ItineraryItem) {
    setEditingId(item.id)
    setItemTitle(item.title || '')
    setItemDescription(item.description || '')
    setItemDate(formatDateForInput(item.scheduled_date))
    setItemTime(item.scheduled_time || '')
    setItemEndTime(item.end_time || '')
    setItemLocation(item.location || '')
    setItemCategory(item.category || 'free')
    setItemImageUri(item.image_url || null)
    setItemLat(item.latitude ?? null)
    setItemLng(item.longitude ?? null)
    setMapVisible(item.latitude != null && item.longitude != null)
    setModalVisible(true)
  }

  function handleCloseEventModal() {
    setModalVisible(false)
    resetForm()
  }

  async function handleSave() {
    if (!itemTitle.trim()) {
      showAlert(t('attention_title'), t('required_itinerary_fields'))
      return
    }
    const dateISO = toISODateOrNull(itemDate)
    if (itemDate.trim() && !dateISO) {
      showAlert(t('attention_title'), t('invalid_itinerary_date'))
      return
    }
    const timeVal = toTimeOrNull(itemTime)
    if (itemTime.trim() && !timeVal) {
      showAlert(t('attention_title'), t('invalid_itinerary_time'))
      return
    }
    setSaving(true)
    try {
      const payload = {
        title:          itemTitle.trim(),
        description:    itemDescription.trim() || null,
        scheduled_date: dateISO,
        scheduled_time: timeVal,
        end_time:       toTimeOrNull(itemEndTime),
        location:       itemLocation.trim() || null,
        category:       itemCategory,
        image_url:      itemImageUri || null,
        latitude:       itemLat,
        longitude:      itemLng,
      }
      const { error } = await saveItem(tripId, payload, editingId)
      if (error) throw new Error(error)
      setModalVisible(false)
      resetForm()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('save_itinerary_failed')
      showAlert(t('error_title'), message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    showAlert(t('confirm_delete_itinerary_title'), t('confirm_delete_itinerary_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'), style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            const { error } = await deleteItem(editingId, tripId)
            if (error) throw new Error(error)
            setModalVisible(false)
            resetForm()
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('delete_itinerary_failed')
            showAlert(t('error_title'), message)
          } finally {
            setDeleting(false)
          }
        }
      }
    ])
  }

  const filteredItems = selectedDate
    ? items.filter(i => i.scheduled_date === selectedDate)
    : items

  function renderUntimedCard(item: ItineraryItem) {
    const catConf = getCategoryConfig(item.category)
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.untimedCard, { borderLeftColor: catConf.color }]}
        onPress={() => openEditModal(item)}
        activeOpacity={0.85}
        accessibilityLabel={`${item.title}, ${catConf.label}${item.location ? `, ${item.location}` : ''}`}
        accessibilityRole="button"
      >
        <View style={[styles.catChip, { backgroundColor: catConf.color + '18' }]}>
          <Icon name={catConf.icon} size={10} color={catConf.color} />
          <Text style={[styles.catChipText, { color: catConf.color }]}>{catConf.label}</Text>
        </View>
        <Text style={styles.untimedCardTitle}>{item.title}</Text>
        {item.location ? (
          <View style={styles.timelineLocationRow}>
            {item.latitude && item.longitude ? (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation?.(); openInGoogleMaps(item.latitude!, item.longitude!, item.location ?? undefined) }}
                hitSlop={8}
                style={styles.mapLinkRow}
              >
                <Icon name="place" size={12} color="#34C759" />
                <Text style={styles.mapLinkText}>{item.location}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Icon name="location-on" size={12} color={C.secondary} />
                <Text style={styles.timelineLocation}>{item.location}</Text>
              </>
            )}
          </View>
        ) : null}
      </TouchableOpacity>
    )
  }

  const untimedItems = filteredItems.filter(i => !i.scheduled_time)
  const timedItems = filteredItems.filter(i => !!i.scheduled_time)

  return (
    <DesktopLayout>
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7} accessibilityLabel="Voltar" accessibilityRole="button">
          <Icon name="arrow-back" size={22} color={C.icon} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} accessibilityRole="header">Roteiro</Text>
          {tripTitle ? <Text style={styles.headerSubtitle} numberOfLines={1}>{tripTitle}</Text> : null}
        </View>
        <TouchableOpacity onPress={openNewModal} style={styles.headerBtn} activeOpacity={0.7} accessibilityLabel="Novo evento" accessibilityRole="button">
          <Icon name="add-circle" size={26} color={C.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Day Selector ── */}
        {days.length > 0 && (
          <View style={styles.daySection}>
            <HScrollable contentContainerStyle={styles.daySelectorContent}>
              {days.map((day) => {
                const d          = new Date(day + 'T00:00:00')
                const isActive   = day === selectedDate
                const monthStr   = d.toLocaleDateString(getDeviceLocale(), { month: 'short' }).replace('.', '').toUpperCase()
                const weekdayStr = d.toLocaleDateString(getDeviceLocale(), { weekday: 'short' }).replace('.', '').toUpperCase()
                const hasDayItems = items.some(i => i.scheduled_date === day)
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCard, isActive && styles.dayCardActive]}
                    onPress={() => { if (!isActive) setSelectedDate(day) }}
                    activeOpacity={0.8}
                    accessibilityLabel={`${d.toLocaleDateString(getDeviceLocale(), { day: 'numeric', month: 'long', weekday: 'long' })}${hasDayItems ? ', tem eventos' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.dayMonth,   isActive && styles.dayTextActive]}>{monthStr}</Text>
                    <Text style={[styles.dayNumber,  isActive && styles.dayTextActive]}>{d.getDate()}</Text>
                    <Text style={[styles.dayWeekday, isActive && styles.dayTextActive]}>{weekdayStr}</Text>
                    {hasDayItems && <View style={[styles.dayDot, isActive && styles.dayDotActive]} />}
                  </TouchableOpacity>
                )
              })}
            </HScrollable>

            {/* Bento summary */}
            <View style={styles.bentoRow}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoLabel}>Eventos do dia</Text>
                <View style={styles.bentoValueRow}>
                  <Text style={styles.bentoNumber}>{String(filteredItems.length).padStart(2, '0')}</Text>
                  <Text style={styles.bentoUnit}>planejados</Text>
                </View>
              </View>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoLabel}>Total</Text>
                <View style={styles.bentoValueRow}>
                  <Text style={styles.bentoNumber}>{String(items.length).padStart(2, '0')}</Text>
                  <Text style={styles.bentoUnit}>na viagem</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Time Grid ── */}
        {loading ? (
          <ActivityIndicator color={C.secondary} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.timeGridSection}>
            {/* Items sem horário */}
            {untimedItems.length > 0 && (
              <View style={styles.untimedSection}>
                <View style={styles.untimedHeader}>
                  <Text style={styles.untimedTitle}>Sem horário definido</Text>
                </View>
                {untimedItems.map((item) => renderUntimedCard(item))}
              </View>
            )}

            {/* Grade de horários (idêntica no mobile e web) */}
            <View style={styles.gridRow}>
                <View style={styles.hourColumn}>
                  {GRID_HOURS.map(h => (
                    <View key={h} style={styles.hourCell}>
                      <Text style={styles.hourLabel}>{String(h).padStart(2, '0')}:00</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.eventsArea, { height: (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT }]}>
                  {GRID_HOURS.map(h => (
                    <View
                      key={h}
                      style={[styles.gridLine, { top: (h - GRID_START_HOUR) * HOUR_HEIGHT }]}
                    />
                  ))}
                  {timedItems.map((item) => {
                    const catConf = getCategoryConfig(item.category)
                    const top = getTopOffset(item.scheduled_time!)
                    const height = getEventHeight(item.scheduled_time!, item.end_time)
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.eventCard, { top, height: Math.max(height, 40), borderLeftColor: catConf.color }]}
                        onPress={() => openEditModal(item)}
                        activeOpacity={0.85}
                        accessibilityLabel={`${item.title}, ${catConf.label}, ${item.scheduled_time}${item.end_time ? ` até ${item.end_time}` : ''}${item.location ? `, ${item.location}` : ''}`}
                        accessibilityRole="button"
                      >
                        <View style={styles.eventCardInner}>
                          <View style={styles.eventCardMeta}>
                            <View style={[styles.catChip, { backgroundColor: catConf.color + '18', flexShrink: 0 }]}>
                              <Icon name={catConf.icon} size={9} color={catConf.color} />
                              <Text style={[styles.catChipText, { color: catConf.color }]}>{catConf.label}</Text>
                            </View>
                            {item.scheduled_time ? (
                              <Text style={[styles.eventCardTime, { flexShrink: 0 }]}>
                                {item.end_time ? `${item.scheduled_time} – ${item.end_time}` : item.scheduled_time}
                              </Text>
                            ) : null}
                            {item.location ? (
                              item.latitude && item.longitude ? (
                                <TouchableOpacity
                                  onPress={(e) => { e.stopPropagation?.(); openInGoogleMaps(item.latitude!, item.longitude!, item.location ?? undefined) }}
                                  hitSlop={8}
                                  style={styles.eventCardLocRow}
                                >
                                  <Icon name="place" size={9} color="#34C759" />
                                  <Text style={[styles.eventCardLocText, { color: '#34C759' }]} numberOfLines={1}>{item.location}</Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.eventCardLocRow}>
                                  <Icon name="location-on" size={9} color={C.secondary} />
                                  <Text style={styles.eventCardLocText} numberOfLines={1}>{item.location}</Text>
                                </View>
                              )
                            ) : null}
                          </View>
                          <Text style={styles.eventCardTitle} numberOfLines={2}>{item.title}</Text>
                          {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={styles.eventCardThumb} resizeMode="cover" />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={openNewModal} activeOpacity={0.85} accessibilityLabel="Novo evento" accessibilityRole="button">
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal ── */}
      <SheetModal
        visible={modalVisible}
        onClose={handleCloseEventModal}
        title={editingId ? 'Editar evento' : 'Novo evento'}
        subtitle="Preencha os detalhes do evento"
        onDelete={editingId ? handleDelete : undefined}
        deleteDisabled={deleting}
      >
              {/* Image picker */}
              <Text style={styles.sheetLabel}>Foto do evento</Text>
              <ImagePickerComponent
                imageUri={itemImageUri}
                onImageSelected={setItemImageUri}
                aspect={[16, 9]}
                allowsEditing
                uploadFolder="itinerary"
                onUploadingChange={setImageUploading}
              />

              {/* Category picker */}
              <Text style={styles.sheetLabel}>Categoria</Text>
              <HScrollable contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map(cat => {
                  const active = itemCategory === cat.value
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        active && { borderColor: cat.color, backgroundColor: cat.color + '14' },
                      ]}
                      onPress={() => setItemCategory(cat.value)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Categoria ${cat.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Icon name={cat.icon} size={15} color={active ? cat.color : C.secondary} />
                      <Text style={[styles.categoryChipText, active && { color: cat.color, fontWeight: '700' }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </HScrollable>

              {/* Title */}
              <Input
                label="Título *"
                placeholder="Ex: Visita ao museu"
                value={itemTitle}
                onChangeText={setItemTitle}
                size="lg"
                leftIcon={<Icon name="edit-note" size={20} color={C.secondary} />}
                accessibilityLabel="Título do evento"
              />

              {/* Date */}
              <View style={{ marginTop: 16 }}>
                <Input
                  label="Data"
                  placeholder={datePlaceholder}
                  value={itemDate}
                  onChangeText={(v) => setItemDate(applyDateMask(v))}
                  keyboardType="numeric"
                  size="lg"
                  leftIcon={<Icon name="calendar-today" size={18} color={C.secondary} />}
                  accessibilityLabel="Data do evento"
                />
              </View>

              {/* Start + End Time */}
              <View style={[styles.modalRow, { marginTop: 16 }]}>
                <View style={styles.modalCol}>
                  <Input
                    label="Hora Início"
                    placeholder={timePlaceholder}
                    value={itemTime}
                    onChangeText={(v) => setItemTime(applyTimeMask(v))}
                    keyboardType="numeric"
                    size="lg"
                    leftIcon={<Icon name="schedule" size={18} color={C.secondary} />}
                    accessibilityLabel="Hora de início"
                  />
                </View>
                <View style={styles.modalCol}>
                  <Input
                    label="Hora Fim"
                    placeholder={timePlaceholder}
                    value={itemEndTime}
                    onChangeText={(v) => setItemEndTime(applyTimeMask(v))}
                    keyboardType="numeric"
                    size="lg"
                    leftIcon={<Icon name="schedule" size={18} color={C.secondary} />}
                    accessibilityLabel="Hora de término"
                  />
                </View>
              </View>

              {/* Location */}
              <View style={{ marginTop: 16 }}>
                <Input
                  label="Local"
                  placeholder="Ex: Museu do Louvre, Paris"
                  value={itemLocation}
                  onChangeText={setItemLocation}
                  size="lg"
                  leftIcon={<Icon name="location-on" size={20} color={C.secondary} />}
                  accessibilityLabel="Local do evento"
                />
              </View>

              {/* Map picker (opcional) */}
              <TouchableOpacity
                style={styles.mapToggleBtn}
                accessibilityLabel={mapVisible ? 'Ocultar mapa' : itemLat ? 'Ver no mapa' : 'Marcar no mapa'}
                accessibilityRole="button"
                onPress={async () => {
                  if (!mapVisible && !itemLat && itemLocation.trim()) {
                    const coords = await geocodeLocation(itemLocation.trim())
                    if (coords) { setItemLat(coords.lat); setItemLng(coords.lng) }
                  }
                  setMapVisible(!mapVisible)
                }}
                activeOpacity={0.7}
              >
                <Icon name={mapVisible ? 'expand-less' : 'map'} size={16} color={C.accent} />
                <Text style={styles.mapToggleText}>
                  {mapVisible ? 'Ocultar mapa' : itemLat ? 'Ver no mapa' : 'Marcar no mapa'}
                </Text>
                {itemLat != null && <View style={styles.mapPinDot} />}
              </TouchableOpacity>

              {mapVisible && (
                <View style={styles.mapContainer}>
                  <MapView
                    latitude={itemLat}
                    longitude={itemLng}
                    height={200}
                    editable
                    onLocationSelect={(lat, lng) => { setItemLat(lat); setItemLng(lng) }}
                  />
                  {itemLat != null && itemLng != null && (
                    <View style={styles.mapActionsRow}>
                      <TouchableOpacity
                        style={styles.mapGoogleBtn}
                        onPress={() => openInGoogleMaps(itemLat!, itemLng!, itemLocation.trim() || undefined)}
                        accessibilityLabel="Abrir no Google Maps"
                        accessibilityRole="link"
                      >
                        <Icon name="open-in-new" size={14} color={C.accent} />
                        <Text style={styles.mapGoogleText}>Abrir no Google Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.mapClearBtn}
                        onPress={() => { setItemLat(null); setItemLng(null) }}
                        accessibilityLabel="Remover pin do mapa"
                        accessibilityRole="button"
                      >
                        <Icon name="close" size={14} color={C.error} />
                        <Text style={styles.mapClearText}>Remover pin</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Notes */}
              <View style={{ marginTop: 16 }}>
                <Input
                  label="Observações"
                  placeholder="Detalhes, ingressos, dicas..."
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  multiline
                  size="lg"
                  leftIcon={<Icon name="notes" size={20} color={C.secondary} />}
                  accessibilityLabel="Observações do evento"
                />
              </View>

              {/* Save */}
              <View style={{ marginTop: 24 }}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={saving}
                  disabled={saving || deleting || imageUploading}
                  onPress={handleSave}
                >
                  {editingId ? 'Salvar edição' : 'Salvar evento'}
                </Button>
              </View>


      </SheetModal>
    </View>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  headerSubtitle: { fontSize: 12, color: C.secondary, marginTop: 1, maxWidth: 180 },

  scrollContent: { paddingBottom: 20 },

  // Day selector
  daySection: { paddingTop: 20, paddingBottom: 8 },
  daySelectorContent: { paddingHorizontal: 20, gap: 12 },
  dayCard: {
    width: 72, height: 100, borderRadius: 24,
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  dayCardActive: {
    backgroundColor: C.primary, borderColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  dayMonth:      { fontSize: 10, fontWeight: '700', color: C.tertiary, letterSpacing: 0.5 },
  dayNumber:     { fontSize: 28, fontWeight: '800', color: C.primary },
  dayWeekday:    { fontSize: 10, fontWeight: '600', color: C.secondary },
  dayTextActive: { color: '#ffffff' },
  dayDot:        { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary, marginTop: 2 },
  dayDotActive:  { backgroundColor: '#ffffff' },

  // Bento
  bentoRow: { flexDirection: 'row', gap: 12, marginTop: 16, paddingHorizontal: 20 },
  bentoCard: { flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: C.border },
  bentoLabel:    { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bentoNumber:   { fontSize: 28, fontWeight: '800', color: C.primary },
  bentoUnit:     { fontSize: 13, color: C.secondary, fontWeight: '500' },

  // Shared chip + location styles (kept from timeline)
  catChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  catChipText:  { fontSize: 10, fontWeight: '700' },
  timelineLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  timelineLocation:    { fontSize: 12, color: C.secondary, flex: 1 },
  timelineDesc:        { fontSize: 12, color: C.secondary, marginTop: 6, lineHeight: 17 },

  // Empty state
  emptyState:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyStateText:{ fontSize: 14, color: C.tertiary },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 0.5, borderColor: C.accent,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4,
  },
  emptyAddBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute', bottom: 36, right: 24,
    width: 58, height: 58, borderRadius: 18, backgroundColor: C.buttonPrimary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },

  // Sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetContainer: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  modalHandle: {
    width: 48, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center', marginBottom: 24,
  },
  sheetHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  modalTitle:    { fontSize: 22, fontWeight: '800', color: C.primary, marginBottom: 2 },
  modalSubtitle: { fontSize: 14, color: C.secondary, marginBottom: 4 },
  modalRow:      { flexDirection: 'row', gap: 10 },
  modalCol:      { flex: 1 },

  sheetScroll: { paddingHorizontal: 24, paddingBottom: 34 },
  sheetLabel: {
    fontSize: 10, fontWeight: '700', color: C.secondary,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginLeft: 4, marginBottom: 8, marginTop: 16,
  },
  sheetInputRow: {
    backgroundColor: C.surfaceHigh, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 4,
  },
  sheetInputRowMultiline: { alignItems: 'flex-start', paddingVertical: 14 },
  sheetInput:          { flex: 1, fontSize: 15, color: C.primary, marginLeft: 10, paddingVertical: 14, padding: 0 },
  sheetInputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingVertical: 0 },

  // Category chips
  categoryScroll: { gap: 8, paddingVertical: 2 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 24, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surfaceHigh,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: C.secondary },

  // Map picker
  mapToggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 4,
  },
  mapToggleText: { fontSize: 13, fontWeight: '600', color: C.accent },
  mapPinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  mapContainer: { marginTop: 8 },
  mapActionsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8,
  },
  mapGoogleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4,
  },
  mapGoogleText: { fontSize: 12, color: C.accent, fontWeight: '600' },
  mapClearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4,
  },
  mapClearText: { fontSize: 12, color: C.error, fontWeight: '500' },
  mapLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mapLinkText: { fontSize: 12, color: '#34C759', fontWeight: '500', flex: 1 },

  // Buttons
  primaryBtn: {
    backgroundColor: C.buttonPrimary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.buttonPrimary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelSheetBtn:    { borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', marginTop: 10 },
  cancelSheetBtnText:{ fontSize: 15, fontWeight: '700', color: C.primary },
  deleteBtn:         { marginTop: 12, borderWidth: 0.5, borderColor: C.error, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText:     { color: C.error, fontSize: 14, fontWeight: '600' },

  // Time Grid
  timeGridSection: { paddingHorizontal: 20, marginTop: 16 },
  untimedSection: { marginBottom: 20 },
  untimedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  untimedTitle: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 1 },
  untimedCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 12,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 4,
    marginBottom: 8,
  },
  untimedCardTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginTop: 4 },
  gridRow: { flexDirection: 'row' },
  hourColumn: { width: 44 },
  hourCell: { height: HOUR_HEIGHT, justifyContent: 'flex-start', paddingTop: 0 },
  hourLabel: { fontSize: 10, fontWeight: '700', color: C.tertiary, textAlign: 'right', paddingRight: 8, transform: [{ translateY: -6 }] },
  eventsArea: { flex: 1, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 0.5, backgroundColor: C.border },
  eventCard: {
    position: 'absolute', left: 4, right: 4,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  eventCardRow: { flexDirection: 'row', flex: 1, overflow: 'hidden' },
  eventCardInner: { padding: 8, flexDirection: 'column' },
  eventCardThumb: { width: '100%', height: 100, marginTop: 8, borderRadius: 14 },
  eventCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'nowrap' },
  eventCardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 },
  eventCardLocText: { fontSize: 10, color: C.secondary, flexShrink: 1 },
  eventCardTitle: { fontSize: 13, fontWeight: '700', color: C.primary, marginTop: 3, marginBottom: 2 },
  eventCardTime: { fontSize: 10, fontWeight: '600', color: C.secondary },
})
