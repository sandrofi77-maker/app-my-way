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
