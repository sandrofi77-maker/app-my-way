import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNetworkStore } from './network'

const QUEUE_KEY = '@myway_mutation_queue'

export type QueuedMutation = {
  id: string
  createdAt: number
  storeName: string
  action: string
  args: unknown[]
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

export async function enqueue(
  storeName: string,
  action: string,
  args: unknown[],
): Promise<void> {
  const entry: QueuedMutation = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: Date.now(),
    storeName,
    action,
    args,
  }
  const queue = await readQueue()
  queue.push(entry)
  await writeQueue(queue)
}

let flushing = false

export async function flushQueue(): Promise<void> {
  if (flushing) return
  flushing = true

  try {
    let queue = await readQueue()
    if (!queue.length) return

    const failed: QueuedMutation[] = []

    for (const entry of queue) {
      const exec = executors[entry.storeName]
      if (!exec) {
        console.warn('[MutationQueue] no executor for:', entry.storeName)
        continue
      }

      try {
        await exec(entry.action, entry.args)
      } catch (err: any) {
        console.warn('[MutationQueue] sync failed, discarding:', entry.storeName, entry.action, err?.message)
        // Last-write-wins: descartamos mutacoes que falharam
      }
    }

    // Limpar fila apos processar (falhas sao descartadas)
    await writeQueue(failed)
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
