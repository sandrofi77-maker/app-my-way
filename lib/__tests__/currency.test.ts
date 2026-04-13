import { describe, it, expect } from 'vitest'
import { formatBRL, applyCurrencyMask, parseCurrencyInput, numberToCurrencyInput } from '../currency'

describe('formatBRL', () => {
  it('formata inteiros com 2 casas decimais', () => {
    expect(formatBRL(100)).toContain('100')
  })

  it('formata zero', () => {
    expect(formatBRL(0)).toContain('0')
  })

  it('formata valores grandes com separador de milhar', () => {
    const result = formatBRL(1234.56)
    expect(result).toMatch(/1\.?234/)
  })

  it('respeita parametro decimals', () => {
    const result = formatBRL(100, 0)
    expect(result).toBe('100')
  })
})

describe('applyCurrencyMask', () => {
  it('retorna vazio para string vazia', () => {
    expect(applyCurrencyMask('')).toBe('')
  })

  it('retorna vazio para string sem digitos', () => {
    expect(applyCurrencyMask('abc')).toBe('')
  })

  it('mascara digito unico como centavos', () => {
    const result = applyCurrencyMask('1')
    expect(result).toContain('0')
    expect(result).toContain('01')
  })

  it('mascara 3 digitos corretamente', () => {
    const result = applyCurrencyMask('123')
    expect(result).toContain('1')
    expect(result).toContain('23')
  })
})

describe('parseCurrencyInput', () => {
  it('retorna 0 para string vazia', () => {
    expect(parseCurrencyInput('')).toBe(0)
  })

  it('converte formato brasileiro para numero', () => {
    expect(parseCurrencyInput('1.234,56')).toBe(1234.56)
  })

  it('converte valor simples', () => {
    expect(parseCurrencyInput('10,00')).toBe(10)
  })

  it('retorna 0 para valor invalido', () => {
    expect(parseCurrencyInput('abc')).toBe(0)
  })
})

describe('numberToCurrencyInput', () => {
  it('retorna vazio para null', () => {
    expect(numberToCurrencyInput(null)).toBe('')
  })

  it('retorna vazio para undefined', () => {
    expect(numberToCurrencyInput(undefined)).toBe('')
  })

  it('retorna vazio para zero', () => {
    expect(numberToCurrencyInput(0)).toBe('')
  })

  it('formata numero para input', () => {
    const result = numberToCurrencyInput(1234.56)
    expect(result).toMatch(/1\.?234,56/)
  })
})
