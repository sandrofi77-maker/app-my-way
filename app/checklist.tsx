import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput
} from 'react-native'
import Icon from '../components/Icon'
import SheetModal from '../components/SheetModal'
import DesktopLayout from '../components/DesktopLayout'
import { useState, useCallback } from 'react'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import { showAlert } from '../lib/alert'

const C = Colors.dark

const CATEGORIES = [
  { key: 'documentos', label: 'Documentos',   icon: 'badge',           color: '#5856D6' },
  { key: 'roupas',     label: 'Roupas',        icon: 'checkroom',       color: '#FF9500' },
  { key: 'eletronicos',label: 'Eletrônicos',   icon: 'devices',         color: '#32ADE6' },
  { key: 'saude',      label: 'Saúde',         icon: 'medical-services',color: '#FF2D55' },
  { key: 'outros',     label: 'Outros',        icon: 'checklist',       color: '#8E8E93' },
]

const TEMPLATES: Record<string, string[]> = {
  documentos:  ['Passaporte', 'Visto', 'Seguro viagem', 'Passagem impressa', 'Reservas de hotel'],
  roupas:      ['Roupas para os dias', 'Casaco / agasalho', 'Traje de banho', 'Sapatos confortáveis', 'Roupa íntima extra'],
  eletronicos: ['Carregador do celular', 'Adaptador de tomada', 'Fones de ouvido', 'Power bank', 'Câmera'],
  saude:       ['Remédios pessoais', 'Protetor solar', 'Repelente', 'Kit de primeiros socorros', 'Máscara'],
  outros:      ['Carteira / dinheiro', 'Cópia dos documentos', 'Guia / mapa', 'Snacks para viagem'],
}

type ChecklistItem = {
  id: string
  title: string
  is_done: boolean
  category: string
}

function getCategoryConf(key: string) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]
}

export default function ChecklistScreen() {
  const { id: tripId, title: tripTitle } = useLocalSearchParams()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('outros')
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => { loadItems() }, []))

  async function loadItems() {
    const { data } = await supabase
      .from('trip_checklists')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
    setItems((data || []) as ChecklistItem[])
  }

  async function toggleItem(item: ChecklistItem) {
    await supabase
      .from('trip_checklists')
      .update({ is_done: !item.is_done })
      .eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_done: !i.is_done } : i))
  }

  async function deleteItem(id: string) {
    showAlert('Remover item', 'Deseja remover este item da checklist?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await supabase.from('trip_checklists').delete().eq('id', id)
          setItems(prev => prev.filter(i => i.id !== id))
        }
      }
    ])
  }

  async function handleAddItem() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('trip_checklists').insert({
      trip_id: tripId,
      user_id: user?.id,
      title: newTitle.trim(),
      category: newCategory,
      is_done: false,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setItems(prev => [...prev, data as ChecklistItem])
      setModalVisible(false)
      setNewTitle('')
      setNewCategory('outros')
    }
  }

  async function handleAddTemplate(categoryKey: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const templateItems = TEMPLATES[categoryKey] || []
    const existingTitles = new Set(items.map(i => i.title.toLowerCase()))
    const toInsert = templateItems
      .filter(t => !existingTitles.has(t.toLowerCase()))
      .map(title => ({
        trip_id: tripId as string,
        user_id: user?.id as string,
        title,
        category: categoryKey,
        is_done: false,
      }))
    if (!toInsert.length) {
      showAlert('Templates', 'Todos os itens deste template já foram adicionados.')
      return
    }
    const { data } = await supabase.from('trip_checklists').insert(toInsert).select()
    if (data) setItems(prev => [...prev, ...(data as ChecklistItem[])])
    setTemplateModalVisible(false)
  }

  // Group items by category
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.key),
  })).filter(g => g.items.length > 0)

  const doneCount = items.filter(i => i.is_done).length
  const totalCount = items.length
  const progress = totalCount > 0 ? doneCount / totalCount : 0

  return (
    <DesktopLayout>
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={22} color={C.icon} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Checklist</Text>
          {tripTitle ? <Text style={styles.headerSub} numberOfLines={1}>{tripTitle as string}</Text> : null}
        </View>
        <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplateModalVisible(true)}>
          <Icon name="playlist-add" size={22} color={C.icon} />
        </TouchableOpacity>
      </View>

      {/* ── Barra de progresso ── */}
      {totalCount > 0 && (
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{doneCount} de {totalCount} concluídos</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="checklist" size={48} color={C.tertiary} />
            <Text style={styles.emptyTitle}>Checklist vazio</Text>
            <Text style={styles.emptyDesc}>
              Adicione itens manualmente ou use templates prontos.
            </Text>
            <TouchableOpacity style={styles.emptyTemplateBtn} onPress={() => setTemplateModalVisible(true)}>
              <Icon name="playlist-add" size={18} color="#fff" />
              <Text style={styles.emptyTemplateBtnText}>Usar template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          grouped.map(group => (
            <View key={group.key} style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Icon name={group.icon as any} size={16} color={group.color} />
                <Text style={[styles.groupTitle, { color: group.color }]}>{group.label}</Text>
                <Text style={styles.groupCount}>
                  {group.items.filter(i => i.is_done).length}/{group.items.length}
                </Text>
              </View>
              {group.items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, item.is_done && styles.itemRowDone]}
                  onPress={() => toggleItem(item)}
                  onLongPress={() => deleteItem(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.checkbox, item.is_done && { backgroundColor: C.success, borderColor: C.success }]}>
                    {item.is_done && <Icon name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.itemTitle, item.is_done && styles.itemTitleDone]}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── FAB: adicionar item ── */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal: novo item ── */}
      <SheetModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Novo item">
              <Text style={styles.sheetLabel}>Item</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Ex: Passaporte"
                placeholderTextColor={C.tertiary}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
              <Text style={styles.sheetLabel}>Categoria</Text>
              <View style={styles.catChipsRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, newCategory === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '14' }]}
                    onPress={() => setNewCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <Icon name={cat.icon as any} size={14} color={newCategory === cat.key ? cat.color : C.secondary} />
                    <Text style={[styles.catChipText, newCategory === cat.key && { color: cat.color, fontWeight: '700' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddItem} disabled={saving}>
                <Text style={styles.primaryBtnText}>{saving ? 'Adicionando...' : 'Adicionar'}</Text>
              </TouchableOpacity>
      </SheetModal>

      {/* ── Modal: templates ── */}
      <SheetModal visible={templateModalVisible} onClose={() => setTemplateModalVisible(false)} title="Templates" subtitle="Selecione uma categoria para adicionar itens prontos">
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.templateRow}
                  onPress={() => handleAddTemplate(cat.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.templateIconBadge, { backgroundColor: cat.color + '18' }]}>
                    <Icon name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateRowTitle}>{cat.label}</Text>
                    <Text style={styles.templateRowSub}>{TEMPLATES[cat.key]?.length || 0} sugestões</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={C.tertiary} />
                </TouchableOpacity>
              ))}
      </SheetModal>
    </View>
    </DesktopLayout>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  headerSub: { fontSize: 12, color: C.secondary, marginTop: 1, maxWidth: 180 },
  templateBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  progressBar: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border, gap: 6 },
  progressTrack: { height: 6, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.success, borderRadius: 4 },
  progressText: { fontSize: 12, color: C.secondary },

  scrollContent: { padding: 20, paddingBottom: 100 },

  groupSection: { marginBottom: 16, backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: C.border },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  groupTitle: { fontSize: 12, fontWeight: '700', flex: 1 },
  groupCount: { fontSize: 12, color: C.tertiary },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  itemRowDone: { opacity: 0.55 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { flex: 1, fontSize: 15, color: C.primary },
  itemTitleDone: { textDecorationLine: 'line-through', color: C.tertiary },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.primary },
  emptyDesc: { fontSize: 13, color: C.secondary, textAlign: 'center', paddingHorizontal: 20 },
  emptyTemplateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.buttonPrimary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyTemplateBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  fab: {
    position: 'absolute', bottom: 36, right: 24,
    width: 58, height: 58, borderRadius: 18, backgroundColor: C.buttonPrimary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },

  sheetLabel: { fontSize: 10, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  sheetInput: { backgroundColor: C.surfaceHigh, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.primary },

  catChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surfaceHigh },
  catChipText: { fontSize: 13, fontWeight: '600', color: C.secondary },

  primaryBtn: { backgroundColor: C.buttonPrimary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  templateIconBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  templateRowTitle: { fontSize: 15, fontWeight: '600', color: C.primary },
  templateRowSub: { fontSize: 12, color: C.secondary, marginTop: 2 },
})
