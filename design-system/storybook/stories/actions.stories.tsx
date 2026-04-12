import React, { useState } from 'react'
import { StorySection } from '../types'
import {
  Button,
  IconButton,
  FAB,
  HStack,
  VStack,
  Box,
  Text,
} from '../..'

export const actionsSection: StorySection = {
  id: 'actions',
  title: 'Actions',
  category: 'Components',
  description: 'Buttons, icon buttons and FAB.',
  stories: [
    {
      name: 'Button — Variants',
      render: () => (
        <HStack gap={2} style={{ flexWrap: 'wrap' }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </HStack>
      ),
    },
    {
      name: 'Button — Sizes',
      render: () => (
        <HStack gap={2} alignItems="center" style={{ flexWrap: 'wrap' }}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </HStack>
      ),
    },
    {
      name: 'Button — States',
      render: () => (
        <HStack gap={2} style={{ flexWrap: 'wrap' }}>
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button
            leftIcon={
              <Text style={{ color: '#fff', fontSize: 14, marginRight: 6 }}>★</Text>
            }
          >
            With icon
          </Button>
        </HStack>
      ),
    },
    {
      name: 'Button — Full width',
      render: () => (
        <VStack gap={2}>
          <Button fullWidth>Book this trip</Button>
          <Button fullWidth variant="secondary">
            Cancel
          </Button>
        </VStack>
      ),
    },
    {
      name: 'IconButton',
      render: () => (
        <HStack gap={2} alignItems="center">
          <IconButton accessibilityLabel="Solid">
            <Text style={{ color: '#000', fontSize: 16 }}>★</Text>
          </IconButton>
          <IconButton variant="soft" accessibilityLabel="Soft">
            <Text style={{ color: '#000', fontSize: 16 }}>★</Text>
          </IconButton>
          <IconButton variant="outline" accessibilityLabel="Outline">
            <Text style={{ color: '#000', fontSize: 16 }}>★</Text>
          </IconButton>
          <IconButton variant="solid" accessibilityLabel="Solid">
            <Text style={{ color: '#fff', fontSize: 16 }}>★</Text>
          </IconButton>
        </HStack>
      ),
    },
    {
      name: 'FAB (demo — positioned relative)',
      render: () => (
        <Box style={{ height: 140, position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
          <Box
            style={{
              position: 'absolute',
              inset: 0 as any,
              backgroundColor: '#EEE',
            }}
          />
          <FAB accessibilityLabel="Nova viagem">
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 26 }}>+</Text>
          </FAB>
        </Box>
      ),
    },
  ],
}
