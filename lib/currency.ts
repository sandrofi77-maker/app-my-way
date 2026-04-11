/**
 * Formata um numero como moeda brasileira: R$ 1.234,56
 */
export function formatBRL(value: number, decimals: number = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Mascara de input monetario (centavos).
 * Digitos entram pela direita: "1" => "0,01", "123" => "1,23", "12345" => "123,45"
 */
export function applyCurrencyMask(text: string): string {
  const digits = text.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  const value = cents / 100
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Converte valor mascarado ("1.234,56") para numero (1234.56)
 */
export function parseCurrencyInput(text: string): number {
  if (!text) return 0
  const cleaned = text.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Formata um numero para exibicao em input (usado ao abrir edicao)
 */
export function numberToCurrencyInput(value: number | null | undefined): string {
  if (value == null || value === 0) return ''
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
