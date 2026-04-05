/**
 * SheetModal — Bottom sheet no mobile, drawer lateral no desktop.
 *
 * Substitui o padrao: Modal > KeyboardView(sheetOverlay) > Pressable + View(sheetContainer)
 * Uso: <SheetModal visible={...} onClose={...}> conteudo </SheetModal>
 */
import {
  View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, Platform,
  useWindowDimensions, ScrollView
} from 'react-native'
import { Colors } from '../constants/Colors'
import KeyboardView from './KeyboardView'
import Icon from './Icon'

const C = Colors.dark

type Props = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  /** Titulo do drawer no desktop */
  title?: string
  /** Subtitulo */
  subtitle?: string
  /** Largura do drawer no desktop (default 480) */
  drawerWidth?: number
}

export default function SheetModal({ visible, onClose, children, title, subtitle, drawerWidth = 480 }: Props) {
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 1024

  if (isDesktop) {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={onClose} />
          <View style={[styles.drawerPanel, { width: drawerWidth }]}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1 }}>
                {title ? <Text style={styles.drawerTitle}>{title}</Text> : null}
                {subtitle ? <Text style={styles.drawerSubtitle}>{subtitle}</Text> : null}
              </View>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={onClose}>
                <Icon name="close" size={20} color={C.secondary} />
              </TouchableOpacity>
            </View>
            {/* Content */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.drawerScroll}
              style={{ flex: 1 }}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardView style={styles.mobileOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.mobileContainer}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.mobileScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // ── Desktop: drawer lateral direito ──
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawerPanel: {
    backgroundColor: C.surface,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.primary,
  },
  drawerSubtitle: {
    fontSize: 13,
    color: C.secondary,
    marginTop: 2,
  },
  drawerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  drawerScroll: {
    padding: 28,
    paddingBottom: 40,
  },

  // ── Mobile: bottom sheet ──
  mobileOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  mobileContainer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  mobileScroll: {
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
})
