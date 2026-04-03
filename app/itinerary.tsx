import {
  View, Text, TouchableOpacity, Pressable, Image,
  StyleSheet, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator
} from 'react-native'
import Icon from '../components/Icon'
import ImagePickerComponent from '../components/ImagePicker'
import { useState, useCallback } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t, getDeviceLocale } from '../lib/i18n'
import {
  applyDateMask, applyTimeMask,
  formatDateForInput,
  getLocalDatePlaceholder, getLocalTimePlaceholder,
  toISODateOrNull, toTimeOrNull
} from '../lib/date-locale'

const C = Colors.dark

const CATEGORIES = [
  { value: 'flight',        label: 'Voo',         icon: 'flight' as const,         color: '#000000' },
  { value: 'transport',     label: 'Transporte',  icon: 'directions-car' as const, color: '#32ADE6' },
  { value: 'accommodation', label: 'Hospedagem',  icon: 'hotel' as const,          color: '#5856D6' },
  { value: 'food',          label: 'Alimentação', icon: 'restaurant' as const,     color: '#FF9500' },
  { value: 'sightseeing',   label: 'Passeio',     icon: 'place' as const,          color: '#34C759' },
  { value: 'event',         label: 'Evento',      icon: 'event' as const,          color: '#FF2D55' },
  { value: 'shopping',      label: 'Compras',     icon: 'shopping-bag' as const,   color: '#AF52DE' },
  { value: 'free',          label: 'Livre',       icon: 'beach-access' as const,   color: '#8E8E93' },
]

function getCategoryConfig(value?: string | null) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[6]
}

type ItineraryItem = {
  id: string
  title: string
  description: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  end_time: string | null
  location: string | null
  image_url: string | null
  category: string | null
  created_at: string
}

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
  const [items, setItems]               = useState<ItineraryItem[]>([])
  const [loading, setLoading]           = useState(true)

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

  const datePlaceholder = getLocalDatePlaceholder()
  const timePlaceholder = getLocalTimePlaceholder()

  useFocusEffect(
    useCallback(() => { loadItems() }, [tripId])
  )

  async function loadItems() {
    if (!tripId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }

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
    setModalVisible(true)
  }

  function handleCloseEventModal() {
    setModalVisible(false)
    resetForm()
  }

  async function handleSave() {
    if (!itemTitle.trim()) {
      Alert.alert(t('attention_title'), t('required_itinerary_fields'))
      return
    }
    const dateISO = toISODateOrNull(itemDate)
    if (itemDate.trim() && !dateISO) {
      Alert.alert(t('attention_title'), t('invalid_itinerary_date'))
      return
    }
    const timeVal = toTimeOrNull(itemTime)
    if (itemTime.trim() && !timeVal) {
      Alert.alert(t('attention_title'), t('invalid_itinerary_time'))
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('session_expired'))
      const payload = {
        trip_id:        tripId,
        user_id:        user.id,
        title:          itemTitle.trim(),
        description:    itemDescription.trim() || null,
        scheduled_date: dateISO,
        scheduled_time: timeVal,
        end_time:       toTimeOrNull(itemEndTime),
        location:       itemLocation.trim() || null,
        category:       itemCategory,
        image_url:      itemImageUri || null,
      }
      const request = editingId
        ? supabase.from('itinerary_items').update(payload).eq('id', editingId)
        : supabase.from('itinerary_items').insert(payload)
      const { error } = await request
      if (error) throw error
      setModalVisible(false)
      resetForm()
      loadItems()
    } catch (err: any) {
      Alert.alert(t('error_title'), err?.message || t('save_itinerary_failed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    Alert.alert(t('confirm_delete_itinerary_title'), t('confirm_delete_itinerary_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'), style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            const { error } = await supabase.from('itinerary_items').delete().eq('id', editingId)
            if (error) throw error
            setModalVisible(false)
            resetForm()
            loadItems()
          } catch (err: any) {
            Alert.alert(t('error_title'), err?.message || t('delete_itinerary_failed'))
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

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Icon name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Roteiro</Text>
          {tripTitle ? <Text style={styles.headerSubtitle} numberOfLines={1}>{tripTitle}</Text> : null}
        </View>
        <TouchableOpacity onPress={openNewModal} style={styles.headerBtn} activeOpacity={0.7}>
          <Icon name="add-circle" size={26} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Day Selector ── */}
        {days.length > 0 && (
          <View style={styles.daySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorContent}>
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
                  >
                    <Text style={[styles.dayMonth,   isActive && styles.dayTextActive]}>{monthStr}</Text>
                    <Text style={[styles.dayNumber,  isActive && styles.dayTextActive]}>{d.getDate()}</Text>
                    <Text style={[styles.dayWeekday, isActive && styles.dayTextActive]}>{weekdayStr}</Text>
                    {hasDayItems && <View style={[styles.dayDot, isActive && styles.dayDotActive]} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

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
            {filteredItems.filter(i => !i.scheduled_time).length > 0 && (
              <View style={styles.untimedSection}>
                <Text style={styles.untimedTitle}>Sem horário definido</Text>
                {filteredItems.filter(i => !i.scheduled_time).map((item) => {
                  const catConf = getCategoryConfig(item.category)
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.untimedCard, { borderLeftColor: catConf.color }]}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.catChip, { backgroundColor: catConf.color + '18' }]}>
                        <Icon name={catConf.icon} size={10} color={catConf.color} />
                        <Text style={[styles.catChipText, { color: catConf.color }]}>{catConf.label}</Text>
                      </View>
                      <Text style={styles.untimedCardTitle}>{item.title}</Text>
                      {item.location ? (
                        <View style={styles.timelineLocationRow}>
                          <Icon name="location-on" size={12} color={C.secondary} />
                          <Text style={styles.timelineLocation}>{item.location}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Grade de horários — sempre visível */}
            <View style={styles.gridRow}>
              {/* Coluna de horas */}
              <View style={styles.hourColumn}>
                {GRID_HOURS.map(h => (
                  <View key={h} style={styles.hourCell}>
                    <Text style={styles.hourLabel}>{String(h).padStart(2, '0')}:00</Text>
                  </View>
                ))}
              </View>

              {/* Área de eventos */}
              <View style={[styles.eventsArea, { height: (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT }]}>
                {/* Linhas da grade */}
                {GRID_HOURS.map(h => (
                  <View
                    key={h}
                    style={[styles.gridLine, { top: (h - GRID_START_HOUR) * HOUR_HEIGHT }]}
                  />
                ))}

                {/* Cards de eventos posicionados absolutamente */}
                {filteredItems.filter(i => !!i.scheduled_time).map((item) => {
                    const catConf = getCategoryConfig(item.category)
                    const top = getTopOffset(item.scheduled_time!)
                    const height = getEventHeight(item.scheduled_time!, item.end_time)
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.eventCard, { top, height: Math.max(height, 40), borderLeftColor: catConf.color }]}
                        onPress={() => openEditModal(item)}
                        activeOpacity={0.85}
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
                              <View style={styles.eventCardLocRow}>
                                <Icon name="location-on" size={9} color={C.secondary} />
                                <Text style={styles.eventCardLocText} numberOfLines={1}>{item.location}</Text>
                              </View>
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
      <TouchableOpacity style={styles.fab} onPress={openNewModal} activeOpacity={0.85}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseEventModal} />
          <View style={styles.sheetContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{editingId ? 'Editar evento' : 'Novo evento'}</Text>
                <Text style={styles.modalSubtitle}>Preencha os detalhes do evento</Text>
              </View>
              {editingId ? (
                <TouchableOpacity style={styles.sheetDeleteBtn} onPress={handleDelete} disabled={deleting}>
                  <Icon name="delete-outline" size={20} color={C.error} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleCloseEventModal}>
                <Icon name="close" size={20} color={C.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Image picker */}
              <Text style={styles.sheetLabel}>Foto do evento</Text>
              <ImagePickerComponent
                imageUri={itemImageUri}
                onImageSelected={setItemImageUri}
                aspect={[16, 9]}
                allowsEditing
              />

              {/* Category picker */}
              <Text style={styles.sheetLabel}>Categoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
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
                    >
                      <Icon name={cat.icon} size={15} color={active ? cat.color : C.secondary} />
                      <Text style={[styles.categoryChipText, active && { color: cat.color, fontWeight: '700' }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              {/* Title */}
              <Text style={styles.sheetLabel}>Titulo *</Text>
              <View style={styles.sheetInputRow}>
                <Icon name="edit-note" size={20} color={C.secondary} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Ex: Visita ao museu"
                  placeholderTextColor={C.tertiary}
                  value={itemTitle}
                  onChangeText={setItemTitle}
                />
              </View>

              {/* Date */}
              <Text style={styles.sheetLabel}>Data</Text>
              <View style={styles.sheetInputRow}>
                <Icon name="calendar-today" size={18} color={C.secondary} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder={datePlaceholder}
                  placeholderTextColor={C.tertiary}
                  value={itemDate}
                  onChangeText={(v) => setItemDate(applyDateMask(v))}
                  keyboardType="numeric"
                />
              </View>

              {/* Start + End Time */}
              <View style={styles.modalRow}>
                <View style={styles.modalCol}>
                  <Text style={styles.sheetLabel}>Hora Início</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="schedule" size={18} color={C.secondary} />
                    <TextInput
                      style={styles.sheetInput}
                      placeholder={timePlaceholder}
                      placeholderTextColor={C.tertiary}
                      value={itemTime}
                      onChangeText={(v) => setItemTime(applyTimeMask(v))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.sheetLabel}>Hora Fim</Text>
                  <View style={styles.sheetInputRow}>
                    <Icon name="schedule" size={18} color={C.secondary} />
                    <TextInput
                      style={styles.sheetInput}
                      placeholder={timePlaceholder}
                      placeholderTextColor={C.tertiary}
                      value={itemEndTime}
                      onChangeText={(v) => setItemEndTime(applyTimeMask(v))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Location */}
              <Text style={styles.sheetLabel}>Local</Text>
              <View style={styles.sheetInputRow}>
                <Icon name="location-on" size={20} color={C.secondary} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Ex: Museu do Louvre, Paris"
                  placeholderTextColor={C.tertiary}
                  value={itemLocation}
                  onChangeText={setItemLocation}
                />
              </View>

              {/* Notes */}
              <Text style={styles.sheetLabel}>Observacoes</Text>
              <View style={[styles.sheetInputRow, styles.sheetInputRowMultiline]}>
                <Icon name="notes" size={20} color={C.secondary} />
                <TextInput
                  style={[styles.sheetInput, styles.sheetInputMultiline]}
                  placeholder="Detalhes, ingressos, dicas..."
                  placeholderTextColor={C.tertiary}
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  multiline
                />
              </View>

              {/* Save */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSave}
                disabled={saving || deleting}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{editingId ? 'Salvar edicao' : 'Salvar evento'}</Text>
                )}
              </TouchableOpacity>


            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    width: 58, height: 58, borderRadius: 18, backgroundColor: C.primary,
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
  sheetCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHigh,
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

  // Buttons
  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelSheetBtn:    { borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', marginTop: 10 },
  cancelSheetBtnText:{ fontSize: 15, fontWeight: '700', color: C.primary },
  sheetDeleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF0EF', marginRight: 16,
  },
  deleteBtn:         { marginTop: 12, borderWidth: 0.5, borderColor: C.error, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText:     { color: C.error, fontSize: 14, fontWeight: '600' },

  // Time Grid
  timeGridSection: { paddingHorizontal: 20, marginTop: 16 },
  untimedSection: { marginBottom: 20 },
  untimedTitle: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
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
