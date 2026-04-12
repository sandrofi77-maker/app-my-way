import React from 'react'
import { Image, ViewStyle } from 'react-native'
import { Box } from '../primitives/Box'
import { Text } from '../primitives/Text'
import { VStack } from '../primitives/Stack'
import { Pressable } from '../primitives/Pressable'
import { useTheme } from '../../theme'

export type AccommodationCardProps = {
  name: string
  location: string
  imageUri?: string | null
  dateBadge?: string
  description?: string
  checkIn?: { weekday: string; day: string; time?: string }
  checkOut?: { weekday: string; day: string; time?: string }
  onPress?: () => void
}

export function AccommodationCard({
  name,
  location,
  imageUri,
  dateBadge,
  description,
  checkIn,
  checkOut,
  onPress,
}: AccommodationCardProps) {
  const theme = useTheme()

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Hospedagem ${name}`}
      style={cardStyle}
      pressedStyle={{ opacity: 0.95 }}
    >
      <Box style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: theme.colors.surfaceHigh }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Text color="textTertiary" style={{ fontSize: 24 }}>
              🏨
            </Text>
          </Box>
        )}
        {dateBadge && (
          <Box
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text weight="700" style={{ fontSize: 13, color: theme.colors.text }}>
              {dateBadge}
            </Text>
          </Box>
        )}
      </Box>

      <Box px={4} pt={3.5} pb={2.5}>
        <Text variant="h4" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          {location}
        </Text>
        {description && (
          <Text variant="caption" color="textTertiary" style={{ marginTop: 6 }} numberOfLines={2}>
            {description}
          </Text>
        )}
      </Box>

      {(checkIn || checkOut) && (
        <VStack
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          {checkIn && <CheckRow icon="→" label="Check-in" info={checkIn} theme={theme} />}
          {checkOut && <CheckRow icon="←" label="Check-out" info={checkOut} theme={theme} border />}
        </VStack>
      )}
    </Pressable>
  )
}

function CheckRow({
  icon,
  label,
  info,
  theme,
  border,
}: {
  icon: string
  label: string
  info: { weekday: string; day: string; time?: string }
  theme: ReturnType<typeof useTheme>
  border?: boolean
}) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      px={4}
      py={3.5}
      style={border ? { borderTopWidth: 1, borderTopColor: theme.colors.border } : undefined}
    >
      <Box style={{ width: 40, alignItems: 'center', marginRight: 12 }}>
        <Text variant="overline" color="textTertiary" weight="600">
          {info.weekday}
        </Text>
        <Text variant="h4">{info.day}</Text>
      </Box>
      <Box
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: theme.colors.surfaceHigh,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700' }}>{icon}</Text>
      </Box>
      <Box flex={1}>
        <Text variant="body" weight="500">
          {label}
        </Text>
        {info.time && (
          <Text variant="caption" color="textTertiary">
            {info.time}
          </Text>
        )}
      </Box>
    </Box>
  )
}
