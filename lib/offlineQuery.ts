import { getCache, getCacheIgnoreTTL, setCache } from './cache'
import { useNetworkStore } from './network'

/**
 * Wrapper para queries que funciona offline:
 * - Online: executa fetchFn, grava no cache, retorna dados frescos.
 * - Offline: retorna dados do cache (ignora TTL).
 * - Online mas fetch falhou: tenta cache como fallback.
 */
export async function offlineQuery<T>(
  cacheKey: string,
  fetchFn: () => Promise<T | null>,
  ttlMs?: number,
): Promise<{ data: T | null; fromCache: boolean }> {
  const { isOnline } = useNetworkStore.getState()

  if (!isOnline) {
    const cached = await getCacheIgnoreTTL<T>(cacheKey)
    return { data: cached, fromCache: true }
  }

  try {
    const data = await fetchFn()
    if (data !== null && data !== undefined) {
      await setCache(cacheKey, data, ttlMs)
    }
    return { data, fromCache: false }
  } catch {
    // Fetch falhou mesmo online — fallback para cache
    const cached = await getCache<T>(cacheKey)
    return { data: cached, fromCache: true }
  }
}
