import React from 'react'
import { Card } from '../Card'
import { Box } from '../primitives/Box'
import { Text } from '../primitives/Text'
import { HStack, VStack } from '../primitives/Stack'
import { Divider } from '../Divider'
import { useTheme } from '../../theme'

export type DayPlannerItem = {
  id: string
  time: string
  title: string
  location?: string
  category?: string
  color?: string
}

export type DayPlannerProps = {
  date: string
  dayLabel: string
  items: DayPlannerItem[]
  onItemPress?: (id: string) => void
}

export function DayPlanner({ date, dayLabel, items, onItemPress }: DayPlannerProps) {
  const theme = useTheme()

  return (
    <Card variant="outlined" p={0}>
      <Box px={4} py={3}>
        <HStack justifyContent="space-between" alignItems="baseline">
          <Text variant="label" weight="700">
            {dayLabel}
          </Text>
          <Text variant="caption" color="textTertiary">
            {date}
          </Text>
        </HStack>
      </Box>
      <Divider />
      <VStack>
        {items.length === 0 && (
          <Box p={4}>
            <Text variant="caption" color="textTertiary" align="center">
              Nenhum compromisso
            </Text>
          </Box>
        )}
        {items.map((item, i) => (
          <Box key={item.id}>
            {i > 0 && <Divider />}
            <HStack px={4} py={3} gap={3} alignItems="center">
              <Box
                style={{
                  width: 50,
                }}
              >
                <Text variant="caption" weight="700" color="textSecondary">
                  {item.time}
                </Text>
              </Box>
              <Box
                style={{
                  width: 3,
                  alignSelf: 'stretch',
                  borderRadius: 2,
                  backgroundColor: item.color ?? theme.colors.brand,
                }}
              />
              <VStack flex={1} gap={0.5}>
                <Text variant="body" weight="600">
                  {item.title}
                </Text>
                {item.location && (
                  <Text variant="caption" color="textTertiary">
                    📍 {item.location}
                  </Text>
                )}
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Card>
  )
}
