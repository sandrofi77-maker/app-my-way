import { Image, type ImageProps } from 'expo-image'
import { type StyleProp, type ImageStyle } from 'react-native'

type Props = Omit<ImageProps, 'source'> & {
  uri: string | null | undefined
  style?: StyleProp<ImageStyle>
}

/**
 * Imagem otimizada com cache automatico em disco (expo-image).
 * Substitui o Image padrao do React Native com:
 * - Cache em memoria e disco
 * - Transicao suave ao carregar
 * - Recycling automatico em listas
 */
export default function CachedImage({ uri, style, ...rest }: Props) {
  if (!uri) return null

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      {...rest}
    />
  )
}
