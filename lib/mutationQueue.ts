import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNetworkStore } from './network'

const QUEUE_KEY = '@myway_mutation_queue'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000 // 1s, 2s, 4s (exponential)

export type QueuedMutation = {
  id: string
  createdAt: number
  storeName: string
  action: string
  args: unknown[]
  retryCount?: number
}

type Executor = (action: string, args: unknown[]) => Promise<void>

const executors: Record<string, Executor> = {}

export function registerExecutor(storeName: string, executor: Executor) {
  executors[storeName] = executor
}

async function readQueue(): Promise<QueuedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

async function writeQueue(queue: QueuedMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    useNetworkStore.getState().setPendingCount(queue.length)
  } catch (err) {
    console.warn('[MutationQueue] write failed:', err)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Checa se ja existe mutacao identica pendente (mesmo store, action e args) */
function isDuplicate(queue: QueuedMutation[], entry: Omit<QueuedMutation, 'id' | 'createdAt'>): boolean {
  return queue.some(
    (q) =>
      q.storeName === entry.storeName &&
      q.action === entry.action &&
      JSON.stringify(q.args) === JSON.stringify(entry.args),
  )
}

export async function enqueue(
  storeName: string,
  action: string,
  args: unknown[],
): Promise<void> {
  const queue = await readQueue()

  if (isDuplicate(queue, { storeName, action, args })) {
    return // ignora mutacao duplicada
  }

  const entry: QueuedMutation = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: Date.now(),
    storeName,
    action,
    args,
    retryCount: 0,
  }
  queue.push(entry)
  await writeQueue(queue)
}

let flushing = false

export async function flushQueue(): Promise<void> {
  if (flushing) return
  flushing = true

  try {
    const queue = await readQueue()
    if (!queue.length) return

    const remaining: QueuedMutation[] = []

    for (const entry of queue) {
      const exec = executors[entry.storeName]
      if (!exec) {
        console.warn('[MutationQueue] no executor for:', entry.storeName)
        remaining.push(entry)
        continue
      }

      let succeeded = false
      const retries = entry.retryCount ?? 0

      for (let attempt = 0; attempt <= Math.min(MAX_RETRIES - 1 - retries, MAX_RETRIES - 1); attempt++) {
        // Se ficou offline durante o flush, para e preserva o restante
        if (!useNetworkStore.getState().isOnline) {
          remaining.push(entry)
          succeeded = true // nao e falha, so adiado
          break
        }

        try {
          await exec(entry.action, entry.args)
          succeeded = true
          break
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`[MutationQueue] attempt ${retries + attempt + 1}/${MAX_RETRIES} failed:`, entry.storeName, entry.action, msg)

          if (retries + attempt + 1 < MAX_RETRIES) {
            await sleep(BASE_DELAY_MS * Math.pow(2, attempt))
          }
        }
      }

      if (!succeeded) {
        const totalRetries = retries + MAX_RETRIES
        if (totalRetries < MAX_RETRIES) {
          // Ainda tem tentativas — manter na fila para proximo flush
          remaining.push({ ...entry, retryCount: totalRetries })
        } else {
          // Esgotou tentativas — descartar e notificar
          console.error('[MutationQueue] mutation dropped after max retries:', entry.storeName, entry.action)
          useNetworkStore.getState().notifySyncFailure?.(entry)
        }
      }
    }

    await writeQueue(remaining)
  } finally {
    flushing = false
  }
}

export async function getPendingCount(): Promise<number> {
  const queue = await readQueue()
  return queue.length
}

export async function clearQueue(): Promise<void> {
  await writeQueue([])
}
