import { router } from 'expo-router'
import { ThemeProvider } from '../design-system/theme'
import { Storybook } from '../design-system/storybook/Storybook'

export default function DesignSystemScreen() {
  return (
    <ThemeProvider>
      <Storybook onExit={() => router.back()} />
    </ThemeProvider>
  )
}
