import { describe, it, expect } from 'vitest'
import {
  applyDateMask, applyDateTimeMask, applyTimeMask,
  toISODateOrNull, toISODateTimeOrNull, toTimeOrNull,
  formatDateForInput, sanitizeDateInput,
} from '../date-locale'

describe('applyDateMask', () => {
  it('retorna vazio para vazio', () => {
    expect(applyDateMask('')).toBe('')
  })

  it('mascara 2 digitos (dia)', () => {
    expect(applyDateMask('10')).toBe('10')
  })

  it('mascara 4 digitos (dia/mes)', () => {
    expect(applyDateMask('1008')).toBe('10/08')
  })

  it('mascara 8 digitos (dia/mes/ano)', () => {
    expect(applyDateMask('10082026')).toBe('10/08/2026')
  })

  it('ignora caracteres nao numericos', () => {
    expect(applyDateMask('10/08/2026')).toBe('10/08/2026')
  })
})

describe('applyDateTimeMask', () => {
  it('mascara data + hora', () => {
    expect(applyDateTimeMask('100820261430')).toBe('10/08/2026 14:30')
  })

  it('mascara apenas data sem hora', () => {
    expect(applyDateTimeMask('10082026')).toBe('10/08/2026')
  })
})

describe('applyTimeMask', () => {
  it('retorna digitos brutos para 2 ou menos', () => {
    expect(applyTimeMask('14')).toBe('14')
  })

  it('adiciona : apos 2 digitos', () => {
    expect(applyTimeMask('1430')).toBe('14:30')
  })

  it('retorna vazio para vazio', () => {
    expect(applyTimeMask('')).toBe('')
  })
})

describe('toISODateOrNull', () => {
  it('retorna null para vazio', () => {
    expect(toISODateOrNull('')).toBeNull()
  })

  it('converte formato dd/mm/yyyy', () => {
    expect(toISODateOrNull('10/08/2026')).toBe('2026-08-10')
  })

  it('converte formato ISO', () => {
    expect(toISODateOrNull('2026-08-10')).toBe('2026-08-10')
  })

  it('retorna null para data invalida', () => {
    expect(toISODateOrNull('32/13/2026')).toBeNull()
  })

  it('retorna null para formato invalido', () => {
    expect(toISODateOrNull('abc')).toBeNull()
  })
})

describe('toISODateTimeOrNull', () => {
  it('retorna null para vazio', () => {
    expect(toISODateTimeOrNull('')).toBeNull()
  })

  it('converte formato local dd/mm/yyyy HH:mm', () => {
    const result = toISODateTimeOrNull('10/08/2026 14:30')
    expect(result).not.toBeNull()
    expect(result).toContain('2026')
  })

  it('converte formato ISO', () => {
    const result = toISODateTimeOrNull('2026-08-10T14:30')
    expect(result).not.toBeNull()
  })

  it('retorna null para hora invalida', () => {
    expect(toISODateTimeOrNull('10/08/2026 25:00')).toBeNull()
  })
})

describe('toTimeOrNull', () => {
  it('retorna null para vazio', () => {
    expect(toTimeOrNull('')).toBeNull()
  })

  it('converte horario valido', () => {
    expect(toTimeOrNull('14:30')).toBe('14:30')
  })

  it('converte horario com padding', () => {
    expect(toTimeOrNull('8:05')).toBe('08:05')
  })

  it('retorna null para hora > 23', () => {
    expect(toTimeOrNull('24:00')).toBeNull()
  })

  it('retorna null para minuto > 59', () => {
    expect(toTimeOrNull('14:60')).toBeNull()
  })

  it('retorna null para formato invalido', () => {
    expect(toTimeOrNull('abc')).toBeNull()
  })
})

describe('formatDateForInput', () => {
  it('retorna vazio para null', () => {
    expect(formatDateForInput(null)).toBe('')
  })

  it('converte ISO para formato local', () => {
    expect(formatDateForInput('2026-08-10')).toBe('10/08/2026')
  })

  it('retorna vazio para data invalida', () => {
    expect(formatDateForInput('invalid')).toBe('')
  })
})

describe('sanitizeDateInput', () => {
  it('remove caracteres nao numericos', () => {
    expect(sanitizeDateInput('10/08/2026abc')).toBe('10/08/2026')
  })

  it('limita a 10 caracteres', () => {
    expect(sanitizeDateInput('10/08/2026123')).toHaveLength(10)
  })
})
