import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Box, Text, VStack, Button } from '../design-system'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box flex={1} bg="background" justifyContent="center" alignItems="center" px={6}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <VStack gap={4} alignItems="center" maxWidth={400}>
            <Text variant="h2" weight="700" align="center">
              Algo deu errado
            </Text>
            <Text variant="body" color="textSecondary" align="center">
              Ocorreu um erro inesperado. Tente novamente.
            </Text>
            {__DEV__ && this.state.error && (
              <Box bg="surface" borderRadius="lg" p={4} width="100%" borderWidth={1} borderColor="error">
                <Text variant="caption" color="error" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              </Box>
            )}
            <Button variant="primary" size="lg" onPress={this.handleReset}>
              Tentar novamente
            </Button>
          </VStack>
        </ScrollView>
      </Box>
    )
  }
}
