import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator
} from 'react-native'
import Icon from '../components/Icon'
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

type ItineraryItem = {
  id: string
  title: string
  description: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  location: string | null
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

function formatDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ItineraryScreen() {
  const params = useLocalSearchParams()
  const tripId = String(params.id || '')
  const tripTitle = String(params.title || '')
  const startDate = String(params.start_date || '')
  const endDate = String(params.end_date || '')

  const days = getDaysArray(startDate, endDate)

  const [selectedDate, setSelectedDate] = useState<string | null>(days[0] || null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [itemTitle, setItemTitle] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemDate, setItemDate] = useState('')
  const [itemTime, setItemTime] = useState('')
  const [itemLocation, setItemLocation] = useState('')

  const datePlaceholder = getLocalDatePlaceholder()
  const timePlaceholder = getLocalTimePlaceholder()

  useFocusEffect(
    useCallback(() => {
      loadItems()
    }, [tripId])
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
    setItemLocation('')
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
    setItemLocation(item.location || '')
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
        trip_id: tripId,
        user_id: user.id,
        title: itemTitle.trim(),
        description: itemDescription.trim() || null,
        scheduled_date: dateISO,
        scheduled_time: timeVal,
        location: itemLocation.trim() || null,
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
        text: t('delete_label'),
        style: 'destructive',
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
      {/* Header */}
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
        {/* Day Selector */}
        {days.length > 0 && (
          <View style={styles.daySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorContent}
            >
              {days.map((day, idx) => {
                const d = new Date(day + 'T00:00:00')
                const isActive = day === selectedDate
                const monthStr = d.toLocaleDateString(getDeviceLocale(), { month: 'short' })
                  .replace('.', '').toUpperCase()
                const weekdayStr = d.toLocaleDateString(getDeviceLocale(), { weekday: 'short' })
                  .replace('.', '').toUpperCase()
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCard, isActive && styles.dayCardActive]}
                    onPress={() => setSelectedDate(isActive ? null : day)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayMonth, isActive && styles.dayTextActive]}>{monthStr}</Text>
                    <Text style={[styles.dayNumber, isActive && styles.dayTextActive]}>{d.getDate()}</Text>
                    <Text style={[styles.dayWeekday, isActive && styles.dayTextActive]}>{weekdayStr}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* Bento summary */}
            <View style={styles.bentoRow}>
              <View style={styles.bentoCard}>
                <Text style={styles.bentoLabel}>Eventos</Text>
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

        {/* Timeline section */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineTitleRow}>
            <Text style={styles.timelineSectionTitle}>
              {selectedDate ? 'Eventos do dia' : 'Todos os eventos'}
            </Text>
            <View style={styles.timelineTitleLine} />
          </View>

          {loading ? (
            <ActivityIndicator color={C.secondary} style={{ marginTop: 32 }} />
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="event-note" size={36} color={C.tertiary} />
              <Text style={styles.emptyStateText}>Nenhum item no roteiro</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openNewModal} activeOpacity={0.8}>
                <Icon name="add" size={14} color={C.accent} />
                <Text style={styles.emptyAddBtnText}>Adicionar item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timeline}>
              {filteredItems.map((item, idx) => (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Left: dot + line */}
                  <View style={styles.timelineLeftCol}>
                    <View style={styles.timelineDot} />
                    {idx < filteredItems.length - 1 && <View style={styles.timelineConnector} />}
                  </View>
                  {/* Right: time + card */}
                  <View style={styles.timelineRightCol}>
                    {item.scheduled_time ? (
                      <Text style={styles.timelineTime}>{item.scheduled_time}</Text>
                    ) : item.scheduled_date ? (
                      <Text style={styles.timelineTime}>{formatDate(item.scheduled_date)}</Text>
                    ) : null}
                    <TouchableOpacity
                      style={styles.timelineCard}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.timelineCardTitle}>{item.title}</Text>
                      {item.location ? (
                        <View style={styles.timelineLocationRow}>
                          <Icon name="location-on" size={13} color={C.secondary} />
                          <Text style={styles.timelineLocation}>{item.location}</Text>
                        </View>
                      ) : null}
                      {item.description ? (
                        <Text style={styles.timelineDesc}>{item.description}</Text>
                      ) : null}
                      <Text style={styles.editHint}>Toque para editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openNewModal} activeOpacity={0.85}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.fullScreenContainer}>
          <KeyboardAvoidingView
            style={styles.fullScreenKeyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.fullScreenScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fullScreenBox}>
                  <View style={styles.modalHandle} />

                  <Text style={styles.modalTitle}>{editingId ? 'Editar evento' : 'Novo evento'}</Text>
                  <Text style={styles.modalSubtitle}>Preencha os detalhes do evento</Text>

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

                  <View style={styles.modalRow}>
                    <View style={styles.modalCol}>
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
                    </View>
                    <View style={styles.modalCol}>
                      <Text style={styles.sheetLabel}>Horario</Text>
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
                  </View>

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

                  <TouchableOpacity
                    style={styles.cancelSheetBtn}
                    onPress={handleCloseEventModal}
                  >
                    <Text style={styles.cancelSheetBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  {editingId ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={handleDelete}
                      disabled={deleting || saving}
                    >
                      <Text style={styles.deleteBtnText}>{deleting ? 'Excluindo...' : 'Excluir item'}</Text>
                    </TouchableOpacity>
                  ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  headerSubtitle: { fontSize: 12, color: C.secondary, marginTop: 1, maxWidth: 180 },

  scrollContent: { paddingBottom: 20 },

  // Day selector
  daySection: { paddingTop: 20, paddingBottom: 8 },
  daySelectorContent: { paddingHorizontal: 20, gap: 12 },
  dayCard: {
    width: 72, height: 100, borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dayMonth: { fontSize: 10, fontWeight: '700', color: C.tertiary, letterSpacing: 0.5 },
  dayNumber: { fontSize: 28, fontWeight: '800', color: C.primary },
  dayWeekday: { fontSize: 10, fontWeight: '600', color: C.secondary },
  dayTextActive: { color: '#ffffff' },

  // Bento
  bentoRow: { flexDirection: 'row', gap: 12, marginTop: 16, paddingHorizontal: 20 },
  bentoCard: {
    flex: 1, backgroundColor: C.surfaceHigh,
    borderRadius: 20, padding: 16,
    borderWidth: 0.5, borderColor: C.border,
  },
  bentoLabel: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bentoNumber: { fontSize: 28, fontWeight: '800', color: C.primary },
  bentoUnit: { fontSize: 13, color: C.secondary, fontWeight: '500' },

  // Timeline
  timelineSection: { paddingHorizontal: 20, marginTop: 24 },
  timelineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  timelineSectionTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  timelineTitleLine: { flex: 1, height: 1, backgroundColor: C.border },

  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineLeftCol: { alignItems: 'center', width: 22 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 3, borderColor: C.primary,
    marginTop: 4, zIndex: 1,
  },
  timelineConnector: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 2, marginBottom: -4 },
  timelineRightCol: { flex: 1, paddingBottom: 24 },
  timelineTime: { fontSize: 11, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  timelineCard: {
    backgroundColor: C.surface,
    borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineCardTitle: { fontSize: 15, fontWeight: '700', color: C.primary, marginBottom: 4 },
  timelineLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  timelineLocation: { fontSize: 12, color: C.secondary, flex: 1 },
  timelineDesc: { fontSize: 12, color: C.secondary, marginTop: 6, lineHeight: 17 },
  editHint: { fontSize: 11, color: C.accent, marginTop: 10, fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyStateText: { fontSize: 14, color: C.tertiary },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 0.5, borderColor: C.accent,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4,
  },
  emptyAddBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute', bottom: 36, right: 24,
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  fullScreenContainer: { flex: 1, backgroundColor: C.background },
  fullScreenKeyboard: { flex: 1 },
  fullScreenScroll: { flexGrow: 1 },
  fullScreenBox: { flex: 1, backgroundColor: C.background, padding: 24, paddingTop: 50, paddingBottom: 32 },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 48, borderTopRightRadius: 48,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 44,
  },
  modalHandle: {
    width: 48, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center', marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: C.primary, marginBottom: 2 },
  modalSubtitle: { fontSize: 14, color: C.secondary, marginBottom: 4 },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalCol: { flex: 1 },
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
  sheetInput: { flex: 1, fontSize: 15, color: C.primary, marginLeft: 10, paddingVertical: 14, padding: 0 },
  sheetInputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingVertical: 0 },
  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelSheetBtn: {
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', marginTop: 10,
  },
  cancelSheetBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },
  deleteBtn: {
    marginTop: 12, borderWidth: 0.5, borderColor: C.error,
    borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  deleteBtnText: { color: C.error, fontSize: 14, fontWeight: '600' },
})
