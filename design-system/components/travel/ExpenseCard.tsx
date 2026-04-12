import React from 'react'
import { Card } from '../Card'
import { Text } from '../primitives/Text'
import { HStack, VStack } from '../primitives/Stack'
import { Box } from '../primitives/Box'
import { Badge } from '../Badge'
import { useTheme } from '../../theme'

export type ExpenseCardProps = {
  category: string
  description: string
  amount: string
  date: string
  categoryColor?: string
  icon?: React.ReactNode
  onPress?: () => void
}

export function ExpenseCard({
  category,
  description,
  amount,
  date,
  categoryColor,
  icon,
  onPress,
}: ExpenseCardProps) {
  const theme = useTheme()

  return (
    <Card variant="outlined" onPress={onPress} p={3} accessibilityLabel={`Despesa: ${description}`}>
      <HStack gap={3} alignItems="center">
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: categoryColor ? categoryColor + '22' : theme.colors.brandSubtle,
          }}
        >
          {icon ?? (
            <Text style={{ fontSize: 18 }}>
              💳
            </Text>
          )}
        </Box>
        <VStack flex={1} gap={0.5}>
          <Text variant="body" weight="600" numberOfLines={1}>
            {description}
          </Text>
          <HStack gap={1.5}>
            <Badge tone="neutral" size="sm">
              {category}
            </Badge>
            <Text variant="caption" color="textTertiary">
              {date}
            </Text>
          </HStack>
        </VStack>
        <Text variant="subtitle" weight="700">
          {amount}
        </Text>
      </HStack>
    </Card>
  )
}
