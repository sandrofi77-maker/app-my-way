import { getDeviceLocale } from './i18n'

const DATE_PART_ORDER = Intl.DateTimeFormat(getDeviceLocale())
  .formatToParts(new Date(2001, 10, 22))
  .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
  .map((part) => part.type as 'day' | 'month' | 'year')

const DATE_SEPARATOR = (() => {
  const parts = Intl.DateTimeFormat(getDeviceLocale()).formatToParts(new Date(2001, 10, 22))
  return parts.find((part) => part.type === 'literal')?.value || '/'
})()

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function parseDatePieces(input: string) {
  const raw = input.trim()
  if (!raw) return null

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    }
  }

  const splitMatch = raw.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/)
  if (!splitMatch) return null

  const first = Number(splitMatch[1])
  const second = Number(splitMatch[2])
  const third = Number(splitMatch[3])

  if (splitMatch[1].length === 4) {
    return { year: first, month: second, day: third }
  }

  if (splitMatch[3].length !== 4 || DATE_PART_ORDER.length < 3) {
    return null
  }

  const result: Record<'day' | 'month' | 'year', number> = { day: 0, month: 0, year: 0 }
  result[DATE_PART_ORDER[0]] = first
  result[DATE_PART_ORDER[1]] = second
  result[DATE_PART_ORDER[2]] = third

  return {
    year: result.year,
    month: result.month,
    day: result.day,
  }
}

function isValidDate(year: number, month: number, day: number) {
  if (year < 1900 || year > 2100) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  const dt = new Date(year, month - 1, day)
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day
}

export function getLocalDatePlaceholder() {
  return new Date(2026, 7, 10).toLocaleDateString(getDeviceLocale())
}

export function getLocalDateTimePlaceholder() {
  return new Date(2026, 7, 10, 14, 30).toLocaleString(getDeviceLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getLocalTimePlaceholder() {
  return new Date(2026, 7, 10, 14, 30).toLocaleTimeString(getDeviceLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sanitizeDateInput(value: string) {
  return value.replace(/[^0-9./-]/g, '').slice(0, 10)
}

export function sanitizeDateTimeInput(value: string) {
  return value
    .replace(/[^0-9./\-:,\sT]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, 25)
}

export function applyDateMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  const yearFirst = DATE_PART_ORDER[0] === 'year'
  const sizes = yearFirst ? [4, 2, 2] : [2, 2, 4]

  const first = digits.slice(0, sizes[0])
  const second = digits.slice(sizes[0], sizes[0] + sizes[1])
  const third = digits.slice(sizes[0] + sizes[1], sizes[0] + sizes[1] + sizes[2])

  if (!first) return ''
  if (!second) return first
  if (!third) return `${first}${DATE_SEPARATOR}${second}`
  return `${first}${DATE_SEPARATOR}${second}${DATE_SEPARATOR}${third}`
}

export function applyDateTimeMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  const dateDigits = digits.slice(0, 8)
  const timeDigits = digits.slice(8, 12)

  const maskedDate = applyDateMask(dateDigits)
  if (!timeDigits) return maskedDate

  const hour = timeDigits.slice(0, 2)
  const minute = timeDigits.slice(2, 4)

  if (!minute) return `${maskedDate} ${hour}`
  return `${maskedDate} ${hour}:${minute}`
}

export function applyTimeMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function toISODateOrNull(input: string) {
  const raw = input.trim()
  if (!raw) return null

  const pieces = parseDatePieces(raw)
  if (!pieces || !isValidDate(pieces.year, pieces.month, pieces.day)) {
    return null
  }

  return `${pieces.year}-${pad2(pieces.month)}-${pad2(pieces.day)}`
}

export function toISODateTimeOrNull(input: string) {
  const raw = input.trim()
  if (!raw) return null

  const isoDateTime = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (isoDateTime) {
    const year = Number(isoDateTime[1].slice(0, 4))
    const month = Number(isoDateTime[1].slice(5, 7))
    const day = Number(isoDateTime[1].slice(8, 10))
    const hour = Number(isoDateTime[2])
    const minute = Number(isoDateTime[3])
    const second = Number(isoDateTime[4] || '0')

    if (!isValidDate(year, month, day)) return null
    if (hour > 23 || minute > 59 || second > 59) return null

    return new Date(year, month - 1, day, hour, minute, second).toISOString()
  }

  const localDateTime = raw.match(/^(.+?)[,\s]+(\d{1,2}):(\d{2})$/)
  if (!localDateTime) return null

  const datePart = localDateTime[1]
  const hour = Number(localDateTime[2])
  const minute = Number(localDateTime[3])
  const pieces = parseDatePieces(datePart)

  if (!pieces || !isValidDate(pieces.year, pieces.month, pieces.day)) return null
  if (hour > 23 || minute > 59) return null

  return new Date(pieces.year, pieces.month - 1, pieces.day, hour, minute, 0).toISOString()
}

export function toTimeOrNull(input: string) {
  const raw = input.trim()
  if (!raw) return null

  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  if (hour > 23 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
