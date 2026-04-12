import React, { useState, useMemo } from 'react'
import { ScrollView, ViewStyle } from 'react-native'
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Input,
  Badge,
  useTheme,
  useThemeMode,
  Switch,
  Divider,
  ToastProvider,
} from '..'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { storySections } from './registry'
import { Story, StorySection } from './types'

type StorybookProps = {
  onExit?: () => void
}

export function Storybook(props: StorybookProps) {
  return (
    <ToastProvider>
      <StorybookInner {...props} />
    </ToastProvider>
  )
}

function StorybookInner({ onExit }: StorybookProps) {
  const theme = useTheme()
  const { mode, toggleMode } = useThemeMode()
  const { isDesktop } = useBreakpoint()

  const [selectedId, setSelectedId] = useState<string>(storySections[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredSections = useMemo(() => {
    if (!query.trim()) return storySections
    const q = query.toLowerCase()
    return storySections
      .map(section => ({
        ...section,
        stories: section.stories.filter(s => s.name.toLowerCase().includes(q)),
      }))
      .filter(s => s.title.toLowerCase().includes(q) || s.stories.length > 0)
  }, [query])

  const selected = useMemo(
    () => storySections.find(s => s.id === selectedId) ?? storySections[0],
    [selectedId]
  )

  const sidebar = (
    <VStack
      gap={2}
      p={4}
      style={{
        width: isDesktop ? 280 : '100%',
        backgroundColor: theme.colors.surface,
        borderRightWidth: isDesktop ? 1 : 0,
        borderColor: theme.colors.border,
        height: '100%',
      }}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text variant="h4">Design System</Text>
        {!isDesktop && (
          <Pressable onPress={() => setSidebarOpen(false)} accessibilityLabel="Fechar menu">
            <Text style={{ fontSize: 22 }}>×</Text>
          </Pressable>
        )}
      </HStack>
      <Text variant="caption" color="textTertiary">
        myway · universal
      </Text>

      <Box mt={2}>
        <Input placeholder="Buscar..." value={query} onChangeText={setQuery} size="sm" />
      </Box>

      <Box mt={2}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text variant="label" color="textSecondary">
            Tema escuro
          </Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleMode}
            accessibilityLabel="Alternar tema"
          />
        </HStack>
      </Box>

      <Divider />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <VStack gap={0.5}>
          {filteredSections.map(section => {
            const active = section.id === selected.id
            return (
              <Pressable
                key={section.id}
                onPress={() => {
                  setSelectedId(section.id)
                  setSidebarOpen(false)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.brandSubtle : 'transparent',
                }}
                hoveredStyle={{ backgroundColor: theme.colors.surfaceHigh }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    variant="body"
                    weight={active ? '700' : '500'}
                    color={active ? 'text' : 'textSecondary'}
                  >
                    {section.title}
                  </Text>
                  <Badge tone="neutral" size="sm">
                    {String(section.stories.length)}
                  </Badge>
                </HStack>
              </Pressable>
            )
          })}
        </VStack>
      </ScrollView>

      {onExit && (
        <Pressable
          onPress={onExit}
          style={{
            padding: 12,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
          }}
        >
          <Text variant="caption" weight="600">
            ← Sair do Storybook
          </Text>
        </Pressable>
      )}
    </VStack>
  )

  const container: ViewStyle = {
    flex: 1,
    flexDirection: isDesktop ? 'row' : 'column',
    backgroundColor: theme.colors.background,
  }

  return (
    <Box style={container}>
      {isDesktop && sidebar}

      {!isDesktop && (
        <HStack
          px={4}
          py={3}
          justifyContent="space-between"
          alignItems="center"
          borderBottomWidth={1}
          borderColor="border"
          bg="surface"
        >
          <Pressable onPress={() => setSidebarOpen(true)} accessibilityLabel="Abrir menu">
            <Text style={{ fontSize: 22 }}>☰</Text>
          </Pressable>
          <Text variant="subtitle" weight="700">
            {selected?.title}
          </Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleMode}
            accessibilityLabel="Alternar tema"
          />
        </HStack>
      )}

      {!isDesktop && sidebarOpen && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.modal,
            backgroundColor: theme.colors.background,
          }}
        >
          {sidebar}
        </Box>
      )}

      <Box flex={1}>
        {selected && <StorySectionView section={selected} />}
      </Box>
    </Box>
  )
}

function StorySectionView({ section }: { section: StorySection }) {
  const theme = useTheme()
  const { isDesktop } = useBreakpoint()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: isDesktop ? 40 : 20,
        paddingBottom: 80,
        maxWidth: 960,
        alignSelf: isDesktop ? 'center' : undefined,
        width: '100%',
      } as any}
    >
      <VStack gap={4}>
        <VStack gap={1}>
          <Text variant="overline" color="textTertiary">
            {section.category}
          </Text>
          <Text variant="h2">{section.title}</Text>
          {section.description && (
            <Text variant="body" color="textSecondary">
              {section.description}
            </Text>
          )}
        </VStack>

        <VStack gap={4}>
          {section.stories.map(story => (
            <StoryCard key={story.name} story={story} />
          ))}
        </VStack>
      </VStack>
    </ScrollView>
  )
}

function StoryCard({ story }: { story: Story }) {
  const theme = useTheme()
  return (
    <Box
      borderRadius="2xl"
      borderWidth={1}
      borderColor="border"
      bg="surface"
      style={{ overflow: 'hidden' }}
    >
      <Box px={4} py={3} borderBottomWidth={1} borderColor="border">
        <Text variant="subtitle" weight="700">
          {story.name}
        </Text>
        {story.description && (
          <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
            {story.description}
          </Text>
        )}
      </Box>
      <Box p={5} style={{ backgroundColor: theme.colors.background }}>
        {story.render() as any}
      </Box>
    </Box>
  )
}
