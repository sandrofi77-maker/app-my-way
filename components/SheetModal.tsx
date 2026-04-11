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
  /** Callback de exclusao — exibe botao de lixeira no header */
  onDelete?: () => void
  /** Desabilita o botao de excluir */
  deleteDisabled?: boolean
}

export default function SheetModal({ visible, onClose, children, title, subtitle, drawerWidth = 480, onDelete, deleteDisabled }: Props) {
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
              {onDelete && (
                <TouchableOpacity style={styles.headerDeleteBtn} onPress={onDelete} disabled={deleteDisabled}>
                  <Icon name="delete-outline" size={20} color={C.error} />
                </TouchableOpacity>
              )}
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
          <View style={styles.mobileTopRow}>
            <View style={styles.handle} />
            <View style={styles.mobileTopBtns}>
              {onDelete && (
                <TouchableOpacity style={styles.headerDeleteBtn} onPress={onDelete} disabled={deleteDisabled}>
                  <Icon name="delete-outline" size={18} color={C.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.mobileCloseBtn} onPress={onClose}>
                <Icon name="close" size={18} color={C.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          {(title || subtitle) && (
            <View style={styles.mobileHeader}>
              <View style={{ flex: 1 }}>
                {title ? <Text style={styles.mobileTitle}>{title}</Text> : null}
                {subtitle ? <Text style={styles.mobileSubtitle}>{subtitle}</Text> : null}
              </View>
            </View>
          )}
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
    gap: 10,
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
  headerDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
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
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  mobileTopBtns: {
    position: 'absolute',
    right: 16,
    top: 10,
    flexDirection: 'row',
    gap: 8,
  },
  mobileCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.primary,
  },
  mobileSubtitle: {
    fontSize: 13,
    color: C.secondary,
    marginTop: 2,
  },
  mobileScroll: {
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
})
