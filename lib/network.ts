import NetInfo from '@react-native-community/netinfo'
import { create } from 'zustand'

type SyncFailureEntry = { storeName: string; action: string }

type NetworkState = {
  isOnline: boolean
  pendingCount: number
  lastSyncFailure: SyncFailureEntry | null
  setPendingCount: (n: number) => void
  notifySyncFailure: (entry: SyncFailureEntry) => void
  clearSyncFailure: () => void
  init: () => () => void
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  pendingCount: 0,
  lastSyncFailure: null,

  setPendingCount(n: number) {
    set({ pendingCount: n })
  },

  notifySyncFailure(entry: SyncFailureEntry) {
    set({ lastSyncFailure: entry })
  },

  clearSyncFailure() {
    set({ lastSyncFailure: null })
  },

  init() {
    let prev = true
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false)
      set({ isOnline: online })

      // Reconectou: flush da fila de mutacoes (lazy import para evitar ciclo)
      if (online && !prev) {
        import('./mutationQueue').then(({ flushQueue }) => {
          flushQueue()
        })
      }
      prev = online
    })
    return unsubscribe
  },
}))
