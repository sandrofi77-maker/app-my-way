import NetInfo from '@react-native-community/netinfo'
import { create } from 'zustand'
import { flushQueue } from './mutationQueue'

type NetworkState = {
  isOnline: boolean
  pendingCount: number
  setPendingCount: (n: number) => void
  init: () => () => void
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  pendingCount: 0,

  setPendingCount(n: number) {
    set({ pendingCount: n })
  },

  init() {
    let prev = true
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false)
      set({ isOnline: online })

      // Reconectou: flush da fila de mutacoes
      if (online && !prev) {
        flushQueue()
      }
      prev = online
    })
    return unsubscribe
  },
}))
