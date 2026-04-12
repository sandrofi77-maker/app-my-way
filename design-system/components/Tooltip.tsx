import React, { useState } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { Box } from './primitives/Box'
import { Text } from './primitives/Text'
import { Pressable } from './primitives/Pressable'
import { useTheme } from '../theme'

export type TooltipProps = {
  label: string
  children: React.ReactElement
  side?: 'top' | 'bottom'
}

/**
 * Lightweight tooltip. On web uses hover, on mobile long-press toggles.
 * For deeper positioning needs, swap for a portal-based impl later.
 */
export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const isWeb = Platform.OS === 'web'

  const bubbleStyle: ViewStyle = {
    position: 'absolute',
    [side]: '100%',
    alignSelf: 'center',
    backgroundColor: theme.colors.text,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    marginBottom: side === 'top' ? 6 : 0,
    marginTop: side === 'bottom' ? 6 : 0,
    zIndex: theme.zIndex.tooltip,
    ...theme.shadows.md,
  }

  return (
    <Box style={{ position: 'relative' }}>
      <Pressable
        onHoverIn={isWeb ? () => setVisible(true) : undefined}
        onHoverOut={isWeb ? () => setVisible(false) : undefined}
        onLongPress={!isWeb ? () => setVisible(v => !v) : undefined}
        accessibilityLabel={label}
      >
        {children}
      </Pressable>
      {visible && (
        <Box style={bubbleStyle} pointerEvents="none">
          <Text style={{ color: theme.colors.background, fontSize: 11, fontWeight: '600' }}>
            {label}
          </Text>
        </Box>
      )}
    </Box>
  )
}
