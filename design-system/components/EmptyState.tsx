import React from 'react'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { VStack } from './primitives/Stack'

export type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box py={8} px={4} alignItems="center">
      <VStack gap={3} alignItems="center" style={{ maxWidth: 360 }}>
        {icon}
        <Text variant="subtitle" weight="700" align="center">
          {title}
        </Text>
        {description && (
          <Text variant="caption" color="textTertiary" align="center">
            {description}
          </Text>
        )}
        {action && <Box mt={2}>{action}</Box>}
      </VStack>
    </Box>
  )
}
