import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_PREFIX = '@myway_cache:'
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutos

type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Salva dados no cache local com TTL configuravel.
 */
export async function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs }
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch (err) {
    console.warn('[Cache] set failed:', key, err)
  }
}

/**
 * Le dados do cache. Retorna null se expirado ou inexistente.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > entry.ttl) {
      AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {})
      return null
    }
    return entry.data
  } catch (err) {
    console.warn('[Cache] get failed:', key, err)
    return null
  }
}

/**
 * Le dados do cache ignorando TTL (retorna mesmo se expirado).
 * Usado no modo offline para exibir dados "velhos" ao usuario.
 */
export async function getCacheIgnoreTTL<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    return entry.data
  } catch (err) {
    console.warn('[Cache] getCacheIgnoreTTL failed:', key, err)
    return null
  }
}

/**
 * Remove uma entrada do cache.
 */
export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key)
  } catch (err) {
    console.warn('[Cache] remove failed:', key, err)
  }
}

/**
 * Invalida todas as entradas cujo key comeca com o prefixo informado.
 * Ex: invalidateByPrefix('home') remove 'home:trips', 'home:stats', etc.
 */
export async function invalidateByPrefix(prefix: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const matching = keys.filter(k => k.startsWith(CACHE_PREFIX + prefix))
    if (matching.length) await AsyncStorage.multiRemove(matching)
  } catch (err) {
    console.warn('[Cache] invalidateByPrefix failed:', prefix, err)
  }
}

/**
 * Invalida todo o cache do app (prefixado com @myway_cache:).
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX))
    if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys)
  } catch (err) {
    console.warn('[Cache] clearAll failed:', err)
  }
}
