import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { t, getDeviceLocale } from '../lib/i18n'
import ImagePickerComponent from '../components/ImagePicker'

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
  image_url: string | null
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
  const listRef = useRef<FlatList<Expense>>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Alimentação')
  const [currency, setCurrency] = useState('BRL')
  const [date, setDate] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  useFocusEffect(useCallback(() => { loadExpenses() }, []))

  async function loadExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (!error) setExpenses(data || [])
  }

  function resetForm() {
    setEditingExpenseId(null)
    setAmount('')
    setDescription('')
    setCategory('Alimenta????o')
    setCurrency('BRL')
    setDate(new Date().toISOString().split('T')[0])
    setImageUri(null)
  }

  function openNewExpense() {
    resetForm()
    setModalVisible(true)
  }

  function openEditExpense(expense: Expense) {
    setEditingExpenseId(expense.id)
    setAmount(String(expense.amount ?? ''))
    setDescription(expense.description || '')
    setCategory(expense.category || 'Alimenta????o')
    setCurrency(expense.currency || 'BRL')
    setDate(expense.date || new Date().toISOString().split('T')[0])
    setImageUri(expense.image_url || null)
    setModalVisible(true)
  }

  async function handleSave() {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert(t('attention_title'), t('invalid_amount'))
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      trip_id: tripId,
      user_id: user?.id,
      amount: Number(amount),
      currency,
      category,
      description: description.trim(),
      date: date || new Date().toISOString().split('T')[0],
      image_url: imageUri || null,
    }
    const request = editingExpenseId
      ? supabase.from('expenses').update(payload).eq('id', editingExpenseId)
      : supabase.from('expenses').insert(payload)
    const { error } = await request
    setSaving(false)
    if (!error) {
      setModalVisible(false)
      resetForm()
      loadExpenses()
    } else {
      Alert.alert(t('error_title'), t('save_failed'))
    }
  }

  async function handleDelete(expenseId: string) {
    Alert.alert(t('confirm_delete_expense_title'), t('confirm_delete_expense_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('confirm_delete_expense_second_title'), t('confirm_delete_expense_second_body'), [
            { text: t('cancel_label'), style: 'cancel' },
            {
              text: t('delete_label'),
              style: 'destructive',
              onPress: async () => {
                await supabase.from('expenses').delete().eq('id', expenseId)
                loadExpenses()
                setModalVisible(false)
                resetForm()
              }
            }
          ])
        }
      }
    ])
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const filteredExpenses = selectedCategory === 'Todos'
    ? expenses
    : expenses.filter((e) => e.category === selectedCategory)

  function getLastDaysTotals(days: number) {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - (days - 1))

    const totals = new Map<string, number>()
    expenses.forEach((expense) => {
      if (!expense.date) return
      const dt = new Date(expense.date)
      if (Number.isNaN(dt.getTime())) return
      if (dt < start || dt > now) return
      const key = expense.date
      totals.set(key, (totals.get(key) || 0) + expense.amount)
    })

    const series = []
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: '2-digit' })
      series.push({
        key,
        label,
        total: totals.get(key) || 0,
      })
    }
    return series
  }

  const chartSeries = getLastDaysTotals(7)
  const maxChartValue = Math.max(...chartSeries.map((item) => item.total), 1)

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gastos</Text>
            <Text style={styles.tripName}>{tripTitle as string}</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreText}>{'\u22EE'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total gasto</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>

        <View style={styles.chartBlock}>
          <Text style={styles.chartLabel}>Ultimos 7 dias</Text>
          <View style={styles.chartBars}>
            {chartSeries.map((item) => (
              <View key={item.key} style={styles.chartBarItem}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: item.total === 0
                        ? 4
                        : Math.min(130, 28 + Math.round((item.total / maxChartValue) * 92))
                    }
                  ]}
                />
                <Text style={styles.chartTick}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesCarousel}>
          {['Todos', ...CATEGORIES].map((cat) => {
            const totalByCategory = cat === 'Todos'
              ? total
              : expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
            const selected = selectedCategory === cat
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryCard, selected && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.85}
              >
                <View style={[styles.categoryIconBadge, selected && styles.categoryIconBadgeActive]}>
                  <Text style={styles.categoryEmoji}>
                    {cat === 'Todos' ? '\u{1F4B0}' : (CATEGORY_ICONS[cat] || '\u{1F4B0}')}
                  </Text>
                </View>
                <Text
                  style={[styles.categoryAmount, selected && styles.categoryAmountActive]}
                  numberOfLines={1}
                >
                  R$ {totalByCategory.toFixed(2)}
                </Text>
                <Text
                  style={[styles.categoryLabel, selected && styles.categoryLabelActive]}
                  numberOfLines={1}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
      <FlatList
        ref={listRef}
        key={selectedCategory}
        data={filteredExpenses}
        keyExtractor={e => e.id}
        contentContainerStyle={[styles.list, { paddingTop: 0 }]}
        contentOffset={{ x: 0, y: 0 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {selectedCategory === 'Todos'
                ? 'Nenhum gasto registrado ainda'
                : 'Nenhum gasto nessa categoria'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.expenseCard} onPress={() => openEditExpense(item)} activeOpacity={0.8}>
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

      <TouchableOpacity style={styles.fab} onPress={openNewExpense}>
        <Text style={styles.fabText}>+ Novo gasto</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingExpenseId ? 'Editar gasto' : 'Novo gasto'}</Text>
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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm() }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
            {editingExpenseId ? (
              <TouchableOpacity style={styles.deleteExpenseBtn} onPress={() => handleDelete(editingExpenseId)}>
                <Text style={styles.deleteExpenseText}>Excluir gasto</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: C.accent, fontSize: 18 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.primary },
  tripName: { fontSize: 13, color: C.secondary, marginTop: 2 },
  moreBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: C.secondary, fontSize: 18 },
  totalCard: { marginHorizontal: 20, backgroundColor: C.accent, borderRadius: 14, padding: 20, marginBottom: 12 },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#fff' },
  chartBlock: { marginHorizontal: 0, marginBottom: 12 },
  chartLabel: { fontSize: 12, color: C.secondary, marginBottom: 8, paddingHorizontal: 20 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20 },
  chartBarItem: { alignItems: 'center', flex: 1 },
  chartBar: { width: '70%', borderRadius: 8, backgroundColor: C.primary, opacity: 0.85 },
  chartTick: { fontSize: 11, color: C.tertiary, marginTop: 6 },
  categoriesCarousel: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 4 },
  categoryCard: {
    minWidth: 120,
    maxWidth: 180,
    height: 150,
    borderRadius: 20,
    backgroundColor: '#D5D8DF',
    padding: 14,
    marginRight: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D5D8DF',
  },
  categoryCardActive: { backgroundColor: C.primary, borderColor: C.primary },
  categoryIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryIconBadgeActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  categoryEmoji: { fontSize: 24 },
  categoryAmount: { fontSize: 16, fontWeight: '700', color: '#1E2B45', marginBottom: 4 },
  categoryAmountActive: { color: '#FFFFFF' },
  categoryLabel: { fontSize: 12, color: '#2E3B57', fontWeight: '600' },
  categoryLabelActive: { color: '#FFFFFF' },
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
  fabText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
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
  removeImageBtn: { alignSelf: 'flex-start', marginTop: 6, marginBottom: 6 },
  removeImageText: { color: C.error, fontSize: 12, fontWeight: '600' },
  deleteExpenseBtn: { marginTop: 12, borderWidth: 0.5, borderColor: C.error, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  deleteExpenseText: { color: C.error, fontSize: 14, fontWeight: '600' },
})
