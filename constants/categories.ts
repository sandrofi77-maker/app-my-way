// ─── Configurações centralizadas de categorias ───
// Fonte única de verdade para ícones, cores e labels de categorias
// usadas em expenses, itinerary, checklist e stats.

// ── Expense categories ──

export const EXPENSE_CATEGORIES = [
  'Hospedagem', 'Alimentação', 'Transporte',
  'Passeios', 'Compras', 'Saúde', 'Outros',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_CATEGORY_CONF: Record<string, { icon: string; color: string }> = {
  'Hospedagem':  { icon: 'hotel',             color: '#5856D6' },
  'Alimentação': { icon: 'restaurant',        color: '#FF9500' },
  'Alimentacao': { icon: 'restaurant',        color: '#FF9500' },
  'Transporte':  { icon: 'directions-car',    color: '#32ADE6' },
  'Passeios':    { icon: 'attractions',       color: '#34C759' },
  'Compras':     { icon: 'shopping-bag',      color: '#AF52DE' },
  'Saúde':       { icon: 'medical-services',  color: '#FF2D55' },
  'Saude':       { icon: 'medical-services',  color: '#FF2D55' },
  'Outros':      { icon: 'payments',          color: '#8E8E93' },
}

export function getExpenseCategoryConf(category: string) {
  return EXPENSE_CATEGORY_CONF[category] ?? EXPENSE_CATEGORY_CONF['Outros']
}

// ── Itinerary categories ──

export const ITINERARY_CATEGORIES = [
  { value: 'flight',        label: 'Voo',         icon: 'flight' as const,         color: '#000000' },
  { value: 'transport',     label: 'Transporte',  icon: 'directions-car' as const, color: '#32ADE6' },
  { value: 'accommodation', label: 'Hospedagem',  icon: 'hotel' as const,          color: '#5856D6' },
  { value: 'food',          label: 'Alimentação', icon: 'restaurant' as const,     color: '#FF9500' },
  { value: 'sightseeing',   label: 'Passeio',     icon: 'place' as const,          color: '#34C759' },
  { value: 'event',         label: 'Evento',      icon: 'event' as const,          color: '#FF2D55' },
  { value: 'shopping',      label: 'Compras',     icon: 'shopping-bag' as const,   color: '#AF52DE' },
  { value: 'free',          label: 'Livre',       icon: 'beach-access' as const,   color: '#8E8E93' },
] as const

export type ItineraryCategory = (typeof ITINERARY_CATEGORIES)[number]['value']

export const ITINERARY_CATEGORY_CONF: Record<string, { icon: string; color: string }> = Object.fromEntries(
  ITINERARY_CATEGORIES.map(c => [c.value, { icon: c.icon, color: c.color }])
)

export function getItineraryCategoryConf(value?: string | null) {
  return ITINERARY_CATEGORIES.find(c => c.value === value) ?? ITINERARY_CATEGORIES[7]
}

// ── Checklist categories ──

export const CHECKLIST_CATEGORIES = [
  { key: 'documentos',  label: 'Documentos',   icon: 'badge',            color: '#5856D6' },
  { key: 'roupas',      label: 'Roupas',        icon: 'checkroom',        color: '#FF9500' },
  { key: 'eletronicos', label: 'Eletronicos',   icon: 'devices',          color: '#32ADE6' },
  { key: 'saude',       label: 'Saude',         icon: 'medical-services', color: '#FF2D55' },
  { key: 'outros',      label: 'Outros',        icon: 'checklist',        color: '#8E8E93' },
] as const

export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  documentos:  ['Passaporte', 'Visto', 'Seguro viagem', 'Passagem impressa', 'Reservas de hotel'],
  roupas:      ['Roupas para os dias', 'Casaco / agasalho', 'Traje de banho', 'Sapatos confortaveis', 'Roupa intima extra'],
  eletronicos: ['Carregador do celular', 'Adaptador de tomada', 'Fones de ouvido', 'Power bank', 'Camera'],
  saude:       ['Remedios pessoais', 'Protetor solar', 'Repelente', 'Kit de primeiros socorros', 'Mascara'],
  outros:      ['Carteira / dinheiro', 'Copia dos documentos', 'Guia / mapa', 'Snacks para viagem'],
}
