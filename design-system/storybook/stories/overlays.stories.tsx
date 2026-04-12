import React, { useState } from 'react'
import { StorySection } from '../types'
import {
  Modal,
  BottomSheet,
  Drawer,
  Tooltip,
  Button,
  HStack,
  Text,
  VStack,
  Input,
} from '../..'

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onPress={() => setOpen(true)}>Abrir modal</Button>
      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title="Nova viagem"
        footer={
          <HStack gap={2} justifyContent="flex-end">
            <Button variant="secondary" onPress={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onPress={() => setOpen(false)}>Salvar</Button>
          </HStack>
        }
      >
        <VStack gap={3}>
          <Input label="Título" placeholder="Ex: Bariloche" />
          <Input label="Destino" placeholder="Argentina" />
        </VStack>
      </Modal>
    </>
  )
}

function BottomSheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onPress={() => setOpen(true)}>
        Abrir bottom sheet
      </Button>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Opções da viagem">
        <VStack gap={3}>
          <Text variant="body">Escolha uma ação para continuar.</Text>
          <Button fullWidth onPress={() => setOpen(false)}>
            Editar detalhes
          </Button>
          <Button fullWidth variant="secondary" onPress={() => setOpen(false)}>
            Compartilhar
          </Button>
          <Button fullWidth variant="destructive" onPress={() => setOpen(false)}>
            Excluir
          </Button>
        </VStack>
      </BottomSheet>
    </>
  )
}

function DrawerDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="tertiary" onPress={() => setOpen(true)}>
        Abrir drawer
      </Button>
      <Drawer visible={open} onClose={() => setOpen(false)} title="Filtros">
        <VStack gap={3}>
          <Text variant="body">Filtre suas viagens.</Text>
          <Input label="Destino" placeholder="Filtrar..." />
        </VStack>
      </Drawer>
    </>
  )
}

export const overlaysSection: StorySection = {
  id: 'overlays',
  title: 'Overlays',
  category: 'Overlays',
  description: 'Modal, BottomSheet, Drawer, Tooltip.',
  stories: [
    {
      name: 'Modal',
      render: () => <ModalDemo />,
    },
    {
      name: 'BottomSheet',
      description: 'Slide-up no mobile; modal no desktop.',
      render: () => <BottomSheetDemo />,
    },
    {
      name: 'Drawer',
      render: () => <DrawerDemo />,
    },
    {
      name: 'Tooltip',
      render: () => (
        <Tooltip label="Dica: passe o mouse para ver">
          <Button variant="secondary" size="sm">
            Passe o mouse
          </Button>
        </Tooltip>
      ),
    },
  ],
}
