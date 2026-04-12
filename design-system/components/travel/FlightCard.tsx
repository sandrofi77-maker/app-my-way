import React from 'react'
import { Card } from '../Card'
import { Text } from '../primitives/Text'
import { Box } from '../primitives/Box'
import { HStack, VStack } from '../primitives/Stack'
import { Badge } from '../Badge'
import { useTheme } from '../../theme'

export type FlightCardProps = {
  airline: string
  flightNumber: string
  dateLabel: string
  departureTime: string
  departureAirport: string
  arrivalTime: string
  arrivalAirport: string
  notes?: string
  onPress?: () => void
}

export function FlightCard({
  airline,
  flightNumber,
  dateLabel,
  departureTime,
  departureAirport,
  arrivalTime,
  arrivalAirport,
  notes,
  onPress,
}: FlightCardProps) {
  const theme = useTheme()

  return (
    <Card variant="elevated" onPress={onPress} accessibilityLabel={`Voo ${airline} ${flightNumber}`}>
      <VStack gap={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text variant="caption" color="textTertiary" weight="500">
            {dateLabel}
          </Text>
          <Badge tone="brand" variant="solid" size="sm">
            {flightNumber}
          </Badge>
        </HStack>

        <Text variant="label" weight="700">
          {airline}
        </Text>

        <HStack alignItems="center" justifyContent="space-between">
          <VStack>
            <Text variant="h3" weight="800">
              {departureTime}
            </Text>
            <Text variant="caption" weight="600" color="textSecondary">
              {departureAirport}
            </Text>
          </VStack>
          <Box flex={1} px={3}>
            <Box style={{ height: 1.5, backgroundColor: theme.colors.border }} />
          </Box>
          <VStack alignItems="flex-end">
            <Text variant="h3" weight="800">
              {arrivalTime}
            </Text>
            <Text variant="caption" weight="600" color="textSecondary">
              {arrivalAirport}
            </Text>
          </VStack>
        </HStack>

        {notes && (
          <Text variant="caption" color="textSecondary">
            {notes}
          </Text>
        )}
      </VStack>
    </Card>
  )
}
