import { Platform, Alert, ActionSheetIOS, Linking } from 'react-native'

/**
 * Extrai coordenadas de uma URL do Google Maps
 * Suporta formatos: 
 * - https://maps.google.com/maps/place/...
 * - https://g.page/...
 * - https://www.google.com/maps/...
 * - https://maps.google.com/?q=lat,lng
 */
export function extractCoordsFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    const urlObj = new URL(url)
    
    // Tenta extrair de parâmetros ?q= (formato: lat,lng ou endereço)
    const q = urlObj.searchParams.get('q')
    if (q) {
      const parts = q.split(',')
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim())
        const lng = parseFloat(parts[1].trim())
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng }
        }
      }
    }

    // Tenta extrair de parâmetros @lat,lng,z (formato comum no Google Maps)
    const atMatch = urlObj.hash.match(/@([-\d.]+),([-\d.]+)/)
    if (atMatch) {
      const lat = parseFloat(atMatch[1])
      const lng = parseFloat(atMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng }
      }
    }

    // Se for g.page/XXX (short URL), não conseguimos extrair - retorna null
    // O usuário precisará usar o link completo
    return null
  } catch (error) {
    return null
  }
}

/**
 * Extrai coordenadas de uma URL do Apple Maps
 * Suporta formatos:
 * - https://maps.apple.com/?address=...
 * - https://maps.apple.com/?q=...
 * - https://maps.apple.com/?ll=lat,lng
 */
export function extractCoordsFromAppleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    const urlObj = new URL(url)
    
    // Tenta extrair de parâmetro ll (latitude,longitude)
    const ll = urlObj.searchParams.get('ll')
    if (ll) {
      const parts = ll.split(',')
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim())
        const lng = parseFloat(parts[1].trim())
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng }
        }
      }
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Identifica o tipo de URL (Google Maps ou Apple Maps)
 */
export function identifyMapSource(url: string): 'google' | 'apple' | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Google Maps: Reconhecer múltiplos formatos
    if (
      hostname.includes('maps.google') ||        // maps.google.com, maps.google.com.br
      hostname.includes('google.com/maps') ||    // google.com/maps
      hostname === 'g.page' ||                   // g.page/xxx
      hostname.includes('g.page') ||             // g.page
      hostname === 'maps.app.goo.gl' ||          // maps.app.goo.gl (short URL)
      hostname.includes('goo.gl') ||             // goo.gl (Google's short URL service)
      hostname.includes('google.com') ||         // Qualquer domínio do Google
      hostname === 'google.com' ||
      hostname === 'www.google.com'
    ) {
      return 'google'
    }
    
    // Apple Maps
    if (hostname.includes('maps.apple')) {
      return 'apple'
    }
    
    return null
  } catch (error) {
    return null
  }
}

/**
 * Abre um link de mapa no app nativo apropriado
 * Mostra um modal/ActionSheet perguntando qual app o usuário prefere
 */
export async function openMapLink(
  url: string,
  title: string = 'Abrir local'
): Promise<void> {
  if (!url.trim()) return

  const source = identifyMapSource(url)
  if (!source) {
    Alert.alert('Link inválido', 'Cole um link válido do Google Maps ou Apple Maps')
    return
  }

  // Tentar abrir diretamente (funcionará se o app estiver instalado)
  const canOpenUrl = await Linking.canOpenURL(url)

  if (Platform.OS === 'ios') {
    // No iOS, mostrar ActionSheetIOS com opções
    const options = ['Cancelar']
    const destructiveButtonIndex = undefined
    const cancelButtonIndex = 0
    let actionIndex = 0

    if (source === 'google') {
      options.push('Abrir no Google Maps')
      options.push('Abrir no Safari')
    } else {
      options.push('Abrir no Apple Maps')
      options.push('Abrir no Safari')
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title,
        message: 'Escolha como abrir este local',
      },
      (buttonIndex) => {
        if (buttonIndex === cancelButtonIndex) return

        if (source === 'google') {
          if (buttonIndex === 1) {
            // Tentar abrir no Google Maps app
            const gmapsUrl = url.replace('https://maps.google.com', 'comgooglemaps://').replace('https://www.google.com/maps', 'comgooglemaps://')
            Linking.canOpenURL(gmapsUrl).then((supported) => {
              if (supported) {
                Linking.openURL(gmapsUrl)
              } else {
                Linking.openURL(url)
              }
            })
          } else if (buttonIndex === 2) {
            Linking.openURL(url)
          }
        } else {
          if (buttonIndex === 1) {
            // Apple Maps - usar schema maps://
            const appleMapsUrl = url.replace('https://maps.apple.com', 'maps://')
            Linking.canOpenURL(appleMapsUrl).then((supported) => {
              if (supported) {
                Linking.openURL(appleMapsUrl)
              } else {
                Linking.openURL(url)
              }
            })
          } else if (buttonIndex === 2) {
            Linking.openURL(url)
          }
        }
      }
    )
  } else {
    // Android e Web - usar Alert
    const options = ['Cancelar']
    
    if (source === 'google') {
      options.push('Abrir no Google Maps')
    } else {
      options.push('Abrir no Apple Maps')
    }
    options.push('Abrir no navegador')

    Alert.alert(
      title,
      'Escolha como abrir este local',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: source === 'google' ? 'Google Maps' : 'Apple Maps',
          onPress: () => {
            if (source === 'google') {
              const gmapsUrl = url.replace('https://maps.google.com', 'comgooglemaps://').replace('https://www.google.com/maps', 'comgooglemaps://')
              Linking.canOpenURL(gmapsUrl).then((supported) => {
                if (supported) {
                  Linking.openURL(gmapsUrl)
                } else {
                  Linking.openURL(url)
                }
              })
            } else {
              const appleMapsUrl = url.replace('https://maps.apple.com', 'maps://')
              Linking.canOpenURL(appleMapsUrl).then((supported) => {
                if (supported) {
                  Linking.openURL(appleMapsUrl)
                } else {
                  Linking.openURL(url)
                }
              })
            }
          },
        },
        {
          text: 'Navegador',
          onPress: () => Linking.openURL(url),
        },
      ],
      { cancelable: false }
    )
  }
}

/**
 * Valida se uma URL é um link válido de mapa
 */
export function isValidMapUrl(url: string): boolean {
  if (!url.trim()) return false
  try {
    const urlObj = new URL(url)
    return identifyMapSource(url) !== null
  } catch {
    return false
  }
}
