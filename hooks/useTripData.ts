import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { useTripStore } from '../stores/useTripStore'

/**
 * Hook que carrega todos os dados de uma viagem ao focar na tela.
 * Substitui o padrão repetitivo de useFocusEffect + múltiplos load* em cada tela.
 */
export function useTripData(tripId: string) {
  const store = useTripStore()

  useFocusEffect(
    useCallback(() => {
      if (tripId) store.loadAll(tripId)
      return () => store.reset()
    }, [tripId])
  )

  return store
}
