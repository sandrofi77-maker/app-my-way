import React, { useState } from 'react'
import { StorySection } from '../types'
import {
  Input,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Select,
  SearchBar,
  VStack,
  HStack,
  Text,
} from '../..'

function InputDemo() {
  const [v, setV] = useState('')
  return (
    <VStack gap={3}>
      <Input label="Nome" placeholder="Digite seu nome" value={v} onChangeText={setV} required />
      <Input
        label="Email"
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        helperText="Usaremos apenas para login."
      />
      <Input
        label="Senha"
        secureTextEntry
        errorText="A senha precisa ter pelo menos 8 caracteres."
      />
      <Input label="Desabilitado" editable={false} value="Não editável" />
      <Input label="Pequeno" size="sm" placeholder="Size sm" />
      <Input label="Grande" size="lg" placeholder="Size lg" />
    </VStack>
  )
}

function TextareaDemo() {
  const [v, setV] = useState('')
  return (
    <Textarea
      label="Descrição"
      placeholder="Conte mais sobre sua viagem..."
      value={v}
      onChangeText={setV}
      rows={4}
      maxLength={200}
      showCounter
    />
  )
}

function CheckboxDemo() {
  const [a, setA] = useState(false)
  const [b, setB] = useState(true)
  return (
    <VStack gap={2}>
      <Checkbox checked={a} onChange={setA} label="Receber newsletter" />
      <Checkbox checked={b} onChange={setB} label="Aceitar termos" />
      <Checkbox checked={false} onChange={() => {}} label="Desabilitado" disabled />
    </VStack>
  )
}

function RadioDemo() {
  const [v, setV] = useState<'light' | 'dark' | 'auto'>('light')
  return (
    <RadioGroup
      value={v}
      onChange={setV}
      options={[
        { value: 'light', label: 'Claro' },
        { value: 'dark', label: 'Escuro' },
        { value: 'auto', label: 'Automático' },
      ]}
    />
  )
}

function SwitchDemo() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <VStack gap={3}>
      <HStack gap={3}>
        <Switch value={a} onValueChange={setA} accessibilityLabel="Opção A" />
        <Text>Notificações ativadas</Text>
      </HStack>
      <HStack gap={3}>
        <Switch value={b} onValueChange={setB} accessibilityLabel="Opção B" />
        <Text>Modo offline</Text>
      </HStack>
    </VStack>
  )
}

function SelectDemo() {
  const [v, setV] = useState<string | null>(null)
  return (
    <Select
      label="Moeda"
      value={v}
      onChange={setV}
      placeholder="Escolha uma moeda"
      options={[
        { value: 'BRL', label: 'Real (R$)', description: 'Moeda nacional' },
        { value: 'USD', label: 'Dólar (US$)', description: 'Moeda estrangeira' },
        { value: 'EUR', label: 'Euro (€)', description: 'Zona euro' },
      ]}
    />
  )
}

function SearchDemo() {
  const [v, setV] = useState('')
  return <SearchBar value={v} onChangeText={setV} onClear={() => setV('')} placeholder="Buscar viagens…" />
}

export const formsSection: StorySection = {
  id: 'forms',
  title: 'Forms',
  category: 'Forms',
  description: 'Inputs, select, toggles.',
  stories: [
    { name: 'Input', render: () => <InputDemo /> },
    { name: 'Textarea', render: () => <TextareaDemo /> },
    { name: 'Checkbox', render: () => <CheckboxDemo /> },
    { name: 'Radio group', render: () => <RadioDemo /> },
    { name: 'Switch', render: () => <SwitchDemo /> },
    { name: 'Select', render: () => <SelectDemo /> },
    { name: 'SearchBar', render: () => <SearchDemo /> },
  ],
}
