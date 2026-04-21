import { View, FlatList, StyleSheet } from 'react-native'
import Icon from '../components/Icon'
import { useState, useCallback, useMemo } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { t, getDeviceLocale } from '../lib/i18n'
import { showAlert } from '../lib/alert'
import { useExpenseStore } from '../stores/useExpenseStore'
import { useShallow } from 'zustand/react/shallow'
import SheetModal from '../components/SheetModal'
import ReceiptPicker from '../components/ReceiptPicker'
import DesktopLayout from '../components/DesktopLayout'
import HScrollable from '../components/HScrollable'
import { formatBRL, applyCurrencyMask, parseCurrencyInput, numberToCurrencyInput } from '../lib/currency'
import {
  Box, Text, VStack, HStack, Card, Input, Button, FAB,
  EmptyState, Pressable, useTheme, IconButton,
} from '../design-system'

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_CONF } from '../constants/categories'
import type { Expense, ExpenseSplit } from '../types'

const CATEGORIES = EXPENSE_CATEGORIES

type SplitMember = {
  member_user_id: string | null
  member_email: string | null
  label: string
}

type SplitRow = {
  member_user_id: string | null
  member_email: string | null
  label: string
  amountInput: string
}

type SplitMode = 'equal' | 'manual'

/** Parseia image_url (string unica legacy ou JSON array) -> string[] */
function parseReceiptUris(value?: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {
    // nao e JSON
  }
  return [value]
}

/** Serializa array de URIs -> string para salvar (null se vazio) */
function serializeReceiptUris(uris: string[]): string | null {
  if (!uris.length) return null
  if (uris.length === 1) return uris[0]
  return JSON.stringify(uris)
}

function formatExpenseDate(date: string) {
  if (!date) return '--'
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return date
  return parsedDate.toLocaleDateString(getDeviceLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function sameMember(a: { member_user_id: string | null; member_email: string | null }, b: { member_user_id: string | null; member_email: string | null }) {
  if (a.member_user_id && b.member_user_id) return a.member_user_id === b.member_user_id
  if (a.member_email && b.member_email) return a.member_email.toLowerCase() === b.member_email.toLowerCase()
  return false
}

function memberKey(member: { member_user_id: string | null; member_email: string | null }) {
  if (member.member_user_id) return `uid:${member.member_user_id}`
  if (member.member_email) return `mail:${member.member_email.toLowerCase()}`
  return 'unknown'
}

function buildEqualSplitRows(baseMembers: SplitMember[], totalAmount: number): SplitRow[] {
  if (!baseMembers.length || totalAmount <= 0) {
    return baseMembers.map((member) => ({
      member_user_id: member.member_user_id,
      member_email: member.member_email,
      label: member.label,
      amountInput: '',
    }))
  }

  const totalCents = Math.round(totalAmount * 100)
  const count = baseMembers.length
  const base = Math.floor(totalCents / count)
  let remainder = totalCents % count

  return baseMembers.map((member) => {
    const cents = base + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder -= 1
    return {
      member_user_id: member.member_user_id,
      member_email: member.member_email,
      label: member.label,
      amountInput: numberToCurrencyInput(cents / 100),
    }
  })
}

export default function ExpensesScreen() {
  const theme = useTheme()
  const { id: tripId, title: tripTitle, openNew } = useLocalSearchParams()
  const tid = String(tripId || '')

  const { expenses, budget, budgetCurrency, loadAll, saveExpense, saveExpenseWithSplit, deleteExpense } = useExpenseStore(
    useShallow((s) => ({
      expenses: s.expenses, budget: s.budget, budgetCurrency: s.budgetCurrency,
      loadAll: s.loadAll, saveExpense: s.saveExpense,
      saveExpenseWithSplit: s.saveExpenseWithSplit, deleteExpense: s.deleteExpense,
    }))
  )

  const [modalVisible, setModalVisible] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Alimentação')
  const [currency, setCurrency] = useState('R$')
  const [date, setDate] = useState('')
  const [receiptUris, setReceiptUris] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const [members, setMembers] = useState<SplitMember[]>([])
  const [expenseSplits, setExpenseSplits] = useState<ExpenseSplit[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [paidByUserId, setPaidByUserId] = useState<string | null>(null)
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [splitRows, setSplitRows] = useState<SplitRow[]>([])

  const expenseAmount = parseCurrencyInput(amount)
  const activeSplitRows = useMemo(
    () => (splitMode === 'equal' ? buildEqualSplitRows(members, expenseAmount) : splitRows),
    [splitMode, members, expenseAmount, splitRows]
  )
  const splitTotal = activeSplitRows.reduce((sum, row) => sum + parseCurrencyInput(row.amountInput), 0)
  const splitDiff = expenseAmount - splitTotal

  const getMemberLabel = useCallback((userId: string | null, email: string | null) => {
    const match = members.find((item) => sameMember(item, { member_user_id: userId, member_email: email }))
    if (match) return match.label
    if (email) return email
    if (userId) return `Membro ${userId.slice(0, 6)}`
    return 'Membro'
  }, [members])

  const loadSplitContext = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    setCurrentUserId(user?.id ?? null)

    const [tripRes, membersRes, splitsRes] = await Promise.all([
      supabase.from('trips').select('owner_id').eq('id', tid).single(),
      supabase.from('trip_members').select('user_id, invited_email, status').eq('trip_id', tid).eq('status', 'accepted'),
      supabase.from('expense_splits').select('*').eq('trip_id', tid),
    ])

    if (splitsRes.error) {
      showAlert(t('error_title'), splitsRes.error.message)
    } else {
      setExpenseSplits((splitsRes.data || []) as ExpenseSplit[])
    }

    const ownerId = (tripRes.data as { owner_id?: string } | null)?.owner_id ?? null
    const map = new Map<string, SplitMember>()

    if (ownerId) {
      const ownerLabel = ownerId === user?.id ? 'Voce' : 'Dono da viagem'
      map.set(`uid:${ownerId}`, {
        member_user_id: ownerId,
        member_email: user?.id === ownerId ? (user.email ?? null) : null,
        label: ownerLabel,
      })
    }

    ;((membersRes.data || []) as Array<{ user_id: string | null; invited_email: string }>).forEach((item) => {
      const label = item.user_id === user?.id ? `${item.invited_email} (voce)` : item.invited_email
      const normalized: SplitMember = {
        member_user_id: item.user_id ?? null,
        member_email: item.invited_email ?? null,
        label,
      }
      map.set(memberKey(normalized), normalized)
    })

    if (user?.id && !map.has(`uid:${user.id}`)) {
      map.set(`uid:${user.id}`, {
        member_user_id: user.id,
        member_email: user.email ?? null,
        label: 'Voce',
      })
    }

    const loadedMembers = Array.from(map.values())
    setMembers(loadedMembers)
    if (!paidByUserId) {
      setPaidByUserId(user?.id ?? ownerId ?? null)
    }
  }, [tid, paidByUserId])

  useFocusEffect(useCallback(() => {
    loadAll(tid)
    loadSplitContext()
    if (openNew === '1') openNewExpense()
  }, [openNew, tid]))

  function buildDefaultSplitRows(baseMembers: SplitMember[]) {
    return baseMembers.map((member) => ({
      member_user_id: member.member_user_id,
      member_email: member.member_email,
      label: member.label,
      amountInput: '',
    }))
  }

  function resetForm() {
    setEditingExpenseId(null)
    setAmount('')
    setDescription('')
    setCategory('Alimentação')
    setCurrency('R$')
    setDate(new Date().toISOString().split('T')[0])
    setReceiptUris([])
    setSplitEnabled(false)
    setSplitMode('equal')
    setSplitRows(buildDefaultSplitRows(members))
    setPaidByUserId(currentUserId)
  }

  function openNewExpense() {
    resetForm()
    setModalVisible(true)
  }

  function openEditExpense(expense: Expense) {
    setEditingExpenseId(expense.id)
    setAmount(numberToCurrencyInput(expense.amount))
    setDescription(expense.description || '')
    setCategory(expense.category || 'Alimentação')
    setCurrency(expense.currency || 'R$')
    setDate(expense.date || new Date().toISOString().split('T')[0])
    setReceiptUris(parseReceiptUris(expense.image_url))
    setPaidByUserId(expense.paid_by_user_id ?? currentUserId)

    const expenseRows = expenseSplits.filter((item) => item.expense_id === expense.id)
    if (expenseRows.length) {
      setSplitEnabled(true)
      setSplitMode('manual')
      const merged = buildDefaultSplitRows(members)
      expenseRows.forEach((row) => {
        const idx = merged.findIndex((member) => sameMember(member, row))
        const mapped: SplitRow = {
          member_user_id: row.member_user_id,
          member_email: row.member_email,
          label: getMemberLabel(row.member_user_id, row.member_email),
          amountInput: numberToCurrencyInput(row.amount),
        }
        if (idx >= 0) merged[idx] = mapped
        else merged.push(mapped)
      })
      setSplitRows(merged)
    } else {
      setSplitEnabled(false)
      setSplitMode('equal')
      setSplitRows(buildDefaultSplitRows(members))
    }

    setModalVisible(true)
  }

  function handleCloseExpenseModal() {
    setModalVisible(false)
    resetForm()
  }

  function updateSplitAmount(index: number, input: string) {
    setSplitRows((prev) => prev.map((row, idx) => (
      idx === index ? { ...row, amountInput: applyCurrencyMask(input) } : row
    )))
  }

  async function handleSave() {
    const parsedAmount = parseCurrencyInput(amount)
    if (!amount || parsedAmount <= 0) {
      showAlert(t('attention_title'), t('invalid_amount'))
      return
    }

    if (splitEnabled) {
      if (!paidByUserId) {
        showAlert(t('attention_title'), 'Selecione quem pagou o gasto.')
        return
      }

      const sourceRows = splitMode === 'equal' ? buildEqualSplitRows(members, parsedAmount) : splitRows
      const nonZeroSplits = sourceRows
        .map((row) => ({
          member_user_id: row.member_user_id,
          member_email: row.member_email,
          amount: parseCurrencyInput(row.amountInput),
          notes: null as string | null,
        }))
        .filter((row) => row.amount > 0)

      if (!nonZeroSplits.length) {
        showAlert(t('attention_title'), 'Nao foi possivel montar a divisao. Confira os membros da viagem.')
        return
      }

      const sum = nonZeroSplits.reduce((acc, row) => acc + row.amount, 0)
      if (Math.abs(sum - parsedAmount) > 0.01) {
        showAlert(
          t('attention_title'),
          `A soma da divisao deve ser igual ao total. Diferenca atual: R$ ${formatBRL(Math.abs(parsedAmount - sum))}.`
        )
        return
      }

      setSaving(true)
      const { error } = await saveExpenseWithSplit(
        tid,
        {
          amount: parsedAmount,
          currency,
          category,
          description: description.trim(),
          date: date || new Date().toISOString().split('T')[0],
          image_url: serializeReceiptUris(receiptUris),
          paid_by_user_id: paidByUserId,
        },
        nonZeroSplits,
        editingExpenseId
      )
      setSaving(false)

      if (!error) {
        await loadSplitContext()
        setModalVisible(false)
        resetForm()
      } else {
        showAlert(t('error_title'), error)
      }
      return
    }

    setSaving(true)
    const { error } = await saveExpense(
      tid,
      {
        amount: parsedAmount,
        currency,
        category,
        description: description.trim(),
        date: date || new Date().toISOString().split('T')[0],
        image_url: serializeReceiptUris(receiptUris),
        paid_by_user_id: paidByUserId,
      },
      editingExpenseId
    )
    setSaving(false)
    if (!error) {
      await loadSplitContext()
      setModalVisible(false)
      resetForm()
    } else {
      showAlert(t('error_title'), t('save_failed'))
    }
  }

  async function runDelete(expenseId: string) {
    await deleteExpense(expenseId, tid)
    await loadSplitContext()
    setModalVisible(false)
    resetForm()
  }

  function handleDelete(expenseId: string) {
    showAlert(t('confirm_delete_expense_title'), t('confirm_delete_expense_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'),
        style: 'destructive',
        onPress: () => {
          showAlert(t('confirm_delete_expense_second_title'), t('confirm_delete_expense_second_body'), [
            { text: t('cancel_label'), style: 'cancel' },
            { text: t('delete_label'), style: 'destructive', onPress: async () => runDelete(expenseId) },
          ])
        },
      },
    ])
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const budgetCur = budgetCurrency || 'R$'
  const budgetAmount = budget
  const budgetPct = budgetAmount && budgetAmount > 0 ? Math.min((total / budgetAmount) * 100, 100) : 0
  const budgetBarColor = budgetPct >= 90 ? theme.colors.error : budgetPct >= 75 ? '#FF9500' : theme.colors.success
  const budgetBalance = budgetAmount != null ? budgetAmount - total : null

  const categoryTotals = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])
  const maxCat = categoryTotals[0]?.[1] || 1

  const paymentsSummary = useMemo(() => {
    const byMember = new Map<string, { label: string; paid: number }>()

    members.forEach((member) => {
      byMember.set(memberKey(member), { label: member.label, paid: 0 })
    })

    expenses.forEach((expense) => {
      const key = expense.paid_by_user_id ? `uid:${expense.paid_by_user_id}` : 'unknown-payer'
      const label = expense.paid_by_user_id
        ? getMemberLabel(expense.paid_by_user_id, null)
        : 'Pagador nao informado'
      const existing = byMember.get(key) || { label, paid: 0 }
      existing.paid += expense.amount
      byMember.set(key, existing)
    })

    return Array.from(byMember.entries())
      .map(([key, item]) => ({ key, ...item }))
      .filter((item) => item.paid > 0)
      .sort((a, b) => b.paid - a.paid)
  }, [members, expenses, getMemberLabel])

  return (
    <DesktopLayout>
      <Box flex={1} bg="background">
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

        <FlatList
          data={expenses}
          keyExtractor={useCallback((item: Expense) => item.id, [])}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={<>
          {/* HERO BUDGET CARD */}
          {budgetAmount != null && (
            <Card variant="surface" style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 24 }}>
              <VStack p={6} gap={5}>
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <VStack gap={1}>
                    <Text variant="overline" color="textTertiary" weight="700" style={{ fontSize: 10, letterSpacing: 1 }}>
                      TOTAL GASTO
                    </Text>
                    <Text variant="display" weight="800">R$ {formatBRL(total)}</Text>
                  </VStack>
                  {tripTitle ? (
                    <Box
                      bg="surfaceHigh"
                      borderRadius="full"
                      px={4}
                      py={2}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text variant="bodySmall" weight="700" color="brand" style={{ fontSize: 10, letterSpacing: 0.5 }}>
                        {(tripTitle as string).substring(0, 15)}
                      </Text>
                    </Box>
                  ) : null}
                </HStack>

                {/* Progress Bar Section */}
                <VStack gap={3}>
                  <HStack justifyContent="space-between">
                    <Text variant="bodySmall" color="textSecondary" weight="600">Progresso</Text>
                    <Text variant="bodySmall" weight="700" style={{ color: theme.colors.brand }}>
                      TOTAL PLANEJADO: R$ {formatBRL(budgetAmount)}
                    </Text>
                  </HStack>
                  <View style={styles.budgetTrack}>
                    <View style={[styles.budgetBar, { width: `${budgetPct}%` as const, backgroundColor: budgetBarColor }]} />
                  </View>
                  <HStack justifyContent="space-between" alignItems="flex-end">
                    <VStack gap={0.5}>
                      <Text variant="overline" color="textTertiary" weight="700" style={{ fontSize: 9, letterSpacing: 0.5 }}>
                        % UTILIZADO
                      </Text>
                      <Text variant="subtitle" weight="800" style={{ color: theme.colors.brand }}>
                        {Math.round(budgetPct)}%
                      </Text>
                    </VStack>
                    <VStack gap={0.5} alignItems="flex-end">
                      <Text variant="overline" color="textTertiary" weight="700" style={{ fontSize: 9, letterSpacing: 0.5 }}>
                        SALDO RESTANTE
                      </Text>
                      <Text variant="subtitle" weight="800">
                        R$ {formatBRL(Math.abs(budgetBalance ?? 0))}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            </Card>
          )}

          {/* DIVISÃO DE CUSTOS SECTION */}
          {paymentsSummary.length > 0 && (
            <VStack gap={4} mb={6}>
              <Text
                variant="overline"
                color="textTertiary"
                weight="700"
                px={5}
                style={{ fontSize: 10, letterSpacing: 1 }}
              >
                DIVISÃO DE CUSTOS
              </Text>
              <HScrollable
                contentContainerStyle={{
                  flexDirection: 'row',
                  gap: 12,
                  paddingHorizontal: 20,
                }}
              >
                {paymentsSummary.map((item) => (
                  <Card
                    key={item.key}
                    variant="outlined"
                    style={{
                      minWidth: 180,
                      flex: 1,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  >
                    <HStack gap={3} alignItems="center">
                      <Box
                        width={40}
                        height={40}
                        borderRadius="lg"
                        bg={theme.colors.brand + '20'}
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon
                          name={item.key.includes('uid:') ? 'person' : 'email'}
                          size={18}
                          color={theme.colors.brand}
                        />
                      </Box>
                      <VStack gap={1} flex={1}>
                        <Text
                          variant="overline"
                          color="textTertiary"
                          weight="700"
                          numberOfLines={1}
                          style={{ fontSize: 8, letterSpacing: 0.5 }}
                        >
                          {item.label.substring(0, 20)}
                        </Text>
                        <Text variant="subtitle" weight="800" numberOfLines={1}>
                          R$ {formatBRL(item.paid)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Card>
                ))}
              </HScrollable>
            </VStack>
          )}

          {/* CATEGORIAS SECTION */}
          {categoryTotals.length > 0 && (
            <VStack gap={4} mb={6}>
              <HStack justifyContent="space-between" alignItems="center" px={5}>
                <Text
                  variant="overline"
                  color="textTertiary"
                  weight="700"
                  style={{ fontSize: 10, letterSpacing: 1 }}
                >
                  CATEGORIAS
                </Text>
                <Pressable onPress={() => {}}>
                  <Text variant="bodySmall" weight="700" style={{ color: theme.colors.brand, fontSize: 11 }}>
                    Ver detalhes
                  </Text>
                </Pressable>
              </HStack>
              <VStack gap={3} px={5}>
                {categoryTotals.slice(0, 4).map(([cat, amt]) => {
                  const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF['Outros']
                  const pct = (amt / maxCat) * 100
                  return (
                    <VStack key={cat} gap={2.5}>
                      <HStack justifyContent="space-between" alignItems="center">
                        <HStack gap={2} alignItems="center" flex={1}>
                          <Box
                            width={32}
                            height={32}
                            borderRadius="lg"
                            bg={conf.color + '20'}
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Icon name={conf.icon} size={16} color={conf.color} />
                          </Box>
                          <Text variant="body" weight="600" numberOfLines={1}>
                            {cat}
                          </Text>
                        </HStack>
                        <Text variant="bodySmall" weight="800">
                          R$ {formatBRL(amt)}
                        </Text>
                      </HStack>
                      <View style={{ height: 6, backgroundColor: theme.colors.surfaceHigh, borderRadius: 3, overflow: 'hidden' }}>
                        <View
                          style={{
                            height: 6,
                            borderRadius: 3,
                            width: `${pct}%` as const,
                            backgroundColor: conf.color,
                          }}
                        />
                      </View>
                    </VStack>
                  )
                })}
              </VStack>
            </VStack>
          )}

          {/* TRANSAÇÕES RECENTES HEADER */}
          {expenses.length > 0 && (
            <Text
              variant="overline"
              color="textTertiary"
              weight="700"
              px={5}
              mb={4}
              style={{ fontSize: 10, letterSpacing: 1 }}
            >
              TRANSAÇÕES RECENTES
            </Text>
          )}
          </>}
          ListEmptyComponent={
            <Box mt={12}>
              <EmptyState title={t('no_expenses')} />
            </Box>
          }
          renderItem={({ item }) => {
                const conf = EXPENSE_CATEGORY_CONF[item.category] ?? EXPENSE_CATEGORY_CONF['Outros']
                const itemSplits = expenseSplits.filter((split) => split.expense_id === item.id)
                const payerLabel = item.paid_by_user_id
                  ? (item.paid_by_user_id === currentUserId ? 'Voce' : getMemberLabel(item.paid_by_user_id, null))
                  : 'nao informado'
                return (
                  <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                    <Pressable onPress={() => openEditExpense(item)} accessibilityLabel={`${item.category}, ${item.currency} ${formatBRL(item.amount)}`} accessibilityRole="button">
                      <Card variant="surface">
                        <HStack p={4} gap={4} alignItems="center" justifyContent="space-between">
                          <HStack gap={4} alignItems="center" flex={1}>
                            <Box
                              width={48}
                              height={48}
                              borderRadius="xl"
                              alignItems="center"
                              justifyContent="center"
                              bg={conf.color + '18'}
                              flexShrink={0}
                            >
                              <Icon name={conf.icon} size={20} color={conf.color} />
                            </Box>
                            <VStack gap={1.5} flex={1}>
                              <Text variant="body" weight="700">
                                {item.description || item.category}
                              </Text>
                              <HStack gap={1.5} alignItems="center">
                                <Text variant="caption" color="textSecondary" weight="600">
                                  {formatExpenseDate(item.date)} • {item.category}
                                </Text>
                                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.textTertiary }} />
                                <Text variant="caption" weight="700" style={{ color: conf.color }}>
                                  {payerLabel === 'Voce' ? 'Voce pagou' : `${payerLabel} pagou`}
                                </Text>
                              </HStack>
                              {itemSplits.length > 0 ? (
                                <Text variant="caption" color="textSecondary" weight="600">
                                  Divisao em {itemSplits.length} membro(s)
                                </Text>
                              ) : null}
                            </VStack>
                          </HStack>
                          <VStack alignItems="flex-end" gap={1}>
                            {parseReceiptUris(item.image_url).length > 0 ? (
                              <HStack gap={1} alignItems="center">
                                <Icon name="receipt" size={14} color={theme.colors.textTertiary} />
                                {parseReceiptUris(item.image_url).length > 1 ? (
                                  <Text variant="caption" color="textTertiary" weight="700">
                                    {parseReceiptUris(item.image_url).length}
                                  </Text>
                                ) : null}
                              </HStack>
                            ) : null}
                            <Text variant="body" weight="800" style={{ color: conf.color, fontSize: 16 }}>
                              R$ {formatBRL(item.amount)}
                            </Text>
                          </VStack>
                        </HStack>
                      </Card>
                    </Pressable>
                  </View>
                )
          }}
        />

        <FAB accessibilityLabel="Novo gasto" onPress={openNewExpense}>
          <Icon name="add" size={28} color="#fff" />
        </FAB>

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
              {CATEGORIES.map((cat) => {
                const conf = EXPENSE_CATEGORY_CONF[cat] ?? EXPENSE_CATEGORY_CONF.Outros
                const active = category === cat
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    accessibilityLabel={`Categoria ${cat}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === cat }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: theme.radius.full,
                      borderWidth: 1.5,
                      borderColor: active ? conf.color : theme.colors.border,
                      backgroundColor: active ? conf.color + '14' : theme.colors.surfaceHigh,
                    }}
                  >
                    <Icon name={conf.icon} size={14} color={active ? conf.color : theme.colors.textSecondary} />
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

          <Box mt={4}>
            <Text variant="overline" color="textSecondary" style={{ marginBottom: 8 }}>Quem pagou</Text>
            <HScrollable contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
              {members.map((member) => {
                const selected = Boolean(paidByUserId && member.member_user_id === paidByUserId)
                return (
                  <Pressable
                    key={memberKey(member)}
                    onPress={() => setPaidByUserId(member.member_user_id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: theme.radius.full,
                      borderWidth: 1.2,
                      borderColor: selected ? theme.colors.brand : theme.colors.border,
                      backgroundColor: selected ? theme.colors.brand + '1A' : theme.colors.surfaceHigh,
                    }}
                  >
                    <Text variant="caption" weight={selected ? '700' : '600'} color={selected ? 'brand' : 'textSecondary'}>
                      {member.label}
                    </Text>
                  </Pressable>
                )
              })}
            </HScrollable>
          </Box>

          <Box mt={4}>
            <Pressable
              onPress={() => {
                setSplitEnabled((prev) => !prev)
                if (!splitRows.length) setSplitRows(buildDefaultSplitRows(members))
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: splitEnabled ? theme.colors.brand : theme.colors.border,
                backgroundColor: splitEnabled ? theme.colors.brand + '14' : theme.colors.surfaceHigh,
              }}
            >
              <Text variant="bodySmall" weight="700">
                Dividir gasto
              </Text>
              <Icon name={splitEnabled ? 'check-circle' : 'radio-button-unchecked'} size={18} color={splitEnabled ? theme.colors.brand : theme.colors.textTertiary} />
            </Pressable>
          </Box>

          {splitEnabled && (
            <Box
              mt={3}
              px={3.5}
              py={3.5}
              borderRadius="xl"
              borderWidth={1}
              borderColor="border"
              bg="surfaceHigh"
            >
              <VStack gap={2.5}>
                <Text variant="overline" color="textSecondary">Dividir gasto</Text>

                <HStack gap={2}>
                  <Pressable
                    onPress={() => setSplitMode('equal')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: splitMode === 'equal' }}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      borderWidth: 1.2,
                      borderColor: splitMode === 'equal' ? theme.colors.brand : theme.colors.border,
                      backgroundColor: splitMode === 'equal' ? theme.colors.brand + '1A' : theme.colors.surface,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="bodySmall" weight={splitMode === 'equal' ? '700' : '600'} color={splitMode === 'equal' ? 'brand' : 'textSecondary'}>
                      Meio a meio
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSplitMode('manual')
                      setSplitRows(buildDefaultSplitRows(members))
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: splitMode === 'manual' }}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      borderWidth: 1.2,
                      borderColor: splitMode === 'manual' ? theme.colors.brand : theme.colors.border,
                      backgroundColor: splitMode === 'manual' ? theme.colors.brand + '1A' : theme.colors.surface,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="bodySmall" weight={splitMode === 'manual' ? '700' : '600'} color={splitMode === 'manual' ? 'brand' : 'textSecondary'}>
                      Manual
                    </Text>
                  </Pressable>
                </HStack>

                <Text variant="caption" color="textSecondary">
                  {splitMode === 'equal'
                    ? 'O valor sera dividido igualmente entre todos os membros.'
                    : 'Informe quanto cada membro deve pagar.'}
                </Text>

                {activeSplitRows.map((row, index) => (
                  <HStack key={`${memberKey(row)}:${index}`} alignItems="center" gap={2}>
                    <Box flex={1}>
                      <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                        {row.label}
                      </Text>
                    </Box>
                    <Box width={145}>
                      <Input
                        placeholder="0,00"
                        value={row.amountInput}
                        onChangeText={(text) => updateSplitAmount(index, text)}
                        keyboardType="numeric"
                        size="lg"
                        editable={splitMode === 'manual'}
                      />
                    </Box>
                  </HStack>
                ))}

                {Math.abs(splitDiff) > 0.01 && splitDiff > 0 ? (
                  <Text variant="caption" weight="700" style={{ color: theme.colors.error, marginTop: 4 }}>
                    Ainda falta dividir R$ {formatBRL(splitDiff)} do valor total.
                  </Text>
                ) : null}

                {Math.abs(splitDiff) > 0.01 && splitDiff < 0 ? (
                  <Text variant="caption" weight="700" style={{ color: theme.colors.error, marginTop: 4 }}>
                    Os valores informados ultrapassam o total em R$ {formatBRL(Math.abs(splitDiff))}.
                  </Text>
                ) : null}
              </VStack>
            </Box>
          )}

          <Box mt={4}>
            <ReceiptPicker
              imageUris={receiptUris}
              onChanged={setReceiptUris}
              onUploadingChange={(v) => setSaving(v)}
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
