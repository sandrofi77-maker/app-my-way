import React from 'react'
import { Box } from '../primitives/Box'
import { Text } from '../primitives/Text'
import { HStack, VStack } from '../primitives/Stack'
import { useTheme } from '../../theme'

export type TimelineItem = {
  id: string
  time?: string
  title: string
  subtitle?: string
  color?: string
  icon?: React.ReactNode
}

export type TripTimelineProps = {
  items: TimelineItem[]
}

export function TripTimeline({ items }: TripTimelineProps) {
  const theme = useTheme()

  return (
    <VStack>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const dotColor = item.color ?? theme.colors.brand
        return (
          <HStack key={item.id} gap={3} alignItems="flex-start">
            <VStack alignItems="center" style={{ width: 24 }}>
              <Box
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: dotColor,
                  marginTop: 6,
                }}
              />
              {!isLast && (
                <Box
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: theme.colors.border,
                    marginTop: 4,
                    minHeight: 28,
                  }}
                />
              )}
            </VStack>
            <VStack flex={1} pb={isLast ? 0 : 4} gap={0.5}>
              {item.time && (
                <Text variant="overline" color="textTertiary">
                  {item.time}
                </Text>
              )}
              <HStack gap={1.5} alignItems="center">
                {item.icon}
                <Text variant="body" weight="600">
                  {item.title}
                </Text>
              </HStack>
              {item.subtitle && (
                <Text variant="caption" color="textTertiary">
                  {item.subtitle}
                </Text>
              )}
            </VStack>
          </HStack>
        )
      })}
    </VStack>
  )
}
