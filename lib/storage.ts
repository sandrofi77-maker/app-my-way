import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import { decode } from 'base64-arraybuffer'

const BUCKET = 'trip-images'

/**
 * Faz upload de uma imagem local para o Supabase Storage.
 * Retorna a URL pública do arquivo.
 */
export async function uploadImage(localUri: string, folder: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg'
  const mimeMap: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
  }
  const mimeType = mimeMap[ext] || 'image/jpeg'
  const filename = `${user.id}/${folder}/${Date.now()}.${ext}`

  let body: ArrayBuffer

  if (Platform.OS === 'web') {
    // Web: fetch funciona normalmente
    const response = await fetch(localUri)
    body = await response.arrayBuffer()
  } else {
    // Nativo: usar FileSystem para ler como base64 e converter
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64' as any,
    })
    body = decode(base64)
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, body, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename)

  return urlData.publicUrl
}
