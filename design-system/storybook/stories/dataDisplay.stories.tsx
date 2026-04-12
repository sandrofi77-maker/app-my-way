import React from 'react'
import { StorySection } from '../types'
import {
  Card,
  Badge,
  Tag,
  Avatar,
  Divider,
  HStack,
  VStack,
  Text,
} from '../..'

export const dataDisplaySection: StorySection = {
  id: 'data-display',
  title: 'Data Display',
  category: 'Components',
  description: 'Cards, badges, tags, avatars.',
  stories: [
    {
      name: 'Card — variants',
      render: () => (
        <VStack gap={3}>
          <Card>
            <Text variant="subtitle" weight="700">
              Elevated card
            </Text>
            <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
              Subtle shadow, no border. Use for the main content surfaces.
            </Text>
          </Card>
          <Card variant="outlined">
            <Text variant="subtitle" weight="700">
              Outlined card
            </Text>
            <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
              1px border, no shadow. Lower visual weight.
            </Text>
          </Card>
          <Card variant="filled">
            <Text variant="subtitle" weight="700">
              Filled card
            </Text>
            <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
              Tonal background. Use inside other cards.
            </Text>
          </Card>
        </VStack>
      ),
    },
    {
      name: 'Badge',
      render: () => (
        <VStack gap={3}>
          <HStack gap={2} style={{ flexWrap: 'wrap' }}>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="error">Error</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="info">Info</Badge>
          </HStack>
          <HStack gap={2} style={{ flexWrap: 'wrap' }}>
            <Badge tone="success" variant="solid">
              Solid
            </Badge>
            <Badge tone="success" variant="soft">
              Soft
            </Badge>
            <Badge tone="success" variant="outline">
              Outline
            </Badge>
          </HStack>
        </VStack>
      ),
    },
    {
      name: 'Tag',
      render: () => (
        <HStack gap={2} style={{ flexWrap: 'wrap' }}>
          <Tag label="Praia" />
          <Tag label="Montanha" selected />
          <Tag label="Gastronomia" onRemove={() => {}} />
        </HStack>
      ),
    },
    {
      name: 'Avatar',
      render: () => (
        <HStack gap={3} alignItems="center">
          <Avatar name="Ana Silva" size="xs" />
          <Avatar name="Bruno Costa" size="sm" />
          <Avatar name="Clara Dias" size="md" />
          <Avatar name="Diego" size="lg" />
          <Avatar name="Eva Lima" size="xl" />
        </HStack>
      ),
    },
    {
      name: 'Divider',
      render: () => (
        <VStack gap={2}>
          <Text>Above divider</Text>
          <Divider />
          <Text>Below divider</Text>
        </VStack>
      ),
    },
  ],
}
