import React from 'react'
import { Modal as RNModal, ViewStyle, ScrollView, View } from 'react-native'
import { Text } from './primitives/Text'
import { HStack } from './primitives/Stack'
import { Pressable } from './primitives/Pressable'
import { Box } from './primitives/Box'
import { useTheme } from '../theme'
import { useBreakpoint } from '../hooks/useBreakpoint'

export type BottomSheetProps = {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  scrollable?: boolean
}

/**
 * BottomSheet slides up from the bottom on mobile, centers as a modal on desktop.
 * This matches the behavior of components/SheetModal.tsx already in the project.
 */
export function BottomSheet({ visible, onClose, title, children, scrollable = true }: BottomSheetProps) {
  const theme = useTheme()
  const { isDesktop } = useBreakpoint()

  const sheetStyle: ViewStyle = isDesktop
    ? {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius['3xl'],
        width: '100%',
        maxWidth: 520,
        maxHeight: '85%',
        overflow: 'hidden',
        ...theme.shadows.xl,
      }
    : {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius['3xl'],
        borderTopRightRadius: theme.radius['3xl'],
        width: '100%',
        maxHeight: '90%',
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
        onPress={onClose}
        accessibilityLabel="Fechar sheet"
        style={{
          flex: 1,
          backgroundColor: theme.colors.surfaceOverlay,
          justifyContent: isDesktop ? 'center' : 'flex-end',
          alignItems: 'center',
          padding: isDesktop ? 20 : 0,
          zIndex: theme.zIndex.modal,
        }}
      >
        <Pressable onPress={() => {}} style={sheetStyle} accessibilityRole={'dialog' as any}>
          {!isDesktop && (
            <Box
              style={{
                width: 48,
                height: 5,
                borderRadius: 3,
                backgroundColor: theme.colors.border,
                alignSelf: 'center',
                marginTop: 10,
                marginBottom: 8,
              }}
            />
          )}
          {title && (
            <HStack justifyContent="space-between" alignItems="center" px={4} py={3}>
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
          {scrollable ? (
            <ScrollView
              style={{ paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>{children}</View>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}
