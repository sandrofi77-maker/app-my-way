import React from 'react'
import { HStack } from './primitives/Stack'
import { Pressable } from './primitives/Pressable'
import { Text } from './primitives/Text'
import { useTheme } from '../theme'

export type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const theme = useTheme()

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <HStack gap={1} accessibilityRole={'navigation' as any}>
      <PageButton
        label="‹"
        onPress={() => page > 1 && onPageChange(page - 1)}
        disabled={page <= 1}
      />
      {pages.map(p => (
        <PageButton
          key={p}
          label={String(p)}
          active={p === page}
          onPress={() => onPageChange(p)}
        />
      ))}
      <PageButton
        label="›"
        onPress={() => page < totalPages && onPageChange(page + 1)}
        disabled={page >= totalPages}
      />
    </HStack>
  )
}

function PageButton({
  label,
  onPress,
  active,
  disabled,
}: {
  label: string
  onPress: () => void
  active?: boolean
  disabled?: boolean
}) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Página ${label}`}
      accessibilityState={{ selected: active, disabled }}
      style={{
        minWidth: 32,
        height: 32,
        paddingHorizontal: 10,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? theme.colors.brand : 'transparent',
        borderWidth: active ? 0 : 1,
        borderColor: theme.colors.border,
        opacity: disabled ? 0.4 : 1,
      }}
      hoveredStyle={{ opacity: 0.85 }}
    >
      <Text
        variant="caption"
        style={{
          color: active ? theme.colors.textOnBrand : theme.colors.text,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}
