import React from 'react'
import { Modal as RNModal, ViewStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'
import { useBreakpoint } from '../hooks/useBreakpoint'

export type ModalProps = {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  dismissOnBackdrop?: boolean
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissOnBackdrop = true,
}: ModalProps) {
  const theme = useTheme()
  const { isDesktop } = useBreakpoint()

  const maxWidthMap = { sm: 380, md: 520, lg: 720 }

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['2xl'],
    width: '100%',
    maxWidth: maxWidthMap[size],
    maxHeight: '85%',
    overflow: 'hidden',
    ...theme.shadows.xl,
  }

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={isDesktop ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <Pressable
        onPress={dismissOnBackdrop ? onClose : undefined}
        accessibilityLabel="Fechar modal"
        style={{
          flex: 1,
          backgroundColor: theme.colors.surfaceOverlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: theme.zIndex.modal,
        }}
      >
        <Pressable onPress={() => {}} style={containerStyle} accessibilityRole={'dialog' as any}>
          {title && (
            <HStack
              justifyContent="space-between"
              alignItems="center"
              px={4}
              py={3}
              borderBottomWidth={1}
              borderColor="border"
            >
              <Text variant="subtitle" weight="700">
                {title}
              </Text>
              <Pressable onPress={onClose} accessibilityLabel="Fechar">
                <Text color="textTertiary" style={{ fontSize: 22, lineHeight: 22 }}>
                  ×
                </Text>
              </Pressable>
            </HStack>
          )}
          <Box p={4}>{children}</Box>
          {footer && (
            <Box px={4} py={3} borderTopWidth={1} borderColor="border">
              {footer}
            </Box>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}
