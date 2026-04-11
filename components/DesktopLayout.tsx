import { View, StyleSheet } from 'react-native'
import { useResponsive } from '../hooks/useResponsive'
import WebTopBar from './WebTopBar'
import { Colors } from '../constants/Colors'

const C = Colors.dark

type Props = {
  children: React.ReactNode
  /** Desabilita o maxWidth do conteudo (para telas que ja gerenciam o proprio layout) */
  fullWidth?: boolean
}

export default function DesktopLayout({ children, fullWidth }: Props) {
  const { isDesktop, contentMaxWidth } = useResponsive()

  if (!isDesktop) {
    return <>{children}</>
  }

  return (
    <View style={styles.root}>
      <WebTopBar />
      <View style={styles.main}>
        <View style={fullWidth ? styles.contentFull : [styles.content, { maxWidth: contentMaxWidth }]}>
          {children}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: C.background,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentFull: {
    flex: 1,
    width: '100%',
  },
})
