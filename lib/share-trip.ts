import { Share, Platform } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { supabase } from './supabase'
import { getDeviceLocale } from './i18n'

type TripData = {
  trip: {
    title: string
    destination: string
    start_date: string | null
    end_date: string | null
    budget: number | null
    budget_currency: string | null
  }
  flights: Array<{
    airline: string
    flight_number: string
    departure_airport: string
    arrival_airport: string
    departure_datetime: string
    arrival_datetime: string | null
  }>
  accommodations: Array<{
    name: string
    location: string
    check_in_date: string | null
    check_out_date: string | null
    check_in_time: string | null
    check_out_time: string | null
  }>
  itinerary: Array<{
    title: string
    scheduled_date: string | null
    scheduled_time: string | null
    end_time: string | null
    location: string | null
    category: string | null
    description: string | null
  }>
  expenses: Array<{
    category: string
    amount: number
    currency: string
    description: string | null
    date: string
  }>
}

export async function loadTripData(tripId: string): Promise<TripData | null> {
  const [tripRes, flightsRes, accomRes, itinRes, expRes] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('flights').select('*').eq('trip_id', tripId).order('departure_datetime', { ascending: true }),
    supabase.from('accommodations').select('*').eq('trip_id', tripId).order('check_in_date', { ascending: true, nullsFirst: false }),
    supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('scheduled_date', { ascending: true }).order('scheduled_time', { ascending: true }),
    supabase.from('expenses').select('*').eq('trip_id', tripId).order('date', { ascending: true }),
  ])

  if (tripRes.error || !tripRes.data) return null

  return {
    trip: tripRes.data,
    flights: flightsRes.data || [],
    accommodations: accomRes.data || [],
    itinerary: itinRes.data || [],
    expenses: expRes.data || [],
  }
}

// ── Formatting helpers ──

const locale = getDeviceLocale()

function fmtDate(d: string | null): string {
  if (!d) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!m) return d
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return dt.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function fmtTime(t: string | null): string {
  if (!t) return ''
  return t.substring(0, 5)
}

// ── Text summary (WhatsApp/SMS) ──

function buildTextSummary(data: TripData): string {
  const { trip, flights, accommodations, itinerary, expenses } = data
  const lines: string[] = []

  lines.push(`✈️ *${trip.title}*`)
  lines.push(`📍 ${trip.destination}`)
  if (trip.start_date && trip.end_date) {
    lines.push(`📅 ${fmtDate(trip.start_date)} → ${fmtDate(trip.end_date)}`)
  }
  lines.push('')

  if (flights.length > 0) {
    lines.push('🛫 *Voos*')
    for (const f of flights) {
      lines.push(`  • ${f.airline} ${f.flight_number}: ${f.departure_airport} → ${f.arrival_airport}`)
      lines.push(`    ${fmtDateTime(f.departure_datetime)}${f.arrival_datetime ? ' – ' + fmtDateTime(f.arrival_datetime) : ''}`)
    }
    lines.push('')
  }

  if (accommodations.length > 0) {
    lines.push('🏨 *Hospedagem*')
    for (const a of accommodations) {
      lines.push(`  • ${a.name} — ${a.location}`)
      if (a.check_in_date) {
        lines.push(`    Check-in: ${fmtDate(a.check_in_date)}${a.check_in_time ? ' ' + fmtTime(a.check_in_time) : ''}`)
      }
      if (a.check_out_date) {
        lines.push(`    Check-out: ${fmtDate(a.check_out_date)}${a.check_out_time ? ' ' + fmtTime(a.check_out_time) : ''}`)
      }
    }
    lines.push('')
  }

  if (itinerary.length > 0) {
    lines.push('📋 *Roteiro*')
    let lastDate = ''
    for (const item of itinerary) {
      const dateStr = fmtDate(item.scheduled_date)
      if (dateStr && dateStr !== lastDate) {
        lines.push(`  📅 ${dateStr}`)
        lastDate = dateStr
      }
      const time = item.scheduled_time ? `${fmtTime(item.scheduled_time)}${item.end_time ? '–' + fmtTime(item.end_time) : ''}` : ''
      lines.push(`  • ${time ? time + ' ' : ''}${item.title}${item.location ? ' — ' + item.location : ''}`)
    }
    lines.push('')
  }

  lines.push('')
  lines.push('_Gerado pelo MyWay_')

  return lines.join('\n')
}

// ── HTML for PDF ──

const CATEGORY_LABELS: Record<string, string> = {
  flight: 'Voo', transport: 'Transporte', accommodation: 'Hospedagem',
  food: 'Alimentação', sightseeing: 'Passeio', event: 'Evento',
  shopping: 'Compras', free: 'Livre',
}

const CATEGORY_COLORS: Record<string, string> = {
  flight: '#1a1a1a', transport: '#32ADE6', accommodation: '#5856D6',
  food: '#FF9500', sightseeing: '#34C759', event: '#FF2D55',
  shopping: '#AF52DE', free: '#8E8E93',
}

function buildHTML(data: TripData): string {
  const { trip, flights, accommodations, itinerary, expenses } = data

  const dateRange = trip.start_date && trip.end_date
    ? `${fmtDate(trip.start_date)} — ${fmtDate(trip.end_date)}`
    : ''

  let flightsHTML = ''
  if (flights.length > 0) {
    flightsHTML = `
      <h2>🛫 Voos</h2>
      <table>
        <tr><th>Voo</th><th>Rota</th><th>Partida</th><th>Chegada</th></tr>
        ${flights.map(f => `
          <tr>
            <td><strong>${f.airline} ${f.flight_number}</strong></td>
            <td>${f.departure_airport} → ${f.arrival_airport}</td>
            <td>${fmtDateTime(f.departure_datetime)}</td>
            <td>${f.arrival_datetime ? fmtDateTime(f.arrival_datetime) : '—'}</td>
          </tr>
        `).join('')}
      </table>`
  }

  let accommodationsHTML = ''
  if (accommodations.length > 0) {
    accommodationsHTML = `
      <h2>🏨 Hospedagem</h2>
      <table>
        <tr><th>Hotel</th><th>Local</th><th>Check-in</th><th>Check-out</th></tr>
        ${accommodations.map(a => `
          <tr>
            <td><strong>${a.name}</strong></td>
            <td>${a.location}</td>
            <td>${fmtDate(a.check_in_date)}${a.check_in_time ? '<br/>' + fmtTime(a.check_in_time) : ''}</td>
            <td>${fmtDate(a.check_out_date)}${a.check_out_time ? '<br/>' + fmtTime(a.check_out_time) : ''}</td>
          </tr>
        `).join('')}
      </table>`
  }

  let itineraryHTML = ''
  if (itinerary.length > 0) {
    let lastDate = ''
    let rows = ''
    for (const item of itinerary) {
      const dateStr = fmtDate(item.scheduled_date)
      if (dateStr && dateStr !== lastDate) {
        rows += `<tr class="day-row"><td colspan="4">${dateStr}</td></tr>`
        lastDate = dateStr
      }
      const catColor = CATEGORY_COLORS[item.category || 'free'] || '#8E8E93'
      const catLabel = CATEGORY_LABELS[item.category || 'free'] || ''
      const time = item.scheduled_time
        ? `${fmtTime(item.scheduled_time)}${item.end_time ? ' – ' + fmtTime(item.end_time) : ''}`
        : ''
      rows += `
        <tr>
          <td>${time}</td>
          <td><span class="cat-badge" style="background:${catColor}15;color:${catColor};border:1px solid ${catColor}40">${catLabel}</span></td>
          <td><strong>${item.title}</strong>${item.description ? '<br/><span class="desc">' + item.description + '</span>' : ''}</td>
          <td>${item.location || ''}</td>
        </tr>`
    }
    itineraryHTML = `
      <h2>📋 Roteiro</h2>
      <table>
        <tr><th>Horário</th><th>Categoria</th><th>Evento</th><th>Local</th></tr>
        ${rows}
      </table>`
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 32px; font-size: 13px; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0F2F59; }
    .header h1 { font-size: 26px; color: #0F2F59; margin-bottom: 4px; }
    .header .dest { font-size: 15px; color: #666; }
    .header .dates { font-size: 13px; color: #888; margin-top: 4px; }
    h2 { font-size: 16px; color: #0F2F59; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f5f5f7; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr.day-row td { background: #0F2F5910; font-weight: 700; color: #0F2F59; font-size: 12px; padding: 6px 10px; }
    .cat-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; display: inline-block; }
    .desc { color: #888; font-size: 11px; }
    .totals { font-size: 14px; margin-bottom: 12px; color: #333; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; color: #aaa; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${trip.title}</h1>
    <div class="dest">📍 ${trip.destination}</div>
    ${dateRange ? `<div class="dates">📅 ${dateRange}</div>` : ''}
  </div>
  ${flightsHTML}
  ${accommodationsHTML}
  ${itineraryHTML}
  <div class="footer">Gerado pelo MyWay</div>
</body>
</html>`
}

// ── Public API ──

export async function shareAsText(tripId: string) {
  const data = await loadTripData(tripId)
  if (!data) return

  const text = buildTextSummary(data)
  await Share.share({
    message: text,
    title: data.trip.title,
  })
}

export async function shareAsPDF(tripId: string) {
  const data = await loadTripData(tripId)
  if (!data) throw new Error('Não foi possível carregar os dados da viagem')

  const html = buildHTML(data)

  if (Platform.OS === 'web') {
    await Print.printAsync({ html })
    return
  }

  const { uri } = await Print.printToFileAsync({ html })
  const available = await Sharing.isAvailableAsync()

  if (!available) {
    throw new Error('Compartilhamento não disponível neste dispositivo')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: data.trip.title,
    UTI: 'com.adobe.pdf',
  })
}
