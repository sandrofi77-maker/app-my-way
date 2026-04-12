import React from 'react'

export type Story = {
  name: string
  description?: string
  render: () => React.ReactNode
}

export type StorySection = {
  id: string
  title: string
  category: 'Foundations' | 'Primitives' | 'Components' | 'Forms' | 'Feedback' | 'Overlays' | 'Navigation' | 'Travel'
  description?: string
  stories: Story[]
}
