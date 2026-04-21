type LocaleStrings = {
  permission_needed_title: string
  permission_needed_body: string
  attention_title: string
  error_title: string
  confirm_delete_expense_title: string
  confirm_delete_expense_body: string
  confirm_delete_expense_second_title: string
  confirm_delete_expense_second_body: string
  confirm_delete_flight_title: string
  confirm_delete_flight_body: string
  confirm_delete_accommodation_title: string
  confirm_delete_accommodation_body: string
  confirm_delete_trip_title: string
  confirm_delete_trip_body: string
  cancel_label: string
  delete_label: string
  required_trip_fields: string
  invalid_departure_date: string
  invalid_return_date: string
  invalid_departure_datetime: string
  invalid_arrival_datetime: string
  invalid_checkin_date: string
  invalid_checkout_date: string
  invalid_checkin_time: string
  invalid_checkout_time: string
  required_flight_fields: string
  required_accommodation_fields: string
  invalid_amount: string
  save_failed: string
  create_account_title: string
  create_account_body: string
  generic_error: string
  session_expired: string
  save_flight_failed: string
  delete_flight_failed: string
  save_accommodation_failed: string
  delete_accommodation_failed: string
  delete_trip_failed: string
  required_auth_fields: string
  confirm_delete_itinerary_title: string
  confirm_delete_itinerary_body: string
  required_itinerary_fields: string
  save_itinerary_failed: string
  delete_itinerary_failed: string
  invalid_itinerary_date: string
  invalid_itinerary_time: string
  reset_password_title: string
  reset_password_body: string
  reset_password_empty: string
  invalid_email: string
  password_too_short: string
  required_name: string
  // ── Home / badges ──
  completed_badge: string
  no_date_badge: string
  today_badge: string
  days_remaining_one: string
  days_remaining_other: string
  trips_load_error: string
  planned_trips_tab: string
  completed_trips_tab: string
  no_open_trips: string
  no_completed_trips: string
  create_first_trip: string
  finish_trip_hint: string
  days_between_trips: string
  // ── Sections ──
  no_flights: string
  no_accommodations: string
  no_expenses: string
  // ── Validation ──
  arrival_before_departure: string
  checkout_before_checkin: string
  end_before_start: string
  // ── Sync ──
  sync_failure: string
  offline_label: string
  syncing_label: string
}

const STRINGS: Record<'pt' | 'en', LocaleStrings> = {
  pt: {
    permission_needed_title: 'Permissão necessária',
    permission_needed_body: 'Precisamos acessar sua galeria para escolher a foto.',
    attention_title: 'Atenção',
    error_title: 'Erro',
    confirm_delete_expense_title: 'Excluir gasto',
    confirm_delete_expense_body: 'Remover este gasto?',
    confirm_delete_expense_second_title: 'Confirmar exclusao',
    confirm_delete_expense_second_body: 'Essa acao nao pode ser desfeita. Deseja excluir?',
    confirm_delete_flight_title: 'Excluir voo',
    confirm_delete_flight_body: 'Tem certeza que deseja excluir este voo?',
    confirm_delete_accommodation_title: 'Excluir hospedagem',
    confirm_delete_accommodation_body: 'Tem certeza que deseja excluir esta hospedagem?',
    confirm_delete_trip_title: 'Excluir viagem',
    confirm_delete_trip_body: 'Tem certeza?',
    cancel_label: 'Cancelar',
    delete_label: 'Excluir',
    required_trip_fields: 'Preencha o nome e o destino.',
    invalid_departure_date: 'Data de ida inválida. Use o formato local do dispositivo.',
    invalid_return_date: 'Data de volta inválida. Use o formato local do dispositivo.',
    invalid_departure_datetime: 'Data/hora de saída inválida. Use o formato local do dispositivo.',
    invalid_arrival_datetime: 'Data/hora de chegada inválida. Use o formato local do dispositivo.',
    invalid_checkin_date: 'Data de check-in inválida. Use o formato local do dispositivo.',
    invalid_checkout_date: 'Data de check-out inválida. Use o formato local do dispositivo.',
    invalid_checkin_time: 'Horário de check-in inválido. Use HH:mm.',
    invalid_checkout_time: 'Horário de check-out inválido. Use HH:mm.',
    required_flight_fields: 'Preencha os campos obrigatórios do voo.',
    required_accommodation_fields: 'Preencha o nome e o local da hospedagem.',
    invalid_amount: 'Digite um valor válido.',
    save_failed: 'Não foi possível salvar.',
    create_account_title: 'Conta criada!',
    create_account_body: 'Verifique seu email para confirmar.',
    generic_error: 'Algo deu errado.',
    session_expired: 'Sessão expirada.',
    save_flight_failed: 'Não foi possível salvar o voo.',
    delete_flight_failed: 'Não foi possível excluir o voo.',
    save_accommodation_failed: 'Não foi possível salvar a hospedagem.',
    delete_accommodation_failed: 'Não foi possível excluir a hospedagem.',
    delete_trip_failed: 'Não foi possível excluir.',
    required_auth_fields: 'Preencha email e senha.',
    confirm_delete_itinerary_title: 'Excluir item',
    confirm_delete_itinerary_body: 'Tem certeza que deseja excluir este item do roteiro?',
    required_itinerary_fields: 'Preencha o titulo do item.',
    save_itinerary_failed: 'Não foi possível salvar o item do roteiro.',
    delete_itinerary_failed: 'Não foi possível excluir o item do roteiro.',
    invalid_itinerary_date: 'Data do item inválida. Use o formato local do dispositivo.',
    invalid_itinerary_time: 'Horário do item inválido. Use HH:mm.',
    reset_password_title: 'Email enviado',
    reset_password_body: 'Verifique sua caixa de entrada para redefinir a senha.',
    reset_password_empty: 'Digite seu email para recuperar a senha.',
    invalid_email: 'Digite um email válido.',
    password_too_short: 'A senha deve ter pelo menos 6 caracteres.',
    required_name: 'Preencha o nome de exibição.',
    completed_badge: 'Concluída',
    no_date_badge: 'Sem data',
    today_badge: 'Hoje',
    days_remaining_one: 'Falta 1 dia',
    days_remaining_other: 'Faltam {count} dias',
    trips_load_error: 'Erro ao carregar viagens.',
    planned_trips_tab: 'Viagens planejadas',
    completed_trips_tab: 'Viagens concluídas',
    no_open_trips: 'Nenhuma viagem em aberto',
    no_completed_trips: 'Nenhuma viagem concluída',
    create_first_trip: 'Crie sua primeira viagem!',
    finish_trip_hint: 'Finalize uma viagem para ver aqui.',
    days_between_trips: '{count} {count, =1{dia} other{dias}} entre viagens',
    no_flights: 'Nenhum voo cadastrado',
    no_accommodations: 'Nenhuma hospedagem cadastrada',
    no_expenses: 'Nenhum gasto registrado ainda',
    arrival_before_departure: 'A data/hora de chegada deve ser posterior à de saída.',
    checkout_before_checkin: 'A data de check-out deve ser igual ou posterior ao check-in.',
    end_before_start: 'A data de volta deve ser igual ou posterior à data de ida.',
    sync_failure: 'Falha ao sincronizar. Dados podem ter sido perdidos.',
    offline_label: 'Você está offline',
    syncing_label: 'Sincronizando ({count})...',
  },
  en: {
    permission_needed_title: 'Permission required',
    permission_needed_body: 'We need access to your gallery to choose a photo.',
    attention_title: 'Attention',
    error_title: 'Error',
    confirm_delete_expense_title: 'Delete expense',
    confirm_delete_expense_body: 'Remove this expense?',
    confirm_delete_expense_second_title: 'Confirm deletion',
    confirm_delete_expense_second_body: 'This action cannot be undone. Delete it?',
    confirm_delete_flight_title: 'Delete flight',
    confirm_delete_flight_body: 'Are you sure you want to delete this flight?',
    confirm_delete_accommodation_title: 'Delete accommodation',
    confirm_delete_accommodation_body: 'Are you sure you want to delete this accommodation?',
    confirm_delete_trip_title: 'Delete trip',
    confirm_delete_trip_body: 'Are you sure?',
    cancel_label: 'Cancel',
    delete_label: 'Delete',
    required_trip_fields: 'Please enter the trip name and destination.',
    invalid_departure_date: 'Invalid departure date. Use your device local format.',
    invalid_return_date: 'Invalid return date. Use your device local format.',
    invalid_departure_datetime: 'Invalid departure date/time. Use your device local format.',
    invalid_arrival_datetime: 'Invalid arrival date/time. Use your device local format.',
    invalid_checkin_date: 'Invalid check-in date. Use your device local format.',
    invalid_checkout_date: 'Invalid check-out date. Use your device local format.',
    invalid_checkin_time: 'Invalid check-in time. Use HH:mm.',
    invalid_checkout_time: 'Invalid check-out time. Use HH:mm.',
    required_flight_fields: 'Please fill in the required flight fields.',
    required_accommodation_fields: 'Please enter the accommodation name and location.',
    invalid_amount: 'Enter a valid amount.',
    save_failed: 'Unable to save.',
    create_account_title: 'Account created!',
    create_account_body: 'Check your email to confirm.',
    generic_error: 'Something went wrong.',
    session_expired: 'Session expired.',
    save_flight_failed: 'Unable to save the flight.',
    delete_flight_failed: 'Unable to delete the flight.',
    save_accommodation_failed: 'Unable to save the accommodation.',
    delete_accommodation_failed: 'Unable to delete the accommodation.',
    delete_trip_failed: 'Unable to delete.',
    required_auth_fields: 'Please enter email and password.',
    confirm_delete_itinerary_title: 'Delete item',
    confirm_delete_itinerary_body: 'Are you sure you want to delete this itinerary item?',
    required_itinerary_fields: 'Please fill in the item title.',
    save_itinerary_failed: 'Unable to save the itinerary item.',
    delete_itinerary_failed: 'Unable to delete the itinerary item.',
    invalid_itinerary_date: 'Invalid item date. Use your device local format.',
    invalid_itinerary_time: 'Invalid item time. Use HH:mm.',
    reset_password_title: 'Email sent',
    reset_password_body: 'Check your inbox to reset your password.',
    reset_password_empty: 'Enter your email to recover your password.',
    invalid_email: 'Please enter a valid email.',
    password_too_short: 'Password must be at least 6 characters.',
    required_name: 'Please enter a display name.',
    completed_badge: 'Completed',
    no_date_badge: 'No date',
    today_badge: 'Today',
    days_remaining_one: '1 day left',
    days_remaining_other: '{count} days left',
    trips_load_error: 'Failed to load trips.',
    planned_trips_tab: 'Planned trips',
    completed_trips_tab: 'Completed trips',
    no_open_trips: 'No open trips',
    no_completed_trips: 'No completed trips',
    create_first_trip: 'Create your first trip!',
    finish_trip_hint: 'Complete a trip to see it here.',
    days_between_trips: '{count} {count, =1{day} other{days}} between trips',
    no_flights: 'No flights added',
    no_accommodations: 'No accommodations added',
    no_expenses: 'No expenses recorded yet',
    arrival_before_departure: 'Arrival date/time must be after departure.',
    checkout_before_checkin: 'Check-out date must be on or after check-in.',
    end_before_start: 'Return date must be on or after departure date.',
    sync_failure: 'Sync failed. Data may have been lost.',
    offline_label: 'You are offline',
    syncing_label: 'Syncing ({count})...',
  },
}

export function getDeviceLocale() {
  return 'pt-BR'
}

function getLanguage() {
  const locale = getDeviceLocale().toLowerCase()
  return locale.startsWith('pt') ? 'pt' : 'en'
}

export function t(key: keyof LocaleStrings) {
  const lang = getLanguage()
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
}
