import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { useState, useCallback } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t, getDeviceLocale } from '../lib/i18n'

const C = Colors.dark

const CATEGORIES = [
  'Hospedagem', 'Alimentação', 'Transporte',
  'Passeios', 'Compras', 'Saúde', 'Outros'
]

const CATEGORY_ICONS: Record<string, string> = {
  'Hospedagem': '🏨', 'Alimentação': '🍽', 'Transporte': '🚗',
  'Passeios': '🎭', 'Compras': '🛍', 'Saúde': '💊', 'Outros': '💰'
}

type Expense = {
  id: string
  category: string
  amount: number
  currency: string
  description: string
  date: string
}

function formatExpenseDate(date: string) {
  if (!date) return '--'
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date
  return parsedDate.toLocaleDateString(getDeviceLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function ExpensesScreen() {
  const { id: tripId, title: tripTitle } = useLocalSearchParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Alimentação')
  const [currency, setCurrency] = useState('BRL')
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => { loadExpenses() }, []))

  async function loadExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (!error) setExpenses(data || [])
  }

  async function handleSave() {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert(t('attention_title'), t('invalid_amount'))
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      user_id: user?.id,
      amount: Number(amount),
      currency,
      category,
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
    })
    setSaving(false)
    if (!error) {
      setModalVisible(false)
      setAmount('')
      setDescription('')
      setCategory('Alimentação')
      loadExpenses()
    } else {
      Alert.alert(t('error_title'), t('save_failed'))
    }
  }

  async function handleDelete(expenseId: string) {
    Alert.alert(t('confirm_delete_expense_title'), t('confirm_delete_expense_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      { text: t('delete_label'), style: 'destructive', onPress: async () => {
        await supabase.from('expenses').delete().eq('id', expenseId)
        loadExpenses()
      }}
    ])
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const byCategory = CATEGORIES.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gastos</Text>
        <Text style={styles.tripName}>{tripTitle as string}</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total gasto</Text>
        <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
      </View>

      {byCategory.length > 0 && (
        <View style={styles.categoryRow}>
          {byCategory.map(c => (
            <View key={c.category} style={styles.categoryChip}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[c.category]}</Text>
              <Text style={styles.categoryName}>{c.category}</Text>
              <Text style={styles.categoryTotal}>R$ {c.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>Nenhum gasto registrado ainda</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.expenseCard} onLongPress={() => handleDelete(item.id)} activeOpacity={0.8}>
            <Text style={styles.expenseIcon}>{CATEGORY_ICONS[item.category] || '💰'}</Text>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseCategory}>{item.category}</Text>
              {item.description ? <Text style={styles.expenseDesc}>{item.description}</Text> : null}
              <Text style={styles.expenseDate}>{formatExpenseDate(item.date)}</Text>
            </View>
            <Text style={styles.expenseAmount}>{item.currency} {item.amount.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Registrar gasto</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Novo gasto</Text>
            <Text style={styles.modalLabel}>Valor (R$) *</Text>
            <TextInput style={styles.modalInput} placeholder="0.00" placeholderTextColor={C.tertiary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={styles.modalLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, category === cat && styles.catBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.modalLabel}>Descrição (opcional)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Almoço no restaurante" placeholderTextColor={C.tertiary} value={description} onChangeText={setDescription} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backText: { color: C.accent, fontSize: 14, marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.primary },
  tripName: { fontSize: 13, color: C.secondary, marginTop: 2 },
  totalCard: { marginHorizontal: 20, backgroundColor: C.accent, borderRadius: 14, padding: 20, marginBottom: 12 },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#fff' },
  categoryRow: { paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: C.border },
  categoryIcon: { fontSize: 16 },
  categoryName: { fontSize: 12, color: C.secondary, flex: 1 },
  categoryTotal: { fontSize: 13, fontWeight: '600', color: C.primary },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: C.tertiary, fontSize: 13 },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: C.border },
  expenseIcon: { fontSize: 24, marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 14, fontWeight: '500', color: C.primary },
  expenseDesc: { fontSize: 12, color: C.secondary, marginTop: 2 },
  expenseDate: { fontSize: 11, color: C.tertiary, marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: C.primary },
  fab: { position: 'absolute', bottom: 32, left: 20, right: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  fabText: { fontSize: 15, fontWeight: '600', color: '#000' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.primary, marginBottom: 16 },
  modalLabel: { fontSize: 13, color: C.secondary, marginBottom: 6, marginTop: 10 },
  modalInput: { backgroundColor: C.surfaceHigh, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.primary },
  catBtn: { borderWidth: 0.5, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  catBtnText: { color: C.secondary, fontSize: 12 },
  catBtnTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: C.secondary, fontSize: 14 },
  saveBtn: { flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
})
