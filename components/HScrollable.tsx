/**
 * HScrollable — ScrollView horizontal com setas de navegacao no desktop.
 *
 * No mobile: ScrollView horizontal normal (swipe).
 * No desktop web: mostra setas esquerda/direita + scroll com roda do mouse.
 *
 * Para carrosseis paginados (cards grandes): use paginated + itemWidth.
 * Para chips/tags horizontais: use sem props extras.
 */
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent
} from 'react-native'
import { useRef, useState, useCallback, ReactNode } from 'react'
import Icon from './Icon'
import { Colors } from '../constants/Colors'

const C = Colors.dark

type Props = {
  children: ReactNode
  /** Estilo do container */
  contentContainerStyle?: any
  /** Se true, habilita paginacao por item */
  paginated?: boolean
  /** Largura de cada item (necessario para paginacao) */
  itemWidth?: number
  /** Total de itens (necessario para paginacao) */
  itemCount?: number
  /** Indice ativo atual (controlado externamente) */
  activeIndex?: number
  /** Callback quando indice muda (paginado) */
  onIndexChange?: (index: number) => void
  /** Mostrar indicadores de paginacao */
  showDots?: boolean
  /** Props extras para o ScrollView */
  scrollViewProps?: Record<string, any>
}

export default function HScrollable({
  children,
  contentContainerStyle,
  paginated,
  itemWidth,
  itemCount = 0,
  activeIndex = 0,
  onIndexChange,
  showDots,
  scrollViewProps,
}: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && windowWidth >= 1024
  const scrollRef = useRef<ScrollView>(null)
  const [scrollX, setScrollX] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const canScrollLeft = scrollX > 4
  const canScrollRight = contentWidth - scrollX - containerWidth > 4

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x
    setScrollX(x)
    if (paginated && itemWidth && onIndexChange) {
      const idx = Math.round(x / itemWidth)
      onIndexChange(idx)
    }
    scrollViewProps?.onMomentumScrollEnd?.(e)
  }, [paginated, itemWidth, onIndexChange, scrollViewProps])

  function scrollBy(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const step = paginated && itemWidth ? itemWidth : containerWidth * 0.7
    const target = direction === 'left'
      ? Math.max(0, scrollX - step)
      : scrollX + step
    scrollRef.current.scrollTo({ x: target, animated: true })
  }

  function goToIndex(idx: number) {
    if (!scrollRef.current || !itemWidth) return
    scrollRef.current.scrollTo({ x: idx * itemWidth, animated: true })
    onIndexChange?.(idx)
  }

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Setas desktop */}
      {isDesktop && canScrollLeft && (
        <TouchableOpacity
          style={[styles.arrowBtn, styles.arrowLeft]}
          onPress={() => scrollBy('left')}
          activeOpacity={0.8}
        >
          <Icon name="chevron-left" size={22} color={C.primary} />
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={paginated && !isDesktop}
        decelerationRate={paginated ? 'fast' : 'normal'}
        contentContainerStyle={contentContainerStyle}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>

      {isDesktop && canScrollRight && (
        <TouchableOpacity
          style={[styles.arrowBtn, styles.arrowRight]}
          onPress={() => scrollBy('right')}
          activeOpacity={0.8}
        >
          <Icon name="chevron-right" size={22} color={C.primary} />
        </TouchableOpacity>
      )}

      {/* Dots paginados com clique */}
      {showDots && itemCount > 1 && (
        <View style={styles.dotsRow}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToIndex(i)}
              hitSlop={6}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  arrowLeft: {
    left: -12,
  },
  arrowRight: {
    right: -12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.border,
  },
  dotActive: {
    backgroundColor: C.primary,
    width: 18,
    borderRadius: 4,
  },
})
