import React from 'react'
import { Modal as RNModal, ViewStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Pressable } from './primitives/Pressable'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { useTheme } from '../theme'

export type DrawerProps = {
  visible: boolean
  onClose: () => void
  side?: 'left' | 'right'
  width?: number
  title?: string
  children: React.ReactNode
}

export function Drawer({ visible, onClose, side = 'right', width = 320, title, children }: DrawerProps) {
  const theme = useTheme()

  const panelStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    [side]: 0,
    width,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.xl,
  }

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Fechar drawer"
        style={{
          flex: 1,
          backgroundColor: theme.colors.surfaceOverlay,
        }}
      >
        <Pressable onPress={() => {}} style={panelStyle} accessibilityRole={'dialog' as any}>
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
                <Text color="textTertiary" style={{ fontSize: 22 }}>
                  ×
                </Text>
              </Pressable>
            </HStack>
          )}
          <Box p={4} flex={1}>
            {children}
          </Box>
        </Pressable>
      </Pressable>
    </RNModal>
  )
}
