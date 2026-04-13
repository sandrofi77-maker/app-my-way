import { View, ScrollView, StyleSheet } from 'react-native'
import Icon from '../components/Icon'
import { useState, useCallback } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { t, getDeviceLocale } from '../lib/i18n'
import { showAlert } from '../lib/alert'
import { useExpenseStore } from '../stores/useExpenseStore'
import SheetModal from '../components/SheetModal'
import DesktopLayout from '../components/DesktopLayout'
import HScrollable from '../components/HScrollable'
import { formatBRL, applyCurrencyMask, parseCurrencyInput, numberToCurrencyInput } from '../lib/currency'
import {
  Box, Text, VStack, HStack, Card, Input, Button, FAB,
  EmptyState, Pressable, useTheme, IconButton,
} from '../design-system'

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_CONF } from '../constants/categories'
import type { Expense } from '../types'

const CATEGORIES = EXPENSE_CATEGORIES

function formatExpenseDate(date: string) {
  if (!date) return '--'
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date
  return parsedDate.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ExpensesScreen() {
  const theme = useTheme()
  const { id: tripId, title: tripTitle, openNew } = useLocalSearchParams()
  const tid = String(tripId || '')

  // ── Store ──
  const { expenses, budget, budgetCurrency, loadAll, saveExpense, deleteExpense } = useExpenseStore()

  // ── Local UI state ──
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
    loadAll(tid)
    if (openNew === '1') openNewExpense()
  }, [openNew]))

  function resetForm() {
    setEditingExpenseId(null); setAmount(''); setDescription(''); setCategory('Alimentação')
    setCurrency('R$'); setDate(new Date().toISOString().split('T')[0]); setImageUri(null)
  }

  function openNewExpense() { resetForm(); setModalVisible(true) }

  function openEditExpense(expense: Expense) {
    setEditingExpenseId(expense.id); setAmount(numberToCurrencyInput(expense.amount))
    setDescription(expense.description || ''); setCategory(expense.category || 'Alimentação')
    setCurrency(expense.currency || 'R$'); setDate(expense.date || new Date().toISOString().split('T')[0])
    setImageUri(expense.image_url || null); setModalVisible(true)
  }

  function handleCloseExpenseModal() { setModalVisible(false); resetForm() }

  async function handleSave() {
    const parsedAmount = parseCurrencyInput(amount)
    if (!amount || parsedAmount <= 0) { showAlert(t('attention_title'), t('invalid_amount')); return }
    setSaving(true)
    const { error } = await saveExpense(tid, {
      amount: parsedAmount, currency, category,
      description: description.trim(), date: date || new Date().toISOString().split('T')[0],
      image_url: imageUri || null,
    }, editingExpenseId)
    setSaving(false)
    if (!error) { setModalVisible(false); resetForm() }
    else showAlert(t('error_title'), t('save_failed'))
  }

  async function handleDelete(expenseId: string) {
    showAlert(t('confirm_delete_expense_title'), t('confirm_delete_expense_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      { text: t('delete_label'), style: 'destructive', onPress: () => {
        showAlert(t('confirm_delete_expense_second_title'), t('confirm_delete_expense_second_body'), [
          { text: t('cancel_label'), style: 'cancel' },
          { text: t('delete_label'), style: 'destructive', onPress: async () => {
            await deleteExpense(expenseId, tid)
            setModalVisible(false); resetForm()
          }}
        ])
      }}
    ])
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const budgetCur = budgetCurrency || 'R$'
  const budgetAmount = budget
  const budgetPct = budgetAmount && budgetAmount > 0 ? Math.min((total / budgetAmount) * 100, 100) : 0
  const budgetBarColor = budgetPct >= 90 ? theme.colors.error : budgetPct >= 75 ? '#FF9500' : theme.colors.success
  const budgetBalance = budgetAmount != null ? budgetAmount - total : null

  const categoryTotals = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])
  const maxCat = categoryTotals[0]?.[1] || 1

  return (
    <DesktopLayout>
      <Box flex={1} bg="background">
        {/* Header */}
        <Box bg="surface" borderBottomWidth={0.5} borderColor="border" px={5} pt={14} pb={4}>
          <HStack alignItems="center">
            <IconButton accessibilityLabel="Voltar" onPress={() => router.back()} variant="ghost">
              <Icon name="arrow-back" size={22} color={theme.colors.text} />
            </IconButton>
            <Box flex={1} alignItems="center">
              <Text variant="subtitle" weight="700">Gastos</Text>
              {tripTitle ? <Text variant="caption" color="textSecondary" numberOfLines={1}>{tripTitle as string}</Text> : null}
            </Box>
            <Box width={36} />
          </HStack>
        </Box>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Budget card */}
          {budgetAmount != null && (
            <Card variant="outlined" style={{ marginHorizontal: 20, marginTop: 16 }}>
              <VStack p={4} gap={2.5}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text variant="overline" color="textTertiary">Orcamento</Text>
                  <Text variant="subtitle" weight="800">{budgetCur} {formatBRL(budgetAmount)}</Text>
                </HStack>
                <View style={styles.budgetTrack}>
                  <View style={[styles.budgetBar, { width: `${budgetPct}%` as any, backgroundColor: budgetBarColor }]} />
                </View>
                <HStack justifyContent="space-between">
                  <Text variant="caption" color="textSecondary">Gasto: {budgetCur} {formatBRL(total)}</Text>
                  <Text variant="caption" weight="700" style={{ color: (budgetBalance ?? 0) >= 0 ? theme.colors.success : theme.colors.error }}>
                    {(budgetBalance ?? 0) >= 0 ? 'Saldo: ' : 'Excesso: '}{budgetCur} {formatBRL(Math.abs(budgetBalance ?? 0))}
                  </Text>
                </HStack>
              </VStack>
            </Card>
          )}

          {/* Bento total */}
          <Card variant="outlined" style={{ marginHorizontal: 20, marginTop: 16 }}>
            <VStack p={4}>
              <Text variant="overline" color="textTertiary">Total gasto</Text>
              <Text variant="display" numberOfLines={1}>R$ {formatBRL(total)}</Text>
              <Text variant="caption" color="textTertiary" style={{ marginTop: 6 }}>
                {expenses.length} {expenses.length === 1 ? 'lancamento' : 'lancamentos'}
              </Text>
            </VStack>
          </Card>

          {/* Category breakdown */}
          {categoryTotals.length > 0 && (
            <VStack gap={4} mx={5} mt={4} mb={1}>
              {categoryTotals.map(([cat, amt]) => {
                const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                const pct = (amt / maxCat) * 100
                return (
                  <HStack key={cat} gap={3} alignItems="center">
                    <HStack gap={2} alignItems="center" style={{ width: 120 }}>
                      <Icon name={conf.icon as any} size={20} color={conf.color} />
                      <Text variant="body" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>{cat}</Text>
                    </HStack>
                    <View style={{ flex: 1, height: 10, backgroundColor: theme.colors.surfaceHigh, borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{ height: 10, borderRadius: 6, width: `${pct}%` as any, backgroundColor: conf.color }} />
                    </View>
                    <Text variant="bodySmall" weight="700" style={{ width: 76, textAlign: 'right' }}>R$ {formatBRL(amt)}</Text>
                  </HStack>
                )
              })}
            </VStack>
          )}

          {/* Expense list */}
          {expenses.length === 0 ? (
            <Box mt={12}>
              <EmptyState title="Nenhum gasto registrado ainda" />
            </Box>
          ) : (
            <VStack gap={2} px={5} pt={2}>
              {expenses.map((item) => {
                const conf = EXPENSE_CATEGORY_CONF[item.category] ?? EXPENSE_CATEGORY_CONF['Outros']
                return (
                  <Pressable key={item.id} onPress={() => openEditExpense(item)} accessibilityLabel={`${item.category}${item.description ? `, ${item.description}` : ''}, ${item.currency} ${formatBRL(item.amount)}`} accessibilityRole="button">
                    <Card variant="outlined">
                      <HStack p={3.5} gap={3} alignItems="center">
                        <Box
                          width={40} height={40} borderRadius="lg"
                          alignItems="center" justifyContent="center"
                          bg={conf.color + '18'}
                        >
                          <Icon name={conf.icon as any} size={18} color={conf.color} />
                        </Box>
                        <VStack flex={1}>
                          <Text variant="bodySmall" weight="700" style={{ color: conf.color }}>{item.category}</Text>
                          {item.description ? <Text variant="caption" color="textSecondary" numberOfLines={1}>{item.description}</Text> : null}
                          <Text variant="caption" color="textTertiary">{formatExpenseDate(item.date)}</Text>
                        </VStack>
                        <Text variant="body" weight="700">
                          {item.currency === 'BRL' ? 'R$' : item.currency} {formatBRL(item.amount)}
                        </Text>
                      </HStack>
                    </Card>
                  </Pressable>
                )
              })}
            </VStack>
          )}
        </ScrollView>

        <FAB accessibilityLabel="Novo gasto" onPress={openNewExpense}>
          <Icon name="add" size={28} color="#fff" />
        </FAB>

        {/* Modal */}
        <SheetModal
          visible={modalVisible}
          onClose={handleCloseExpenseModal}
          title={editingExpenseId ? 'Editar gasto' : 'Novo gasto'}
          subtitle="Registre os detalhes do gasto"
          onDelete={editingExpenseId ? () => handleDelete(editingExpenseId) : undefined}
        >
          <Input
            label="Valor *"
            placeholder="0,00"
            value={amount}
            onChangeText={(text) => setAmount(applyCurrencyMask(text))}
            keyboardType="numeric"
            size="lg"
            leftIcon={<Icon name="payments" size={20} color={theme.colors.textSecondary} />}
          />

          <VStack gap={2} mt={4}>
            <Text variant="overline" color="textSecondary">Categoria</Text>
            <HScrollable contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
              {CATEGORIES.map(cat => {
                const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                const active = category === cat
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    accessibilityLabel={`Categoria ${cat}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === cat }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 14, paddingVertical: 9,
                      borderRadius: theme.radius.full,
                      borderWidth: 1.5,
                      borderColor: active ? conf.color : theme.colors.border,
                      backgroundColor: active ? conf.color + '14' : theme.colors.surfaceHigh,
                    }}
                  >
                    <Icon name={conf.icon as any} size={14} color={active ? conf.color : theme.colors.textSecondary} />
                    <Text variant="bodySmall" weight={active ? '700' : '600'} style={{ color: active ? conf.color : theme.colors.textSecondary }}>
                      {cat}
                    </Text>
                  </Pressable>
                )
              })}
            </HScrollable>
          </VStack>

          <Box mt={4}>
            <Input
              label="Descricao"
              placeholder="Ex: Almoco no restaurante"
              value={description}
              onChangeText={setDescription}
              size="lg"
              leftIcon={<Icon name="notes" size={20} color={theme.colors.textSecondary} />}
            />
          </Box>

          <Box mt={6}>
            <Button variant="primary" size="lg" fullWidth loading={saving} onPress={handleSave}>
              Salvar gasto
            </Button>
          </Box>
        </SheetModal>
      </Box>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  budgetTrack: { height: 8, backgroundColor: '#ECECF0', borderRadius: 6, overflow: 'hidden' },
  budgetBar: { height: 8, borderRadius: 6 },
})
