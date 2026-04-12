import React from 'react'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack, VStack } from './primitives/Stack'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type AlertTone = 'info' | 'success' | 'warning' | 'error' | 'neutral'

export type AlertProps = {
  tone?: AlertTone
  title?: string
  children?: React.ReactNode
  icon?: React.ReactNode
  onClose?: () => void
  action?: React.ReactNode
}

export function Alert({ tone = 'info', title, children, icon, onClose, action }: AlertProps) {
  const theme = useTheme()

  const toneMap: Record<AlertTone, { bg: string; fg: string; border: string }> = {
    info: { bg: theme.colors.infoSubtle, fg: theme.colors.info, border: theme.colors.info },
    success: { bg: theme.colors.successSubtle, fg: theme.colors.success, border: theme.colors.success },
    warning: { bg: theme.colors.warningSubtle, fg: theme.colors.warning, border: theme.colors.warning },
    error: { bg: theme.colors.errorSubtle, fg: theme.colors.error, border: theme.colors.error },
    neutral: { bg: theme.colors.surfaceHigh, fg: theme.colors.text, border: theme.colors.border },
  }
  const c = toneMap[tone]

  return (
    <Box
      bg={c.bg}
      borderRadius="lg"
      p={3.5}
      style={{ borderLeftWidth: 3, borderLeftColor: c.border }}
      accessibilityRole={'alert' as any}
    >
      <HStack gap={3} alignItems="flex-start">
        {icon}
        <VStack gap={1} flex={1}>
          {title && (
            <Text variant="label" style={{ color: c.fg, fontWeight: '700' }}>
              {title}
            </Text>
          )}
          {typeof children === 'string' ? (
            <Text variant="caption" color="textSecondary">
              {children}
            </Text>
          ) : (
            children
          )}
          {action && <Box mt={2}>{action}</Box>}
        </VStack>
        {onClose && (
          <Pressable onPress={onClose} accessibilityLabel="Fechar alerta">
            <Text style={{ color: c.fg, fontSize: 16, fontWeight: '700' }}>×</Text>
          </Pressable>
        )}
      </HStack>
    </Box>
  )
}
