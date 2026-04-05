import { Alert, Platform } from 'react-native'

type AlertButton = {
  text: string
  style?: 'cancel' | 'destructive' | 'default'
  onPress?: () => void
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons)
    return
  }

  // Web: sem botoes ou apenas "OK" → window.alert
  if (!buttons || buttons.length === 0 || (buttons.length === 1 && !buttons[0].onPress)) {
    window.alert(message ? `${title}\n\n${message}` : title)
    return
  }

  // Web: com botoes de acao → window.confirm
  const actionBtn = buttons.find(b => b.style !== 'cancel')
  const cancelBtn = buttons.find(b => b.style === 'cancel')

  const confirmed = window.confirm(message ? `${title}\n\n${message}` : title)
  if (confirmed) {
    actionBtn?.onPress?.()
  } else {
    cancelBtn?.onPress?.()
  }
}
