/**
 * Valida formato de email basico.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Valida comprimento minimo de senha (Supabase exige 6+).
 */
export function isPasswordStrong(value: string): boolean {
  return value.length >= 6
}
