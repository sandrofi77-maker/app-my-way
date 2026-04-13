import { describe, it, expect } from 'vitest'
import { t, getDeviceLocale } from '../i18n'

describe('getDeviceLocale', () => {
  it('retorna pt-BR como locale padrao', () => {
    expect(getDeviceLocale()).toBe('pt-BR')
  })
})

describe('t (traducao)', () => {
  it('retorna string em portugues para chave conhecida', () => {
    expect(t('error_title')).toBe('Erro')
  })

  it('retorna string nao vazia para attention_title', () => {
    const result = t('attention_title')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('retorna string para todas as chaves obrigatorias', () => {
    const keys: Array<Parameters<typeof t>[0]> = [
      'error_title',
      'attention_title',
      'generic_error',
      'session_expired',
      'required_auth_fields',
      'invalid_email',
      'password_too_short',
      'required_name',
      'save_failed',
    ]
    for (const key of keys) {
      const value = t(key)
      expect(value, `chave "${key}" deve ter traducao`).toBeTruthy()
    }
  })
})
