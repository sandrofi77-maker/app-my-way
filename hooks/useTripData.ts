import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { useTripStore } from '../stores/useTripStore'
import { useShallow } from 'zustand/react/shallow'

/**
 * Hook que carrega todos os dados de uma viagem ao focar na tela.
 * Substitui o padrão repetitivo de useFocusEffect + múltiplos load* em cada tela.
 */
export function useTripData(tripId: string) {
  const store = useTripStore(
    useShallow((s) => ({
      trip: s.trip, flights: s.flights, accommodations: s.accommodations,
      expenses: s.expenses, itineraryItems: s.itineraryItems,
      error: s.error, loadAll: s.loadAll, reset: s.reset,
      loadFlights: s.loadFlights, loadAccommodations: s.loadAccommodations,
    }))
  )

  useFocusEffect(
    useCallback(() => {
      if (tripId) store.loadAll(tripId)
      return () => store.reset()
    }, [tripId])
  )

  return store
}
