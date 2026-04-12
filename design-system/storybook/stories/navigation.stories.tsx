import React, { useState } from 'react'
import { StorySection } from '../types'
import {
  Tabs,
  Breadcrumb,
  Pagination,
  VStack,
} from '../..'

function TabsDemo() {
  const [v, setV] = useState<'overview' | 'flights' | 'hotels' | 'expenses'>('overview')
  return (
    <VStack gap={4}>
      <Tabs
        value={v}
        onChange={setV}
        items={[
          { value: 'overview', label: 'Visão geral' },
          { value: 'flights', label: 'Voos', badge: 2 },
          { value: 'hotels', label: 'Hospedagens' },
          { value: 'expenses', label: 'Despesas' },
        ]}
      />
      <Tabs
        variant="pill"
        value={v}
        onChange={setV}
        items={[
          { value: 'overview', label: 'Geral' },
          { value: 'flights', label: 'Voos' },
          { value: 'hotels', label: 'Hotéis' },
          { value: 'expenses', label: 'Gastos' },
        ]}
      />
      <Tabs
        variant="segmented"
        value={v}
        onChange={setV}
        items={[
          { value: 'overview', label: 'Geral' },
          { value: 'flights', label: 'Voos' },
          { value: 'hotels', label: 'Hotéis' },
          { value: 'expenses', label: 'Gastos' },
        ]}
      />
    </VStack>
  )
}

function PaginationDemo() {
  const [page, setPage] = useState(3)
  return <Pagination page={page} totalPages={8} onPageChange={setPage} />
}

export const navigationSection: StorySection = {
  id: 'navigation',
  title: 'Navigation',
  category: 'Navigation',
  description: 'Tabs, Breadcrumb, Pagination.',
  stories: [
    { name: 'Tabs', render: () => <TabsDemo /> },
    {
      name: 'Breadcrumb',
      render: () => (
        <Breadcrumb
          items={[
            { label: 'Viagens', onPress: () => {} },
            { label: 'Europa 2026', onPress: () => {} },
            { label: 'Detalhes' },
          ]}
        />
      ),
    },
    { name: 'Pagination', render: () => <PaginationDemo /> },
  ],
}
