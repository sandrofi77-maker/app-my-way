import { ScrollView } from 'react-native'
import Icon from '../components/Icon'
import SheetModal from '../components/SheetModal'
import DesktopLayout from '../components/DesktopLayout'
import { useState, useCallback } from 'react'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { showAlert } from '../lib/alert'
import { useChecklistStore } from '../stores/useChecklistStore'
import { useShallow } from 'zustand/react/shallow'
import {
  Box, Text, VStack, HStack, Card, Input, Button, FAB,
  EmptyState, Pressable, useTheme, IconButton, Progress, useToast,
} from '../design-system'

import { CHECKLIST_CATEGORIES, CHECKLIST_TEMPLATES } from '../constants/categories'

const CATEGORIES = CHECKLIST_CATEGORIES
const TEMPLATES = CHECKLIST_TEMPLATES

export default function ChecklistScreen() {
  const theme = useTheme()
  const toast = useToast()
  const { id: tripId, title: tripTitle } = useLocalSearchParams()
  const tid = String(tripId || '')
  const store = useChecklistStore(
    useShallow((s) => ({
      items: s.items, loadItems: s.loadItems, addItem: s.addItem,
      toggleItem: s.toggleItem, deleteItem: s.deleteItem, addTemplate: s.addTemplate,
    }))
  )
  const { items } = store

  const [modalVisible, setModalVisible] = useState(false)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('outros')
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => { store.loadItems(tid) }, []))

  async function handleToggle(item: Parameters<typeof store.toggleItem>[0]) {
    const { error } = await store.toggleItem(item)
    if (error) toast.show({ message: 'Erro ao atualizar item.', tone: 'error' })
  }

  function handleDelete(id: string) {
    showAlert('Remover item', 'Deseja remover este item da checklist?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const { error } = await store.deleteItem(id)
        if (error) toast.show({ message: 'Erro ao remover item.', tone: 'error' })
      }}
    ])
  }

  async function handleAddItem() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { error } = await store.addItem(tid, newTitle.trim(), newCategory)
    setSaving(false)
    if (error) { toast.show({ message: 'Erro ao adicionar item.', tone: 'error' }); return }
    setModalVisible(false); setNewTitle(''); setNewCategory('outros')
  }

  async function handleAddTemplate(categoryKey: string) {
    const templateTitles = TEMPLATES[categoryKey] || []
    const { error, alreadyExists } = await store.addTemplate(tid, categoryKey, templateTitles)
    if (error) { toast.show({ message: 'Erro ao aplicar template.', tone: 'error' }); return }
    if (alreadyExists) { showAlert('Templates', 'Todos os itens deste template ja foram adicionados.'); return }
    setTemplateModalVisible(false)
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat, items: items.filter(i => i.category === cat.key),
  })).filter(g => g.items.length > 0)

  const doneCount = items.filter(i => i.is_done).length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

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
              <Text variant="subtitle" weight="700">Checklist</Text>
              {tripTitle ? <Text variant="caption" color="textSecondary" numberOfLines={1}>{tripTitle as string}</Text> : null}
            </Box>
            <IconButton accessibilityLabel="Templates" onPress={() => setTemplateModalVisible(true)} variant="ghost">
              <Icon name="playlist-add" size={22} color={theme.colors.text} />
            </IconButton>
          </HStack>
        </Box>

        {/* Progress bar */}
        {totalCount > 0 && (
          <Box bg="surface" borderBottomWidth={0.5} borderColor="border" px={5} py={3} gap={1.5}>
            <Progress value={progressPct} tone="success" size="sm" />
            <Text variant="caption" color="textSecondary">{doneCount} de {totalCount} concluidos</Text>
          </Box>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {grouped.length === 0 ? (
            <Box mt={14}>
              <EmptyState
                icon={<Icon name="checklist" size={48} color={theme.colors.textTertiary} />}
                title="Checklist vazio"
                description="Adicione itens manualmente ou use templates prontos."
                action={
                  <Button
                    variant="primary"
                    leftIcon={<Icon name="playlist-add" size={18} color="#fff" />}
                    onPress={() => setTemplateModalVisible(true)}
                  >
                    Usar template
                  </Button>
                }
              />
            </Box>
          ) : (
            <VStack gap={4}>
              {grouped.map(group => (
                <Card key={group.key} variant="outlined">
                  {/* Group header */}
                  <HStack gap={2} px={4} py={3} alignItems="center"
                    style={{ borderBottomWidth: 0.5, borderBottomColor: theme.colors.border }}
                  >
                    <Icon name={group.icon as any} size={16} color={group.color} />
                    <Text variant="caption" weight="700" style={{ color: group.color, flex: 1 }}>{group.label}</Text>
                    <Text variant="caption" color="textTertiary">
                      {group.items.filter(i => i.is_done).length}/{group.items.length}
                    </Text>
                  </HStack>

                  {/* Items */}
                  {group.items.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleToggle(item)}
                      onLongPress={() => handleDelete(item.id)}
                      accessibilityLabel={`${item.title}${item.is_done ? ', concluído' : ''}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.is_done }}
                      accessibilityHint="Toque para marcar, segure para remover"
                    >
                      <HStack
                        gap={3} px={4} py={3.5} alignItems="center"
                        style={[
                          { borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
                          item.is_done && { opacity: 0.55 },
                        ] as any}
                      >
                        <Box
                          width={22} height={22} borderRadius="full"
                          borderWidth={2}
                          borderColor={item.is_done ? 'success' : 'border'}
                          bg={item.is_done ? 'success' : 'surface'}
                          alignItems="center" justifyContent="center"
                        >
                          {item.is_done && <Icon name="check" size={14} color="#fff" />}
                        </Box>
                        <Text
                          variant="body"
                          style={item.is_done ? { textDecorationLine: 'line-through', color: theme.colors.textTertiary } : undefined}
                        >
                          {item.title}
                        </Text>
                      </HStack>
                    </Pressable>
                  ))}
                </Card>
              ))}
            </VStack>
          )}
        </ScrollView>

        <FAB accessibilityLabel="Novo item" onPress={() => setModalVisible(true)}>
          <Icon name="add" size={28} color="#fff" />
        </FAB>

        {/* Modal: novo item */}
        <SheetModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Novo item">
          <Input
            label="Item"
            placeholder="Ex: Passaporte"
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus
            size="lg"
          />

          <VStack gap={2} mt={4}>
            <Text variant="overline" color="textSecondary">Categoria</Text>
            <HStack gap={2} style={{ flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.key}
                  onPress={() => setNewCategory(cat.key)}
                  accessibilityLabel={`Categoria ${cat.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: newCategory === cat.key }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 14, paddingVertical: 9,
                    borderRadius: theme.radius.full,
                    borderWidth: 1.5,
                    borderColor: newCategory === cat.key ? cat.color : theme.colors.border,
                    backgroundColor: newCategory === cat.key ? cat.color + '14' : theme.colors.surfaceHigh,
                  }}
                >
                  <Icon name={cat.icon as any} size={14} color={newCategory === cat.key ? cat.color : theme.colors.textSecondary} />
                  <Text variant="bodySmall" weight={newCategory === cat.key ? '700' : '600'}
                    style={{ color: newCategory === cat.key ? cat.color : theme.colors.textSecondary }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </HStack>
          </VStack>

          <Box mt={6}>
            <Button variant="primary" size="lg" fullWidth loading={saving} onPress={handleAddItem}>
              Adicionar
            </Button>
          </Box>
        </SheetModal>

        {/* Modal: templates */}
        <SheetModal visible={templateModalVisible} onClose={() => setTemplateModalVisible(false)} title="Templates" subtitle="Selecione uma categoria para adicionar itens prontos">
          <VStack gap={0}>
            {CATEGORIES.map(cat => (
              <Pressable key={cat.key} onPress={() => handleAddTemplate(cat.key)} accessibilityLabel={`Template ${cat.label}, ${TEMPLATES[cat.key]?.length || 0} sugestões`} accessibilityRole="button">
                <HStack gap={3.5} py={3.5} alignItems="center"
                  style={{ borderBottomWidth: 0.5, borderBottomColor: theme.colors.border }}
                >
                  <Box
                    width={44} height={44} borderRadius="xl"
                    alignItems="center" justifyContent="center"
                    bg={cat.color + '18'}
                  >
                    <Icon name={cat.icon as any} size={20} color={cat.color} />
                  </Box>
                  <VStack flex={1}>
                    <Text variant="body" weight="600">{cat.label}</Text>
                    <Text variant="caption" color="textSecondary">{TEMPLATES[cat.key]?.length || 0} sugestoes</Text>
                  </VStack>
                  <Icon name="chevron-right" size={20} color={theme.colors.textTertiary} />
                </HStack>
              </Pressable>
            ))}
          </VStack>
        </SheetModal>
      </Box>
    </DesktopLayout>
  )
}
