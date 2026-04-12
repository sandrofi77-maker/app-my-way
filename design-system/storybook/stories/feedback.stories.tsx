import React from 'react'
import { StorySection } from '../types'
import {
  Alert,
  Skeleton,
  Progress,
  EmptyState,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
} from '../..'

function ToastDemo() {
  const toast = useToast()
  return (
    <HStack gap={2} style={{ flexWrap: 'wrap' }}>
      <Button size="sm" variant="secondary" onPress={() => toast.show({ message: 'Info toast', tone: 'info' })}>
        Info
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => toast.show({ title: 'Sucesso!', message: 'Viagem criada', tone: 'success' })}
      >
        Success
      </Button>
      <Button size="sm" variant="secondary" onPress={() => toast.show({ message: 'Atenção!', tone: 'warning' })}>
        Warning
      </Button>
      <Button size="sm" variant="destructive" onPress={() => toast.show({ message: 'Falha na operação', tone: 'error' })}>
        Error
      </Button>
    </HStack>
  )
}

export const feedbackSection: StorySection = {
  id: 'feedback',
  title: 'Feedback',
  category: 'Feedback',
  description: 'Alerts, skeletons, progress, empty states, toast.',
  stories: [
    {
      name: 'Alert',
      render: () => (
        <VStack gap={3}>
          <Alert tone="info" title="Dica">
            Você pode adicionar múltiplas viagens e organizá-las por status.
          </Alert>
          <Alert tone="success" title="Tudo certo">
            Reserva confirmada com sucesso.
          </Alert>
          <Alert tone="warning" title="Atenção">
            Sua viagem começa em 3 dias — confira os detalhes.
          </Alert>
          <Alert tone="error" title="Erro" onClose={() => {}}>
            Não foi possível carregar a lista.
          </Alert>
        </VStack>
      ),
    },
    {
      name: 'Skeleton',
      render: () => (
        <VStack gap={2}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="90%" height={16} />
          <Skeleton width="80%" height={16} />
          <Skeleton height={120} borderRadius="xl" />
        </VStack>
      ),
    },
    {
      name: 'Progress',
      render: () => (
        <VStack gap={4}>
          <Progress value={25} showLabel />
          <Progress value={60} tone="success" />
          <Progress value={80} tone="warning" />
          <Progress value={40} tone="error" size="sm" />
        </VStack>
      ),
    },
    {
      name: 'EmptyState',
      render: () => (
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>✈️</Text>}
          title="Nenhuma viagem ainda"
          description="Quando você criar sua primeira viagem ela aparecerá aqui."
          action={<Button>Criar viagem</Button>}
        />
      ),
    },
    {
      name: 'Toast',
      render: () => <ToastDemo />,
    },
  ],
}
