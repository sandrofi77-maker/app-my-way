import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import Icon from '../components/Icon'
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

const EXPENSE_CATEGORY_CONF: Record<string, { icon: string; color: string }> = {
  'Hospedagem': { icon: 'hotel',             color: '#5856D6' },
  'Alimentação': { icon: 'restaurant',       color: '#FF9500' },
  'Transporte':  { icon: 'directions-car',   color: '#32ADE6' },
  'Passeios':    { icon: 'attractions',      color: '#34C759' },
  'Compras':     { icon: 'shopping-bag',     color: '#AF52DE' },
  'Saúde':       { icon: 'medical-services', color: '#FF2D55' },
  'Outros':      { icon: 'payments',         color: '#8E8E93' },
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
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function ExpensesScreen() {
  const { id: tripId, title: tripTitle, openNew } = useLocalSearchParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Alimentação')
  const [currency, setCurrency] = useState('R$')
  const [date, setDate] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    loadExpenses()
    if (openNew === '1') openNewExpense()
  }, [openNew]))

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
    setCategory('Alimentação')
    setCurrency('R$')
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
    setCategory(expense.category || 'Alimentação')
    setCurrency(expense.currency || 'R$')
    setDate(expense.date || new Date().toISOString().split('T')[0])
    setImageUri(expense.image_url || null)
    setModalVisible(true)
  }

  function handleCloseExpenseModal() {
    setModalVisible(false)
    resetForm()
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
        text: t('delete_label'), style: 'destructive',
        onPress: () => {
          Alert.alert(t('confirm_delete_expense_second_title'), t('confirm_delete_expense_second_body'), [
            { text: t('cancel_label'), style: 'cancel' },
            {
              text: t('delete_label'), style: 'destructive',
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

  const categoryTotals = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])
  const maxCat = categoryTotals[0]?.[1] || 1

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gastos</Text>
          {tripTitle ? <Text style={styles.tripName} numberOfLines={1}>{tripTitle as string}</Text> : null}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Bento: total + lançamentos ── */}
        <View style={styles.bentoTotal}>
          <Text style={styles.bentoTotalLabel}>Total gasto</Text>
          <Text style={styles.bentoTotalValue} numberOfLines={1} adjustsFontSizeToFit>
            R$ {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.bentoCountInline}>{expenses.length} {expenses.length === 1 ? 'lançamento' : 'lançamentos'}</Text>
        </View>

        {/* ── Breakdown por categoria ── */}
        {categoryTotals.length > 0 && (
          <View style={styles.catBreakdownBlock}>
            {categoryTotals.map(([cat, amt]) => {
              const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
              const pct = (amt / maxCat) * 100
              return (
                <View key={cat} style={styles.catBreakdownRow}>
                  <View style={styles.catBreakdownLeft}>
                    <Icon name={conf.icon as any} size={20} color={conf.color} />
                    <Text style={styles.catBreakdownLabel} numberOfLines={1}>{cat}</Text>
                  </View>
                  <View style={styles.catBreakdownTrack}>
                    <View style={[styles.catBreakdownBar, { width: `${pct}%` as any, backgroundColor: conf.color }]} />
                  </View>
                  <Text style={styles.catBreakdownAmt}>
                    R$ {amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* ── Lista de gastos ── */}
        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum gasto registrado ainda</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {expenses.map((item) => {
              const conf = EXPENSE_CATEGORY_CONF[item.category] ?? EXPENSE_CATEGORY_CONF['Outros']
              return (
                <TouchableOpacity key={item.id} style={styles.expenseCard} onPress={() => openEditExpense(item)} activeOpacity={0.8}>
                  <View style={[styles.expenseIconBadge, { backgroundColor: conf.color + '18' }]}>
                    <Icon name={conf.icon as any} size={18} color={conf.color} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseCategory, { color: conf.color }]}>{item.category}</Text>
                    {item.description ? <Text style={styles.expenseDesc} numberOfLines={1}>{item.description}</Text> : null}
                    <Text style={styles.expenseDate}>{formatExpenseDate(item.date)}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {item.currency === 'BRL' ? 'R$' : item.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={openNewExpense} activeOpacity={0.85}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseExpenseModal} />
          <View style={styles.sheetContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{editingExpenseId ? 'Editar gasto' : 'Novo gasto'}</Text>
                <Text style={styles.modalSubtitle}>Registre os detalhes do gasto</Text>
              </View>
              {editingExpenseId ? (
                <TouchableOpacity style={styles.sheetDeleteBtn} onPress={() => handleDelete(editingExpenseId)}>
                  <Icon name="delete-outline" size={20} color={C.error} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleCloseExpenseModal}>
                <Icon name="close" size={20} color={C.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Valor */}
              <Text style={styles.sheetLabel}>Valor *</Text>
              <View style={styles.sheetInputRow}>
                <Icon name="payments" size={20} color={C.secondary} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder="0,00"
                  placeholderTextColor={C.tertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Categoria */}
              <Text style={styles.sheetLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsRow}>
                {CATEGORIES.map(cat => {
                  const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                  const active = category === cat
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, active && { borderColor: conf.color, backgroundColor: conf.color + '14' }]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Icon name={conf.icon as any} size={14} color={active ? conf.color : C.secondary} />
                      <Text style={[styles.categoryChipText, active && { color: conf.color, fontWeight: '700' }]}>{cat}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              {/* Descrição */}
              <Text style={styles.sheetLabel}>Descrição</Text>
              <View style={styles.sheetInputRow}>
                <Icon name="notes" size={20} color={C.secondary} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Ex: Almoço no restaurante"
                  placeholderTextColor={C.tertiary}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Salvar */}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.primaryBtnText}>{saving ? 'Salvando...' : 'Salvar gasto'}</Text>
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
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  tripName: { fontSize: 12, color: C.secondary, marginTop: 1, maxWidth: 180 },

  // Bento summary
  bentoRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 16, marginBottom: 4 },
  bentoTotal: { marginHorizontal: 20, marginTop: 16, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: C.border },
  bentoTotalLabel: { fontSize: 10, fontWeight: '700', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  bentoTotalValue: { fontSize: 28, fontWeight: '800', color: C.primary },
  bentoCountInline: { fontSize: 12, color: C.tertiary, marginTop: 6 },

  // Category breakdown
  catBreakdownBlock: { marginHorizontal: 20, marginTop: 16, marginBottom: 4, gap: 16 },
  catBreakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catBreakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 120 },
  catBreakdownLabel: { fontSize: 14, color: C.secondary, flex: 1 },
  catBreakdownTrack: { flex: 1, height: 10, backgroundColor: C.surfaceHigh, borderRadius: 6, overflow: 'hidden' },
  catBreakdownBar: { height: 10, borderRadius: 6 },
  catBreakdownAmt: { fontSize: 13, fontWeight: '700', color: C.primary, width: 76, textAlign: 'right' },

  // Category carousel
  categoriesCarousel: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 12, gap: 10 },
  categoryCard: {
    width: 112, height: 130, borderRadius: 18,
    backgroundColor: C.surface, padding: 14,
    alignItems: 'flex-start', justifyContent: 'flex-end',
    borderWidth: 0.5, borderColor: C.border,
  },
  categoryIconBadge: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  categoryAmount: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 2 },
  categoryAmountActive: { color: '#fff' },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: C.secondary },
  categoryLabelActive: { color: 'rgba(255,255,255,0.85)' },

  // Expense list
  scrollContent: { paddingBottom: 120 },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: C.tertiary, fontSize: 13 },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 0.5, borderColor: C.border,
  },
  expenseIconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  expenseDesc: { fontSize: 12, color: C.secondary, marginTop: 1 },
  expenseDate: { fontSize: 11, color: C.tertiary, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: C.primary },

  // FAB
  fab: {
    position: 'absolute', bottom: 36, right: 24,
    width: 58, height: 58, borderRadius: 18, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },

  // Sheet modal
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetContainer: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  modalHandle: { width: 48, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center', marginBottom: 24 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  sheetDeleteBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EF', marginRight: 16 },
  sheetCloseBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHigh },
  sheetScroll: { paddingHorizontal: 24, paddingBottom: 34 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: C.primary, marginBottom: 2 },
  modalSubtitle: { fontSize: 14, color: C.secondary, marginBottom: 4 },
  sheetLabel: { fontSize: 10, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 4, marginBottom: 8, marginTop: 16 },
  sheetInputRow: { backgroundColor: C.surfaceHigh, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4 },
  sheetInput: { flex: 1, fontSize: 15, color: C.primary, marginLeft: 10, paddingVertical: 14, padding: 0 },

  // Category chips (modal)
  categoryChipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
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
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
