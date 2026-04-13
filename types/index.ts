// ─── Tipos compartilhados ───
// Definições únicas de tipos usados em múltiplos arquivos.

export type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  status: string
  cover_image: string | null
  budget: number | null
  budget_currency: string | null
}

export type Flight = {
  id: string
  airline: string
  flight_number: string
  departure_airport: string
  arrival_airport: string
  departure_datetime: string
  arrival_datetime: string | null
  notes: string | null
  created_at: string
}

export type Accommodation = {
  id: string
  name: string
  location: string
  link: string | null
  check_in_date: string | null
  check_out_date: string | null
  check_in_time: string | null
  check_out_time: string | null
  description: string | null
  image_url: string | null
  created_at: string
}

export type Expense = {
  id: string
  category: string
  amount: number
  currency: string
  description: string
  date: string
  image_url?: string | null
  created_at: string
}

export type ItineraryItem = {
  id: string
  title: string
  description: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  end_time: string | null
  location: string | null
  image_url?: string | null
  category: string | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

export type ChecklistItem = {
  id: string
  title: string
  is_done: boolean
  category: string
}
