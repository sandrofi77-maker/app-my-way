import { describe, it, expect } from 'vitest'
import { isValidEmail, isPasswordStrong } from '../validation'

describe('isValidEmail', () => {
  it('aceita email valido simples', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('aceita email com subdominio', () => {
    expect(isValidEmail('user@mail.example.co.br')).toBe(true)
  })

  it('aceita email com caracteres especiais no local part', () => {
    expect(isValidEmail('user.name+tag@example.com')).toBe(true)
  })

  it('rejeita string vazia', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejeita email sem @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejeita email sem dominio', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejeita email sem local part', () => {
    expect(isValidEmail('@example.com')).toBe(false)
  })

  it('rejeita email com espacos', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })

  it('rejeita email sem extensao de dominio', () => {
    expect(isValidEmail('user@example')).toBe(false)
  })
})

describe('isPasswordStrong', () => {
  it('aceita senha com 6 caracteres', () => {
    expect(isPasswordStrong('123456')).toBe(true)
  })

  it('aceita senha longa', () => {
    expect(isPasswordStrong('senhaForte123!')).toBe(true)
  })

  it('rejeita senha com 5 caracteres', () => {
    expect(isPasswordStrong('12345')).toBe(false)
  })

  it('rejeita senha vazia', () => {
    expect(isPasswordStrong('')).toBe(false)
  })
})
