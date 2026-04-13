import React from 'react'
import { ScrollView, ViewStyle } from 'react-native'
import { Pressable } from './primitives/Pressable'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type TabItem<T extends string> = {
  value: T
  label: string
  icon?: React.ReactNode
  badge?: number
}

export type TabsProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  items: TabItem<T>[]
  variant?: 'underline' | 'pill' | 'segmented'
  scrollable?: boolean
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  variant = 'underline',
  scrollable,
}: TabsProps<T>) {
  const theme = useTheme()

  const content = (
    <HStack
      gap={variant === 'segmented' ? 0 : 1}
      style={
        variant === 'segmented'
          ? {
              backgroundColor: theme.colors.surfaceHigh,
              borderRadius: theme.radius.lg,
              padding: 3,
            }
          : undefined
      }
    >
      {items.map(item => {
        const active = item.value === value
        const base: ViewStyle =
          variant === 'underline'
            ? {
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderBottomWidth: 2,
                borderBottomColor: active ? theme.colors.brand : 'transparent',
              }
            : variant === 'pill'
            ? {
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: theme.radius.full,
                backgroundColor: active ? theme.colors.brand : theme.colors.surfaceHigh,
              }
            : {
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: theme.radius.md,
                backgroundColor: active ? theme.colors.surface : 'transparent',
                ...(active && theme.shadows.xs),
              }

        const color =
          variant === 'pill' && active
            ? theme.colors.textOnBrand
            : active
            ? theme.colors.text
            : theme.colors.textTertiary

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={base}
            hoveredStyle={{ opacity: 0.85 }}
          >
            <HStack gap={1.5} alignItems="center" justifyContent="center">
              {item.icon}
              <Text style={{ color, fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
              {item.badge != null && (
                <Box
                  style={{
                    backgroundColor: theme.colors.error,
                    borderRadius: 999,
                    paddingHorizontal: 6,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                    {item.badge}
                  </Text>
                </Box>
              )}
            </HStack>
          </Pressable>
        )
      })}
    </HStack>
  )

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {content}
      </ScrollView>
    )
  }
  return content
}
