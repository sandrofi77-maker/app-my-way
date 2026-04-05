const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

type GeoResult = {
  lat: number
  lng: number
}

/**
 * Converte um texto de localizacao em coordenadas usando Nominatim (OpenStreetMap).
 * Retorna null se nao encontrar resultados.
 */
export async function geocodeLocation(query: string): Promise<GeoResult | null> {
  if (!query || !query.trim()) return null

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

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch (err) {
    console.warn('[Geocoding] Error:', err)
    return null
  }
}
