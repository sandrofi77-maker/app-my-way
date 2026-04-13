import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useState } from 'react'
import Icon from './Icon'
import SheetModal from './SheetModal'
import ImagePickerComponent from './ImagePicker'
import { Colors } from '../constants/Colors'
import { t } from '../lib/i18n'
import { applyDateMask, applyTimeMask, formatDateForInput, getLocalDatePlaceholder, getLocalTimePlaceholder, toISODateOrNull, toTimeOrNull } from '../lib/date-locale'
import { showAlert } from '../lib/alert'
import { supabase } from '../lib/supabase'
import type { Accommodation } from '../types'

const C = Colors.dark
const datePlaceholder = getLocalDatePlaceholder()
const timePlaceholder = getLocalTimePlaceholder()

type Props = {
  visible: boolean
  tripId: string
  editingAccommodation: Accommodation | null
  onClose: () => void
  onSaved: () => void
}

export default function AccommodationFormModal({ visible, tripId, editingAccommodation, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [link, setLink] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [description, setDescription] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (visible && name === '' && editingAccommodation) {
    setName(editingAccommodation.name || '')
    setLocation(editingAccommodation.location || '')
    setLink(editingAccommodation.link || '')
    setCheckInDate(formatDateForInput(editingAccommodation.check_in_date))
    setCheckOutDate(formatDateForInput(editingAccommodation.check_out_date))
    setCheckIn(editingAccommodation.check_in_time || '')
    setCheckOut(editingAccommodation.check_out_time || '')
    setDescription(editingAccommodation.description || '')
    setImageUri(editingAccommodation.image_url || null)
  }

  function resetForm() {
    setName(''); setLocation(''); setLink('')
    setCheckInDate(''); setCheckOutDate('')
    setCheckIn(''); setCheckOut('')
    setDescription(''); setImageUri(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSave() {
    if (!name.trim() || !location.trim()) {
      showAlert(t('attention_title'), t('required_accommodation_fields'))
      return
    }

    const ciDate = toISODateOrNull(checkInDate)
    const coDate = toISODateOrNull(checkOutDate)
    const ci = toTimeOrNull(checkIn)
    const co = toTimeOrNull(checkOut)

    if (checkInDate.trim() && !ciDate) { showAlert(t('attention_title'), t('invalid_checkin_date')); return }
    if (checkOutDate.trim() && !coDate) { showAlert(t('attention_title'), t('invalid_checkout_date')); return }
    if (checkIn.trim() && !ci) { showAlert(t('attention_title'), t('invalid_checkin_time')); return }
    if (checkOut.trim() && !co) { showAlert(t('attention_title'), t('invalid_checkout_time')); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        trip_id: tripId,
        user_id: user?.id,
        name: name.trim(),
        location: location.trim(),
        link: link.trim() || null,
        check_in_date: ciDate,
        check_out_date: coDate,
        check_in_time: ci,
        check_out_time: co,
        description: description.trim() || null,
        image_url: imageUri || null,
      }

      const request = editingAccommodation
        ? supabase.from('accommodations').update(payload).eq('id', editingAccommodation.id)
        : supabase.from('accommodations').insert(payload)

      const { error } = await request
      if (error) throw error

      resetForm()
      onSaved()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('save_accommodation_failed')
      showAlert(t('error_title'), message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingAccommodation) return

    showAlert(t('confirm_delete_accommodation_title'), t('confirm_delete_accommodation_body'), [
      { text: t('cancel_label'), style: 'cancel' },
      {
        text: t('delete_label'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            const { error } = await supabase.from('accommodations').delete().eq('id', editingAccommodation.id)
            if (error) throw error
            resetForm()
            onSaved()
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('delete_accommodation_failed')
            showAlert(t('error_title'), message)
          } finally {
            setDeleting(false)
          }
        }
      }
    ])
  }

  return (
    <SheetModal
      visible={visible}
      onClose={handleClose}
      title={editingAccommodation ? 'Editar hospedagem' : 'Nova hospedagem'}
      subtitle="Preencha os dados da hospedagem"
      onDelete={editingAccommodation ? handleDelete : undefined}
      deleteDisabled={deleting || saving}
    >
      <Text style={styles.label}>Imagem do local</Text>
      <ImagePickerComponent imageUri={imageUri} onImageSelected={setImageUri} uploadFolder="accommodations" onUploadingChange={setImageUploading} />

      <Text style={styles.label}>Nome *</Text>
      <View style={styles.inputRow}>
        <Icon name="hotel" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder="Ex: Hotel Central" placeholderTextColor={C.tertiary} value={name} onChangeText={setName} accessibilityLabel="Nome da hospedagem" />
      </View>

      <Text style={styles.label}>Local *</Text>
      <View style={styles.inputRow}>
        <Icon name="location-on" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder="Ex: Lisboa, Portugal" placeholderTextColor={C.tertiary} value={location} onChangeText={setLocation} accessibilityLabel="Localização" />
      </View>

      <Text style={styles.label}>Link</Text>
      <View style={styles.inputRow}>
        <Icon name="link" size={20} color={C.secondary} />
        <TextInput style={styles.input} placeholder="https://..." placeholderTextColor={C.tertiary} value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" accessibilityLabel="Link da reserva" />
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Data check-in</Text>
          <View style={styles.inputRow}>
            <Icon name="calendar-today" size={16} color={C.secondary} />
            <TextInput style={styles.input} placeholder={datePlaceholder} placeholderTextColor={C.tertiary} value={checkInDate} onChangeText={(v) => setCheckInDate(applyDateMask(v))} keyboardType="numeric" accessibilityLabel="Data de check-in" />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Horario check-in</Text>
          <View style={styles.inputRow}>
            <Icon name="schedule" size={16} color={C.secondary} />
            <TextInput style={styles.input} placeholder={timePlaceholder} placeholderTextColor={C.tertiary} value={checkIn} onChangeText={(v) => setCheckIn(applyTimeMask(v))} keyboardType="numeric" accessibilityLabel="Horário de check-in" />
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Data check-out</Text>
          <View style={styles.inputRow}>
            <Icon name="calendar-today" size={16} color={C.secondary} />
            <TextInput style={styles.input} placeholder={datePlaceholder} placeholderTextColor={C.tertiary} value={checkOutDate} onChangeText={(v) => setCheckOutDate(applyDateMask(v))} keyboardType="numeric" accessibilityLabel="Data de check-out" />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Horario check-out</Text>
          <View style={styles.inputRow}>
            <Icon name="schedule" size={16} color={C.secondary} />
            <TextInput style={styles.input} placeholder={timePlaceholder} placeholderTextColor={C.tertiary} value={checkOut} onChangeText={(v) => setCheckOut(applyTimeMask(v))} keyboardType="numeric" accessibilityLabel="Horário de check-out" />
          </View>
        </View>
      </View>

      <Text style={styles.label}>Descricao</Text>
      <View style={[styles.inputRow, styles.inputRowMultiline]}>
        <Icon name="notes" size={20} color={C.secondary} />
        <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Detalhes da hospedagem" placeholderTextColor={C.tertiary} value={description} onChangeText={setDescription} multiline accessibilityLabel="Descrição" />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving || deleting || imageUploading} accessibilityRole="button" accessibilityLabel={editingAccommodation ? 'Salvar edição' : 'Salvar hospedagem'}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{editingAccommodation ? 'Salvar edicao' : 'Salvar hospedagem'}</Text>}
      </TouchableOpacity>
    </SheetModal>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 4, marginBottom: 8, marginTop: 16 },
  inputRow: { backgroundColor: C.surfaceHigh, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4 },
  inputRowMultiline: { alignItems: 'flex-start', paddingVertical: 14 },
  input: { flex: 1, fontSize: 15, color: C.primary, marginLeft: 10, paddingVertical: 14, padding: 0 },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingVertical: 0 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  primaryBtn: {
    backgroundColor: C.buttonPrimary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 24,
    shadowColor: C.buttonPrimary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
