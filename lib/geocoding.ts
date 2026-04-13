import { getCache, setCache } from './cache'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const GEO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 dias (coordenadas nao mudam)

type GeoResult = {
  lat: number
  lng: number
}

function geoCacheKey(query: string) {
  return `geo:${query.trim().toLowerCase()}`
}

/**
 * Converte um texto de localizacao em coordenadas usando Nominatim (OpenStreetMap).
 * Resultados sao cacheados localmente por 7 dias.
 * Retorna null se nao encontrar resultados.
 */
export async function geocodeLocation(query: string): Promise<GeoResult | null> {
  if (!query || !query.trim()) return null

  const key = geoCacheKey(query)
  const cached = await getCache<GeoResult>(key)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: '1',
    })

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'MyWayTravelApp/1.0',
      },
    })

    if (!response.ok) return null

    const data = await response.json()

    if (!data || data.length === 0) return null

    const result: GeoResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }

    await setCache(key, result, GEO_CACHE_TTL)
    return result
  } catch (err) {
    console.warn('[Geocoding] Error:', err)
    return null
  }
}
