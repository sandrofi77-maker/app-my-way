import { useEffect, useRef } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from './Icon'
import { useNetworkStore } from '../lib/network'
import { useTheme, Text, HStack } from '../design-system'

export default function SyncIndicator() {
  const { isOnline, pendingCount } = useNetworkStore()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current

  const visible = !isOnline || pendingCount > 0

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [visible])

  if (!visible) return null

  const label = !isOnline
    ? 'Você está offline'
    : `Sincronizando (${pendingCount})...`

  const iconName = !isOnline ? 'cloud-off' : 'sync'
  const bgColor = !isOnline ? theme.colors.warning : theme.colors.brand

  return (
    <Animated.View
      style={[
        styles.bar,
        { opacity, backgroundColor: bgColor, paddingTop: insets.top + 4, paddingBottom: 6 },
      ]}
      pointerEvents="none"
    >
      <HStack gap={2} justifyContent="center" alignItems="center">
        <Icon name={iconName} size={16} color="#fff" />
        <Text variant="caption" weight="600" style={{ color: '#fff' }}>{label}</Text>
      </HStack>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
})
