import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export type ToastOptions = {
  title?: string
  message: string
  tone?: ToastTone
  duration?: number
}

type ToastItem = ToastOptions & { id: number }

type ToastContextValue = {
  show: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { show: () => {} }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const show = useCallback((options: ToastOptions) => {
    const id = ++idRef.current
    const item: ToastItem = { id, duration: 3500, tone: 'info', ...options }
    setItems(prev => [...prev, item])
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
    }, item.duration)
  }, [])

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastStack items={items} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastStack({ items, dismiss }: { items: ToastItem[]; dismiss: (id: number) => void }) {
  const theme = useTheme()

  const containerStyle: ViewStyle = {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: theme.zIndex.toast,
    pointerEvents: 'box-none',
  }

  return (
    <Box style={containerStyle} pointerEvents="box-none">
      {items.map(item => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </Box>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const theme = useTheme()
  const opacity = useRef(new Animated.Value(0)).current
  const translate = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [opacity, translate])

  const toneMap: Record<ToastTone, { bg: string; fg: string; border: string }> = {
    info: { bg: theme.colors.text, fg: theme.colors.background, border: theme.colors.info },
    success: { bg: theme.colors.text, fg: theme.colors.background, border: theme.colors.success },
    warning: { bg: theme.colors.text, fg: theme.colors.background, border: theme.colors.warning },
    error: { bg: theme.colors.text, fg: theme.colors.background, border: theme.colors.error },
  }
  const c = toneMap[item.tone ?? 'info']

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: translate }],
        backgroundColor: c.bg,
        borderRadius: theme.radius.xl,
        borderLeftWidth: 3,
        borderLeftColor: c.border,
        paddingVertical: 12,
        paddingHorizontal: 16,
        maxWidth: 520,
        width: '100%',
        ...theme.shadows.lg,
      }}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Box flex={1}>
          {item.title && (
            <Text style={{ color: c.fg, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
          )}
          <Text style={{ color: c.fg, fontSize: 13 }}>{item.message}</Text>
        </Box>
        <Pressable onPress={onDismiss} accessibilityLabel="Fechar notificação">
          <Text style={{ color: c.fg, fontSize: 18, fontWeight: '700', paddingLeft: 12 }}>×</Text>
        </Pressable>
      </HStack>
    </Animated.View>
  )
}
