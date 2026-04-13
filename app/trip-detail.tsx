import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Modal, Platform,
  Pressable, useWindowDimensions
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t, getDeviceLocale } from '../lib/i18n'
import Icon from '../components/Icon'
import { showAlert } from '../lib/alert'
import { shareAsText, shareAsPDF } from '../lib/share-trip'
import DesktopLayout from '../components/DesktopLayout'
import TripShareSheet from '../components/TripShareSheet'
import { formatBRL } from '../lib/currency'
import { useResponsive } from '../hooks/useResponsive'
import { ITINERARY_CATEGORY_CONF, EXPENSE_CATEGORY_CONF } from '../constants/categories'
import { useTripStore } from '../stores/useTripStore'
import FlightSection from '../components/FlightSection'
import AccommodationSection from '../components/AccommodationSection'
import FlightFormModal from '../components/FlightFormModal'
import AccommodationFormModal from '../components/AccommodationFormModal'
import type { Flight, Accommodation } from '../types'

const C = Colors.dark

function formatDate(date: string) {
  if (!date) return '--'
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date
  return parsedDate.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function TripDetailScreen() {
  const { width: windowWidth } = useWindowDimensions()
  const { isDesktop } = useResponsive()
  const CARD_WIDTH = isDesktop ? Math.min(340, (windowWidth - 300) / 2) : windowWidth - 40
  const { id } = useLocalSearchParams()
  const tripId = String(id || '')

  // ── Store ──
  const { trip, flights, accommodations, expenses, itineraryItems, loadAll, loadFlights, loadAccommodations } = useTripStore()

  useFocusEffect(
    useCallback(() => {
      if (tripId) loadAll(tripId)
    }, [tripId])
  )

  // ── Local UI state ──
  const [flightsModalVisible, setFlightsModalVisible] = useState(false)
  const [accommodationModalVisible, setAccommodationModalVisible] = useState(false)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)
  const [tripMenuVisible, setTripMenuVisible] = useState(false)
  const [shareMenuVisible, setShareMenuVisible] = useState(false)
  const [tripShareSheetVisible, setTripShareSheetVisible] = useState(false)
  const [activeFlightIndex, setActiveFlightIndex] = useState(0)
  const [activeAccomIndex, setActiveAccomIndex] = useState(0)

  // ── Flight modal handlers ──
  function openNewFlightModal() {
    setEditingFlight(null)
    setFlightsModalVisible(true)
  }
  function openEditFlightModal(flight: Flight) {
    setEditingFlight(flight)
    setFlightsModalVisible(true)
  }
  function handleFlightSaved() {
    setFlightsModalVisible(false)
    setEditingFlight(null)
    loadFlights(tripId)
  }

  // ── Accommodation modal handlers ──
  function openNewAccommodationModal() {
    setEditingAccommodation(null)
    setAccommodationModalVisible(true)
  }
  function openEditAccommodationModal(accommodation: Accommodation) {
    setEditingAccommodation(accommodation)
    setAccommodationModalVisible(true)
  }
  function handleAccommodationSaved() {
    setAccommodationModalVisible(false)
    setEditingAccommodation(null)
    loadAccommodations(tripId)
  }

  // ── Trip actions ──
  function handleDelete() {
    showAlert(t('confirm_delete_trip_title'), t('confirm_delete_trip_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'), style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trips').delete().eq('id', tripId)
          if (!error) router.back()
          else showAlert(t('error_title'), t('delete_trip_failed'))
        }
      }
    ])
  }

  function handleEdit() {
    if (!trip) return
    router.push({
      pathname: '/edit-trip',
      params: {
        id: trip.id, title: trip.title, destination: trip.destination,
        start_date: trip.start_date || '', end_date: trip.end_date || '',
        cover_image: trip.cover_image || '',
        budget: trip.budget != null ? String(trip.budget) : '',
        budget_currency: trip.budget_currency || 'R$',
      }
    })
  }

  async function handleShareText() {
    setShareMenuVisible(false)
    try { await shareAsText(tripId) }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível compartilhar'
      showAlert('Erro', msg)
    }
  }

  async function handleSharePDF() {
    setShareMenuVisible(false)
    try { await shareAsPDF(tripId) }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível gerar o PDF'
      showAlert('Erro', msg)
    }
  }

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <DesktopLayout fullWidth={isDesktop}>
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={[styles.heroCard, isDesktop && styles.heroCardDesktop]}>
          <View style={[styles.heroImageWrap, isDesktop && styles.heroImageWrapDesktop, !isDesktop && styles.heroImageWrapMobile]}>
            {trip.cover_image ? (
              <Image source={{ uri: trip.cover_image }} style={styles.heroImage} resizeMode="cover" accessibilityLabel={`Capa da viagem ${trip.title}`} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Icon name="flight" size={48} color={C.tertiary} />
              </View>
            )}

            <View style={[
              styles.heroOverlay,
              Platform.OS === 'web'
                ? { backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 55%, transparent 100%)' } as any
                : { backgroundColor: 'rgba(0,0,0,0.38)' }
            ]}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle} numberOfLines={2} accessibilityRole="header">{trip.title}</Text>
                <Text style={styles.heroDestination}>{trip.destination}</Text>
                {(trip.start_date || trip.end_date) && (
                  <View style={styles.heroDatesRow}>
                    <View style={styles.heroDateBox}>
                      <Text style={styles.heroDateLabel}>Ida</Text>
                      <Text style={styles.heroDateValue}>{formatDate(trip.start_date)}</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroDateBox}>
                      <Text style={styles.heroDateLabel}>Volta</Text>
                      <Text style={styles.heroDateValue}>{formatDate(trip.end_date)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Voltar" accessibilityRole="button">
              <Icon name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topRightBtns}>
              <TouchableOpacity style={styles.topBtn} onPress={() => setShareMenuVisible(true)} accessibilityLabel="Compartilhar" accessibilityRole="button">
                <Icon name="share" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={() => setTripMenuVisible(true)} accessibilityLabel="Menu da viagem" accessibilityRole="button">
                <Icon name="more-vert" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.content, isDesktop && styles.contentDesktop]}>

          {/* ── Flights ── */}
          <FlightSection
            flights={flights}
            cardWidth={CARD_WIDTH}
            isDesktop={isDesktop}
            activeIndex={activeFlightIndex}
            onIndexChange={setActiveFlightIndex}
            onAdd={openNewFlightModal}
            onEdit={openEditFlightModal}
          />

          {/* ── Accommodations ── */}
          <AccommodationSection
            accommodations={accommodations}
            cardWidth={CARD_WIDTH}
            isDesktop={isDesktop}
            activeIndex={activeAccomIndex}
            onIndexChange={setActiveAccomIndex}
            onAdd={openNewAccommodationModal}
            onEdit={openEditAccommodationModal}
          />

          {/* ── Itinerary preview ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Roteiro</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push({ pathname: '/itinerary', params: { id: tripId, title: trip.title, start_date: trip.start_date, end_date: trip.end_date } })}
              accessibilityLabel="Abrir roteiro"
              accessibilityRole="button"
            >
              <Icon name="add" size={20} color={C.icon} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.itineraryCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/itinerary', params: { id: tripId, title: trip.title, start_date: trip.start_date, end_date: trip.end_date } })}
            accessibilityLabel="Ver roteiro completo"
            accessibilityRole="button"
          >
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const upcoming = itineraryItems
                .filter(i => i.scheduled_date && i.scheduled_date >= today)
                .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || '') || (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
                .slice(0, 3)

              return (
                <>
                  {upcoming.length === 0 ? (
                    <View style={styles.itineraryEmptyState}>
                      <Icon name="event-available" size={24} color={C.tertiary} />
                      <Text style={styles.itineraryEmptyText}>Nenhum evento programado</Text>
                    </View>
                  ) : (
                    upcoming.map((item, idx) => {
                      const conf = ITINERARY_CATEGORY_CONF[item.category || 'free'] ?? ITINERARY_CATEGORY_CONF['free']
                      const dateLabel = item.scheduled_date
                        ? new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                        : null
                      return (
                        <View key={item.id} style={[styles.itineraryPreviewItem, { borderLeftColor: conf.color }, idx < upcoming.length - 1 && { marginBottom: 8 }]}>
                          <View style={styles.itineraryPreviewInner}>
                            <View style={styles.itineraryPreviewTopRow}>
                              <View style={[styles.itineraryPreviewIcon, { backgroundColor: conf.color + '18' }]}>
                                <Icon name={conf.icon as string} size={13} color={conf.color} />
                              </View>
                              <Text style={[styles.itineraryPreviewCat, { color: conf.color }]}>{item.category || 'Livre'}</Text>
                            </View>
                            <Text style={styles.itineraryPreviewTitle} numberOfLines={1}>{item.title}</Text>
                            {[dateLabel, item.scheduled_time, item.location].filter(Boolean).length > 0 && (
                              <Text style={styles.itineraryPreviewMeta} numberOfLines={1}>
                                {[dateLabel, item.scheduled_time, item.location].filter(Boolean).join('  ·  ')}
                              </Text>
                            )}
                          </View>
                        </View>
                      )
                    })
                  )}
                </>
              )
            })()}
          </TouchableOpacity>

          {/* ── Expenses preview ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gastos</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title, openNew: '1' } })}
              accessibilityLabel="Adicionar gasto"
              accessibilityRole="button"
            >
              <Icon name="add" size={20} color={C.icon} />
            </TouchableOpacity>
          </View>
          {expenses.length === 0 ? (
            <TouchableOpacity
              style={styles.expensesEmptyCard}
              onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title } })}
              activeOpacity={0.85}
              accessibilityLabel="Registrar gastos"
              accessibilityRole="button"
            >
              <Icon name="account-balance-wallet" size={28} color={C.tertiary} />
              <Text style={styles.expensesEmptyText}>Nenhum gasto registrado</Text>
              <Text style={styles.expensesEmptySubtext}>Toque para registrar seus gastos</Text>
            </TouchableOpacity>
          ) : (() => {
            const total = expenses.reduce((sum, e) => sum + e.amount, 0)
            const currency = expenses[expenses.length - 1]?.currency || 'R$'
            const recent = [...expenses].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
            const categoryTotals = Object.entries(
              expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1]).slice(0, 4)
            const maxCat = categoryTotals[0]?.[1] || 1
            return (
              <TouchableOpacity
                style={styles.expensesCard}
                onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title } })}
                activeOpacity={0.85}
                accessibilityLabel={`Total gasto: ${currency} ${formatBRL(total)}`}
                accessibilityRole="button"
              >
                <View style={styles.expensesBentoTotal}>
                  <Text style={styles.expensesBentoTotalLabel}>Total gasto</Text>
                  <Text style={styles.expensesBentoTotalValue} numberOfLines={1} adjustsFontSizeToFit>
                    {currency} {formatBRL(total)}
                  </Text>
                  <Text style={styles.expensesBentoCountInline}>
                    {expenses.length} {expenses.length === 1 ? 'lançamento' : 'lançamentos'}
                  </Text>
                </View>

                <View style={styles.expensesCatSection}>
                  {categoryTotals.map(([cat, amt]) => {
                    const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                    const pct = (amt / maxCat) * 100
                    return (
                      <View key={cat} style={styles.expensesCatRow}>
                        <View style={styles.expensesCatLeft}>
                          <Icon name={conf.icon as string} size={12} color={conf.color} />
                          <Text style={styles.expensesCatLabel} numberOfLines={1}>{cat}</Text>
                        </View>
                        <View style={styles.expensesCatBarTrack}>
                          <View style={[styles.expensesCatBar, { width: `${pct}%` as any, backgroundColor: conf.color }]} />
                        </View>
                        <Text style={styles.expensesCatAmt}>{currency} {formatBRL(amt)}</Text>
                      </View>
                    )
                  })}
                </View>

                <View style={styles.expensesDivider} />

                {recent.map((e, idx) => {
                  const conf = EXPENSE_CATEGORY_CONF[e.category] ?? EXPENSE_CATEGORY_CONF['Outros']
                  return (
                    <View key={e.id} style={[styles.expensesRecentRow, idx < recent.length - 1 && styles.expensesRecentRowBorder]}>
                      <View style={[styles.expensesRecentIcon, { backgroundColor: conf.color + '18' }]}>
                        <Icon name={conf.icon as string} size={14} color={conf.color} />
                      </View>
                      <View style={styles.expensesRecentMid}>
                        <Text style={styles.expensesRecentCat}>{e.category}</Text>
                        {e.description ? <Text style={styles.expensesRecentDesc} numberOfLines={1}>{e.description}</Text> : null}
                      </View>
                      <Text style={styles.expensesRecentAmt}>{e.currency} {formatBRL(e.amount)}</Text>
                    </View>
                  )
                })}
              </TouchableOpacity>
            )
          })()}

          {/* ── Checklist ── */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Checklist</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push({ pathname: '/checklist', params: { id: trip.id, title: trip.title } })}
                accessibilityLabel="Abrir checklist"
                accessibilityRole="button"
              >
                <Icon name="open-in-new" size={20} color={C.icon} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.checklistCard}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/checklist', params: { id: trip.id, title: trip.title } })}
              accessibilityLabel="Lista de bagagem e tarefas"
              accessibilityRole="button"
            >
              <Icon name="checklist" size={28} color={C.tertiary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checklistCardTitle}>Lista de bagagem e tarefas</Text>
                <Text style={styles.checklistCardSub}>Organize o que levar e o que fazer</Text>
              </View>
              <Icon name="chevron-right" size={20} color={C.tertiary} />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* ── Flight Form Modal ── */}
      <FlightFormModal
        visible={flightsModalVisible}
        tripId={tripId}
        editingFlight={editingFlight}
        onClose={() => { setFlightsModalVisible(false); setEditingFlight(null) }}
        onSaved={handleFlightSaved}
      />

      {/* ── Accommodation Form Modal ── */}
      <AccommodationFormModal
        visible={accommodationModalVisible}
        tripId={tripId}
        editingAccommodation={editingAccommodation}
        onClose={() => { setAccommodationModalVisible(false); setEditingAccommodation(null) }}
        onSaved={handleAccommodationSaved}
      />

      {/* ── Trip Menu ── */}
      <Modal visible={tripMenuVisible} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setTripMenuVisible(false)}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setTripMenuVisible(false); handleEdit() }} accessibilityRole="button">
              <View style={styles.menuItemRow}>
                <Icon name="edit" size={16} color={C.primary} />
                <Text style={styles.menuItemText}>Editar viagem</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setTripMenuVisible(false); handleDelete() }} accessibilityRole="button">
              <View style={styles.menuItemRow}>
                <Icon name="delete-outline" size={16} color={C.error} />
                <Text style={[styles.menuItemText, styles.menuItemDanger]}>Excluir viagem</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Share Menu ── */}
      <Modal visible={shareMenuVisible} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setShareMenuVisible(false)}>
          <Pressable style={styles.sharePanel} onPress={() => {}}>
            <Text style={styles.sharePanelTitle}>Compartilhar viagem</Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShareMenuVisible(false); setTripShareSheetVisible(true) }} accessibilityRole="button">
              <View style={styles.menuItemRow}>
                <Icon name="group-add" size={18} color="#5856D6" />
                <View>
                  <Text style={styles.menuItemText}>Membros e permissões</Text>
                  <Text style={styles.menuItemHint}>Convide usuários e gerencie acessos</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleShareText} accessibilityRole="button">
              <View style={styles.menuItemRow}>
                <Icon name="chat" size={18} color={C.primary} />
                <View>
                  <Text style={styles.menuItemText}>Texto</Text>
                  <Text style={styles.menuItemHint}>WhatsApp, Telegram, SMS...</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleSharePDF} accessibilityRole="button">
              <View style={styles.menuItemRow}>
                <Icon name="picture-as-pdf" size={18} color={C.primary} />
                <View>
                  <Text style={styles.menuItemText}>PDF</Text>
                  <Text style={styles.menuItemHint}>Email, salvar, imprimir...</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Trip Share Sheet ── */}
      <TripShareSheet
        visible={tripShareSheetVisible}
        onClose={() => setTripShareSheetVisible(false)}
        tripId={tripId}
        tripTitle={trip?.title || ''}
        ownerId={(trip as unknown as Record<string, string>).owner_id || ''}
      />
    </>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.secondary, fontSize: 14 },
  heroCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 20, overflow: 'hidden', backgroundColor: C.surfaceHigh,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 4 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16 },
    }),
  },
  heroCardDesktop: { maxWidth: 960, width: '100%' as any, alignSelf: 'center' as any, marginHorizontal: 0, marginTop: 24, marginBottom: 8 },
  heroImageWrap: { width: '100%', aspectRatio: 32 / 27, position: 'relative' },
  heroImageWrapDesktop: { aspectRatio: 64 / 27 },
  heroImageWrapMobile: { aspectRatio: (32 / 9) / 2.5 },
  heroImage: { width: '100%', height: '100%' as any },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECECF0' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 20 },
  heroInfo: { gap: 4 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroDestination: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.82)', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroDatesRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroDateBox: { gap: 2 },
  heroDateLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as any, letterSpacing: 0.6 },
  heroDateValue: { fontSize: 13, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topRightBtns: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 10 },
  topBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  contentDesktop: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 960, alignSelf: 'center' as any, width: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.primary, marginBottom: 10, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHigh, borderWidth: 0.5, borderColor: C.border },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menuPanel: { position: 'absolute', top: 104, right: 20, backgroundColor: C.surface, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, minWidth: 180, overflow: 'hidden' },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  menuItemDanger: { color: C.error },
  menuDivider: { height: 1, backgroundColor: C.border },
  sharePanel: { position: 'absolute', top: 104, right: 20, backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, minWidth: 220, overflow: 'hidden' },
  sharePanelTitle: { fontSize: 12, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  menuItemHint: { fontSize: 11, color: C.tertiary, marginTop: 1 },

  // Itinerary preview
  itineraryCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, marginBottom: 16 },
  itineraryEmptyState: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  itineraryEmptyText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  itineraryPreviewItem: {
    backgroundColor: C.surfaceHigh, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 4,
    overflow: 'hidden',
  },
  itineraryPreviewInner: { padding: 12 },
  itineraryPreviewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  itineraryPreviewIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  itineraryPreviewCat: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itineraryPreviewTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 3 },
  itineraryPreviewMeta: { fontSize: 12, color: C.secondary },

  // Expenses preview
  expensesEmptyCard: { backgroundColor: C.surface, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', gap: 6, marginBottom: 16 },
  expensesEmptyText: { fontSize: 14, fontWeight: '600', color: C.secondary, marginTop: 4 },
  expensesEmptySubtext: { fontSize: 12, color: C.tertiary },
  expensesCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, marginBottom: 16 },
  expensesBentoTotal: { backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  expensesBentoTotalLabel: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  expensesBentoTotalValue: { fontSize: 22, fontWeight: '800', color: C.primary },
  expensesBentoCountInline: { fontSize: 12, color: C.tertiary, marginTop: 6 },
  expensesCatSection: { gap: 8, marginBottom: 14 },
  expensesCatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expensesCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 94 },
  expensesCatLabel: { fontSize: 11, color: C.secondary, flex: 1 },
  expensesCatBarTrack: { flex: 1, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2, overflow: 'hidden' },
  expensesCatBar: { height: 4, borderRadius: 2 },
  expensesCatAmt: { fontSize: 11, fontWeight: '600', color: C.primary, width: 58, textAlign: 'right' },
  expensesDivider: { height: 0.5, backgroundColor: C.border, marginBottom: 4 },
  expensesRecentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  expensesRecentRowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.border },
  expensesRecentIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expensesRecentMid: { flex: 1 },
  expensesRecentCat: { fontSize: 13, fontWeight: '600', color: C.primary },
  expensesRecentDesc: { fontSize: 11, color: C.tertiary },
  expensesRecentAmt: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Checklist
  sectionBlock: { marginBottom: 16 },
  checklistCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  checklistCardTitle: { fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 2 },
  checklistCardSub: { fontSize: 12, color: C.secondary },
})
