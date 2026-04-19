import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Icon from './Icon'
import { Colors } from '../constants/Colors'

const C = Colors.dark

type Props = {
  tripId: string
  tripTitle: string
}

export default function ChecklistPreviewSection({ tripId, tripTitle }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/checklist', params: { id: tripId, title: tripTitle } })}
      accessibilityLabel="Checklist da viagem"
      accessibilityRole="button"
    >
      <Icon name="checklist" size={28} color={C.tertiary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>Checklist da viagem</Text>
        <Text style={styles.cardSub}>Organize o que levar e o que fazer</Text>
      </View>
      <Icon name="chevron-right" size={20} color={C.tertiary} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 2 },
  cardSub: { fontSize: 12, color: C.secondary },
})
