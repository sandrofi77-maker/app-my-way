import React, { Fragment } from 'react'
import { HStack } from './primitives/Stack'
import { Pressable } from './primitives/Pressable'
import { Text } from './primitives/Text'

export type BreadcrumbItem = {
  label: string
  onPress?: () => void
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  separator?: string
}

export function Breadcrumb({ items, separator = '/' }: BreadcrumbProps) {
  return (
    <HStack gap={1.5} accessibilityRole={'navigation' as any}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <Fragment key={i}>
            {item.onPress && !isLast ? (
              <Pressable onPress={item.onPress} accessibilityRole="link">
                <Text variant="caption" color="textSecondary" weight="600">
                  {item.label}
                </Text>
              </Pressable>
            ) : (
              <Text variant="caption" color={isLast ? 'text' : 'textTertiary'} weight={isLast ? '700' : '600'}>
                {item.label}
              </Text>
            )}
            {!isLast && (
              <Text variant="caption" color="textTertiary">
                {separator}
              </Text>
            )}
          </Fragment>
        )
      })}
    </HStack>
  )
}
