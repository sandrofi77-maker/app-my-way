import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'

const C = Colors.dark

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  status: string
  cover_image: string | null
}

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams()
  const [trip, setTrip] = useState<Trip | null>(null)

  useFocusEffect(
    useCallback(() => { loadTrip() }, [id])
  )

  async function loadTrip() {
    const { data, error } = await supabase
      .from('trips').select('*').eq('id', id).single()
    if (!error) setTrip(data)
  }

  async function handleDelete() {
    Alert.alert('Excluir viagem', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trips').delete().eq('id', id)
          if (!error) router.back()
          else Alert.alert('Erro', 'Não foi possível excluir.')
        }
      }
    ])
  }

  function handleEdit() {
    if (!trip) return
    router.push({
      pathname: '/edit-trip',
      params: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        cover_image: trip.cover_image || '',
      }
    })
  }

  if (!trip) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        {trip.cover_image ? (
          <Image source={{ uri: trip.cover_image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>✈</Text>
          </View>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.title}>{trip.title}</Text>
            <Text style={styles.destination}>{trip.destination}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Ida</Text>
            <Text style={styles.dateValue}>{formatDate(trip.start_date)}</Text>
          </View>
          <Text style={styles.dateSep}>→</Text>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Volta</Text>
            <Text style={styles.dateValue}>{formatDate(trip.end_date)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Voos</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Nenhum voo cadastrado</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Adicionar voo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Hospedagem</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Nenhuma hospedagem cadastrada</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Adicionar hospedagem</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Roteiro</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Nenhum item no roteiro</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Adicionar ao roteiro</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Gastos</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Nenhum gasto registrado</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push({ pathname: '/expenses', params: { id: trip.id, title: trip.title } })}
          >
            <Text style={styles.addBtnText}>+ Registrar gasto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loading: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.secondary, fontSize: 14 },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 280 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 0.5, borderBottomColor: C.border },
  imagePlaceholderIcon: { fontSize: 48, color: C.tertiary },
  backBtn: { position: 'absolute', top: 54, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 60 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, marginTop: 16 },
  titleLeft: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: C.primary, marginBottom: 4 },
  destination: { fontSize: 14, color: C.secondary },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  editBtn: { backgroundColor: C.accent + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
  deleteBtn: { backgroundColor: '#FF3B3022', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: C.error, fontSize: 12, fontWeight: '500' },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 0.5, borderColor: C.border },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 11, color: C.tertiary, marginBottom: 4 },
  dateValue: { fontSize: 13, color: C.primary, fontWeight: '500' },
  dateSep: { fontSize: 16, color: C.tertiary },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.primary, marginBottom: 10, marginTop: 8 },
  emptySection: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' },
  emptySectionText: { fontSize: 13, color: C.tertiary, marginBottom: 10 },
  addBtn: { borderWidth: 0.5, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: C.accent, fontSize: 12, fontWeight: '500' },
})