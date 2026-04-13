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
import { useResponsive } from '../hooks/useResponsive'
import { useTripStore } from '../stores/useTripStore'

import FlightSection from '../components/FlightSection'
import AccommodationSection from '../components/AccommodationSection'
import FlightFormModal from '../components/FlightFormModal'
import AccommodationFormModal from '../components/AccommodationFormModal'
import ItineraryPreviewSection from '../components/ItineraryPreviewSection'
import ExpensesPreviewSection from '../components/ExpensesPreviewSection'
import ChecklistPreviewSection from '../components/ChecklistPreviewSection'
import { Tabs, FAB } from '../design-system'
import type { TabItem } from '../design-system/components/Tabs'
import type { Flight, Accommodation } from '../types'

type SectionId = 'roteiro' | 'gastos' | 'voos' | 'hospedagens' | 'checklist'

const SECTION_TABS: TabItem<SectionId>[] = [
  { value: 'roteiro', label: 'Roteiro' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'voos', label: 'Voos' },
  { value: 'hospedagens', label: 'Hospedagens' },
  { value: 'checklist', label: 'Checklist' },
]

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
  const [activeSection, setActiveSection] = useState<SectionId>('roteiro')
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
      <View style={[styles.fabAnchor, isDesktop && styles.fabAnchorDesktop]}>
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

          {/* ── Section Tabs ── */}
          <View style={styles.tabsRow}>
            <Tabs
              value={activeSection}
              onChange={setActiveSection}
              items={SECTION_TABS}
              variant="pill"
              scrollable
            />
          </View>

          {/* ── Active Section Content ── */}
          {activeSection === 'roteiro' && (
            <ItineraryPreviewSection
              tripId={tripId}
              tripTitle={trip.title}
              startDate={trip.start_date}
              endDate={trip.end_date}
              itineraryItems={itineraryItems}
            />
          )}

          {activeSection === 'gastos' && (
            <ExpensesPreviewSection
              tripId={tripId}
              tripTitle={trip.title}
              expenses={expenses}
            />
          )}

          {activeSection === 'voos' && (
            <FlightSection
              flights={flights}
              cardWidth={CARD_WIDTH}
              isDesktop={isDesktop}
              activeIndex={activeFlightIndex}
              onIndexChange={setActiveFlightIndex}
              onAdd={openNewFlightModal}
              onEdit={openEditFlightModal}
            />
          )}

          {activeSection === 'hospedagens' && (
            <AccommodationSection
              accommodations={accommodations}
              cardWidth={CARD_WIDTH}
              isDesktop={isDesktop}
              activeIndex={activeAccomIndex}
              onIndexChange={setActiveAccomIndex}
              onAdd={openNewAccommodationModal}
              onEdit={openEditAccommodationModal}
            />
          )}

          {activeSection === 'checklist' && (
            <ChecklistPreviewSection
              tripId={tripId}
              tripTitle={trip.title}
            />
          )}

        </View>
      </ScrollView>

      {/* ── FAB (context-sensitive per active section) ── */}
      {activeSection === 'roteiro' && (
        <FAB accessibilityLabel="Abrir roteiro" onPress={() => router.push({ pathname: '/itinerary', params: { id: tripId, title: trip.title, start_date: trip.start_date, end_date: trip.end_date } })}>
          <Icon name="map" size={26} color="#fff" />
        </FAB>
      )}
      {activeSection === 'gastos' && (
        <FAB accessibilityLabel="Novo gasto" onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title, openNew: '1' } })}>
          <Icon name="add" size={28} color="#fff" />
        </FAB>
      )}
      {activeSection === 'voos' && (
        <FAB accessibilityLabel="Adicionar voo" onPress={openNewFlightModal}>
          <Icon name="add" size={28} color="#fff" />
        </FAB>
      )}
      {activeSection === 'hospedagens' && (
        <FAB accessibilityLabel="Adicionar hospedagem" onPress={openNewAccommodationModal}>
          <Icon name="add" size={28} color="#fff" />
        </FAB>
      )}
      {activeSection === 'checklist' && (
        <FAB accessibilityLabel="Abrir checklist" onPress={() => router.push({ pathname: '/checklist', params: { id: tripId, title: trip.title } })}>
          <Icon name="checklist" size={26} color="#fff" />
        </FAB>
      )}
    </View>

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
  fabAnchor: { flex: 1 },
  fabAnchorDesktop: { maxWidth: 960, width: '100%', alignSelf: 'center' as any },
  container: { flex: 1, backgroundColor: C.background, overflow: 'hidden' as any },
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
  content: { padding: 20, paddingBottom: 100, overflow: 'hidden' as any },
  contentDesktop: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 960, alignSelf: 'center' as any, width: '100%', overflow: 'hidden' as any },
  tabsRow: { marginBottom: 16 },
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
})
