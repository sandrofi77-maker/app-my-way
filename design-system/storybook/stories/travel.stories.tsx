import React, { useState } from 'react'
import { StorySection } from '../types'
import {
  FlightCard,
  AccommodationCard,
  ExpenseCard,
  TripTimeline,
  Checklist,
  DayPlanner,
  VStack,
  Text,
} from '../..'
import { ChecklistItemData } from '../../components/travel/Checklist'

function ChecklistDemo() {
  const [items, setItems] = useState<ChecklistItemData[]>([
    { id: '1', label: 'Passaporte', done: true },
    { id: '2', label: 'Reserva do hotel', done: true },
    { id: '3', label: 'Seguro viagem', done: false },
    { id: '4', label: 'Adaptador de tomada', done: false },
  ])
  return (
    <Checklist
      title="Antes da viagem"
      items={items}
      onToggle={id =>
        setItems(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)))
      }
    />
  )
}

export const travelSection: StorySection = {
  id: 'travel',
  title: 'Travel',
  category: 'Travel',
  description: 'Domain-specific components for trip planning.',
  stories: [
    {
      name: 'FlightCard',
      render: () => (
        <FlightCard
          airline="LATAM Airlines"
          flightNumber="LA8084"
          dateLabel="15 MAR 2026"
          departureTime="10:30"
          departureAirport="GRU"
          arrivalTime="22:15"
          arrivalAirport="CDG"
          notes="Escala em Madrid • 11h45 de voo"
        />
      ),
    },
    {
      name: 'AccommodationCard',
      render: () => (
        <AccommodationCard
          name="Hotel de Charme Montmartre"
          location="Paris, França"
          dateBadge="5 noites"
          description="Hotel boutique próximo à Sacré-Cœur, café da manhã incluído"
          checkIn={{ weekday: 'seg', day: '15', time: '15:00' }}
          checkOut={{ weekday: 'sex', day: '19', time: '11:00' }}
        />
      ),
    },
    {
      name: 'ExpenseCard',
      render: () => (
        <VStack gap={2}>
          <ExpenseCard
            category="Alimentação"
            description="Jantar no Le Petit Bistrot"
            amount="R$ 240,00"
            date="18 Mar"
            categoryColor="#FF9500"
          />
          <ExpenseCard
            category="Transporte"
            description="Taxi do aeroporto"
            amount="R$ 85,50"
            date="15 Mar"
            categoryColor="#32ADE6"
          />
          <ExpenseCard
            category="Passeios"
            description="Ingresso Museu do Louvre"
            amount="R$ 120,00"
            date="16 Mar"
            categoryColor="#34C759"
          />
        </VStack>
      ),
    },
    {
      name: 'TripTimeline',
      render: () => (
        <TripTimeline
          items={[
            { id: '1', time: '10:30', title: 'Voo GRU → CDG', subtitle: 'LATAM LA8084', color: '#000000' },
            { id: '2', time: '22:00', title: 'Check-in no hotel', subtitle: 'Hotel Montmartre', color: '#5856D6' },
            { id: '3', time: '08:00', title: 'Tour pela Torre Eiffel', color: '#34C759' },
            { id: '4', time: '12:30', title: 'Almoço no Le Bistrot', color: '#FF9500' },
            { id: '5', time: '15:00', title: 'Museu do Louvre', color: '#AF52DE' },
          ]}
        />
      ),
    },
    {
      name: 'Checklist',
      render: () => <ChecklistDemo />,
    },
    {
      name: 'DayPlanner',
      render: () => (
        <DayPlanner
          dayLabel="Dia 1 — Chegada"
          date="15 Mar 2026"
          items={[
            { id: '1', time: '10:30', title: 'Voo GRU → CDG', color: '#000000' },
            { id: '2', time: '22:00', title: 'Check-in Hotel Montmartre', location: 'Paris', color: '#5856D6' },
            { id: '3', time: '23:30', title: 'Jantar no Le Relais', location: 'Paris', color: '#FF9500' },
          ]}
        />
      ),
    },
  ],
}
