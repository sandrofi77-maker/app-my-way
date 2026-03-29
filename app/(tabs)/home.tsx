import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image
} from 'react-native'
import { useState, useCallback } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/Colors'

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

export default function HomeScreen() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [userName, setUserName] = useState('')

  useFocusEffect(
    useCallback(() => { loadData() }, [])
  )

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserName(user.email?.split('@')[0] || 'viajante')
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setTrips(data || [])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function getStatusColor(status: string) {
    return status === 'active' ? C.success : C.accent
  }

  function getStatusLabel(status: string) {
    return status === 'active' ? 'Em andamento' : 'Planejando'
  }

  function formatDate(date: string) {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  function renderTrip({ item }: { item: Trip }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/trip-detail', params: { id: item.id } })}
      >
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={styles.cardImgPlaceholder}>
            <Text style={styles.cardImgIcon}>✈</Text>
          </View>
        )}
        <View style={styles.cardOverlay}>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDest}>{item.destination}</Text>
          {(item.start_date || item.end_date) && (
            <Text style={styles.cardDate}>
              {formatDate(item.start_date)} → {formatDate(item.end_date)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Way</Text>
          <Text style={styles.headerSub}>Olá, {userName}!</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={handleLogout}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✈</Text>
            <Text style={styles.emptyTitle}>Nenhuma viagem ainda</Text>
            <Text style={styles.emptyDesc}>Crie sua primeira viagem!</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/new-trip')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Nova viagem</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.primary },
  headerSub: { fontSize: 13, color: C.secondary, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.accent, fontSize: 15, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 16, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  cardImg: { width: '100%', height: 180 },
  cardImgPlaceholder: { width: '100%', height: 140, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  cardImgIcon: { fontSize: 40, color: C.tertiary },
  cardOverlay: { position: 'absolute', top: 12, right: 12 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 4 },
  cardDest: { fontSize: 13, color: C.secondary, marginBottom: 4 },
  cardDate: { fontSize: 12, color: C.tertiary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.primary, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: C.secondary, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 32, left: 20, right: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  fabText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})