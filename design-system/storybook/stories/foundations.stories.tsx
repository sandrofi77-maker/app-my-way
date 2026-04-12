import React from 'react'
import { StorySection } from '../types'
import { Box, HStack, VStack, Text, useTheme } from '../..'
import { palette } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { radius } from '../../tokens/radius'

function Swatch({ name, color }: { name: string; color: string }) {
  const theme = useTheme()
  return (
    <VStack gap={1} style={{ width: 88 }}>
      <Box
        style={{
          height: 56,
          borderRadius: theme.radius.md,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      />
      <Text variant="caption" weight="600" numberOfLines={1}>
        {name}
      </Text>
      <Text variant="overline" color="textTertiary">
        {color}
      </Text>
    </VStack>
  )
}

export const foundationsSection: StorySection = {
  id: 'foundations',
  title: 'Foundations',
  category: 'Foundations',
  description: 'Design tokens — the building blocks of the system.',
  stories: [
    {
      name: 'Semantic Colors',
      description: 'Theme-aware color aliases used by components.',
      render: () => {
        const theme = useTheme()
        const entries = Object.entries(theme.colors).filter(([, v]) => typeof v === 'string')
        return (
          <HStack gap={3} style={{ flexWrap: 'wrap' }}>
            {entries.map(([name, color]) => (
              <Swatch key={name} name={name} color={color as string} />
            ))}
          </HStack>
        )
      },
    },
    {
      name: 'Palette',
      description: 'Raw palette scale — brand, neutral, success, error, warning, info.',
      render: () => (
        <VStack gap={4}>
          {Object.entries(palette).map(([scale, shades]) => {
            if (typeof shades !== 'object') return null
            return (
              <VStack key={scale} gap={1}>
                <Text variant="label" weight="700">
                  {scale}
                </Text>
                <HStack gap={2} style={{ flexWrap: 'wrap' }}>
                  {Object.entries(shades as Record<string, string>).map(([shade, color]) => (
                    <Swatch key={shade} name={shade} color={color} />
                  ))}
                </HStack>
              </VStack>
            )
          })}
        </VStack>
      ),
    },
    {
      name: 'Typography',
      render: () => (
        <VStack gap={2}>
          <Text variant="display">Display</Text>
          <Text variant="h1">Heading 1</Text>
          <Text variant="h2">Heading 2</Text>
          <Text variant="h3">Heading 3</Text>
          <Text variant="h4">Heading 4</Text>
          <Text variant="title">Title</Text>
          <Text variant="subtitle">Subtitle</Text>
          <Text variant="body">Body — this is regular paragraph text used across the app.</Text>
          <Text variant="bodySmall">Body small — used for denser layouts.</Text>
          <Text variant="caption">Caption — supporting metadata.</Text>
          <Text variant="overline">Overline label</Text>
          <Text variant="label">Label text</Text>
        </VStack>
      ),
    },
    {
      name: 'Spacing',
      description: '4px grid.',
      render: () => {
        const theme = useTheme()
        return (
          <VStack gap={2}>
            {Object.entries(spacing).map(([key, value]) => (
              <HStack key={key} gap={3} alignItems="center">
                <Text variant="caption" weight="600" style={{ width: 40 }}>
                  {key}
                </Text>
                <Box
                  style={{
                    height: 12,
                    width: value,
                    backgroundColor: theme.colors.brand,
                    borderRadius: 2,
                  }}
                />
                <Text variant="caption" color="textTertiary">
                  {value}px
                </Text>
              </HStack>
            ))}
          </VStack>
        )
      },
    },
    {
      name: 'Radius',
      render: () => {
        const theme = useTheme()
        return (
          <HStack gap={3} style={{ flexWrap: 'wrap' }}>
            {Object.entries(radius).map(([key, value]) => (
              <VStack key={key} gap={1} alignItems="center">
                <Box
                  style={{
                    width: 72,
                    height: 72,
                    backgroundColor: theme.colors.brand,
                    borderRadius: Math.min(value, 36),
                  }}
                />
                <Text variant="caption" weight="600">
                  {key}
                </Text>
                <Text variant="overline" color="textTertiary">
                  {value}
                </Text>
              </VStack>
            ))}
          </HStack>
        )
      },
    },
    {
      name: 'Shadows',
      render: () => {
        const theme = useTheme()
        return (
          <HStack gap={4} style={{ flexWrap: 'wrap' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(level => (
              <VStack key={level} gap={1} alignItems="center">
                <Box
                  style={{
                    width: 96,
                    height: 72,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.lg,
                    ...theme.shadows[level],
                  }}
                />
                <Text variant="caption" weight="600">
                  shadow.{level}
                </Text>
              </VStack>
            ))}
          </HStack>
        )
      },
    },
  ],
}
