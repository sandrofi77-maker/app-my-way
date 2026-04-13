import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants/Colors'
import Icon from './Icon'
import SheetModal from './SheetModal'
import { showAlert } from '../lib/alert'

const C = Colors.dark

// ── Tipos ──────────────────────────────────────────────────────────
type Role = 'admin' | 'editor' | 'viewer'
type Status = 'pending' | 'accepted' | 'declined'

type Member = {
  id: string
  invited_email: string
  role: Role
  status: Status
  user_id: string | null
  invited_by: string
}

type Props = {
  visible: boolean
  onClose: () => void
  tripId: string
  tripTitle: string
  /** user_id do dono da viagem */
  ownerId: string
}

// ── Config de permissões ──────────────────────────────────────────
const ROLES: { value: Role; label: string; desc: string; icon: string; color: string }[] = [
  {
    value: 'admin',
    label: 'Administrador',
    desc: 'Pode editar, convidar e remover membros',
    icon: 'admin-panel-settings',
    color: '#5856D6',
  },
  {
    value: 'editor',
    label: 'Editor',
    desc: 'Pode editar voos, roteiro, despesas e checklist',
    icon: 'edit',
    color: '#FF9500',
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    desc: 'Somente leitura — não pode editar nada',
    icon: 'visibility',
    color: '#34C759',
  },
]

const STATUS_LABEL: Record<Status, { label: string; color: string }> = {
  pending:  { label: 'Aguardando cadastro', color: '#FF9500' },
  accepted: { label: 'Ativo',               color: '#34C759' },
  declined: { label: 'Removido',            color: C.error },
}

// ── Componente ────────────────────────────────────────────────────
export default function TripShareSheet({ visible, onClose, tripId, tripTitle, ownerId }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('editor')
  const [inviting, setInviting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Qual membro está com o popover de role aberto
  const [editingRoleFor, setEditingRoleFor] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      loadCurrentUser()
      loadMembers()
    }
  }, [visible])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  async function loadMembers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trip_members')
        .select('id, invited_email, role, status, user_id, invited_by')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMembers((data || []) as Member[])
    } catch (err: unknown) {
      showAlert('Erro', err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const isOwner = currentUserId === ownerId
  const isAdmin = isOwner || members.some(
    m => m.user_id === currentUserId && m.role === 'admin' && m.status === 'accepted'
  )

  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('Atenção', 'Digite um e-mail válido.')
      return
    }
    setInviting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')

      // Busca o user_id do convidado pelo e-mail (se já tiver conta)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      // Fallback: busca direto em auth.users via RPC se profiles não existir
      let invitedUserId: string | null = profileData?.id || null

      if (!invitedUserId) {
        const { data: rpcData } = await supabase
          .rpc('get_user_id_by_email', { p_email: email })
        invitedUserId = rpcData || null
      }

      const { error } = await supabase.from('trip_members').insert({
        trip_id: tripId,
        invited_email: email,
        role: inviteRole,
        status: 'accepted',
        user_id: invitedUserId,
        invited_by: user.id,
      })
      if (error) {
        if (error.code === '23505') {
          showAlert('Atenção', 'Este e-mail já foi convidado para essa viagem.')
        } else {
          throw error
        }
        return
      }
      setInviteEmail('')
      await loadMembers()
    } catch (err: unknown) {
      showAlert('Erro', err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setInviting(false)
    }
  }

  async function handleChangeRole(memberId: string, newRole: Role) {
    setEditingRoleFor(null)
    try {
      const { error } = await supabase
        .from('trip_members')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', memberId)
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
    } catch (err: unknown) {
      showAlert('Erro', err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  async function handleRemove(member: Member) {
    Alert.alert(
      'Remover membro',
      `Remover ${member.invited_email} da viagem?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('trip_members')
                .delete()
                .eq('id', member.id)
              if (error) throw error
              setMembers(prev => prev.filter(m => m.id !== member.id))
            } catch (err: any) {
              showAlert('Erro', err.message)
            }
          },
        },
      ]
    )
  }

  const roleConf = ROLES.find(r => r.value === inviteRole)!

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Compartilhar viagem"
      subtitle={tripTitle}
      drawerWidth={520}
    >
      {/* ── Convidar novo membro ─────────────────────────────── */}
      {isAdmin && (
        <View style={styles.inviteSection}>
          <Text style={styles.sectionLabel}>Convidar por e-mail</Text>

          <TextInput
            style={styles.emailInput}
            placeholder="email@exemplo.com"
            placeholderTextColor={C.tertiary}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Seletor de permissão */}
          <Text style={styles.rolePickerLabel}>Permissão</Text>
          <View style={styles.rolePickerRow}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleChip, inviteRole === r.value && { borderColor: r.color, backgroundColor: r.color + '18' }]}
                onPress={() => setInviteRole(r.value)}
                activeOpacity={0.8}
              >
                <Icon name={r.icon as any} size={15} color={inviteRole === r.value ? r.color : C.tertiary} />
                <Text style={[styles.roleChipText, inviteRole === r.value && { color: r.color, fontWeight: '700' }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.roleDesc}>{roleConf.desc}</Text>

          <TouchableOpacity
            style={[styles.inviteBtn, (inviting || !inviteEmail.trim()) && styles.btnDisabled]}
            onPress={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            activeOpacity={0.85}
          >
            {inviting
              ? <ActivityIndicator color="#fff" size="small" />
              : (
                <>
                  <Icon name="person-add" size={16} color="#fff" />
                  <Text style={styles.inviteBtnText}>Enviar convite</Text>
                </>
              )
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Divisor ──────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Lista de membros ─────────────────────────────────── */}
      <Text style={styles.sectionLabel}>
        {members.length === 0 ? 'Nenhum membro ainda' : `Membros (${members.length})`}
      </Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <>
          {/* Dono sempre no topo */}
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Icon name="person" size={16} color="#fff" />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberEmail} numberOfLines={1}>
                {currentUserId === ownerId ? 'Você' : 'Dono da viagem'}
              </Text>
              <Text style={styles.memberSub}>Proprietário</Text>
            </View>
            <View style={[styles.ownerBadge]}>
              <Icon name="star" size={12} color="#5856D6" />
              <Text style={styles.ownerBadgeText}>Dono</Text>
            </View>
          </View>

          {members.map(member => {
            const roleInfo = ROLES.find(r => r.value === member.role)!
            const statusInfo = STATUS_LABEL[member.status]
            const isMe = member.user_id === currentUserId
            const canManage = isAdmin && !isMe

            return (
              <View key={member.id}>
                <View style={styles.memberRow}>
                  {/* Avatar inicial */}
                  <View style={[styles.memberAvatar, { backgroundColor: roleInfo.color }]}>
                    <Text style={styles.memberAvatarText}>
                      {member.invited_email.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.invited_email}{isMe ? ' (você)' : ''}
                    </Text>
                    <View style={styles.memberMeta}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                      <Text style={[styles.memberSub, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                  </View>

                  {/* Role badge — clicável se puder gerenciar */}
                  <TouchableOpacity
                    style={[styles.roleBadge, { borderColor: roleInfo.color + '50', backgroundColor: roleInfo.color + '14' }]}
                    onPress={() => canManage && setEditingRoleFor(editingRoleFor === member.id ? null : member.id)}
                    activeOpacity={canManage ? 0.7 : 1}
                    disabled={!canManage}
                  >
                    <Icon name={roleInfo.icon as any} size={13} color={roleInfo.color} />
                    <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                    {canManage && <Icon name="expand-more" size={14} color={roleInfo.color} />}
                  </TouchableOpacity>

                  {/* Botão remover */}
                  {canManage && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(member)}>
                      <Icon name="person-remove" size={18} color={C.error} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Popover de troca de role */}
                {editingRoleFor === member.id && (
                  <View style={styles.rolePopover}>
                    <Text style={styles.rolePopoverTitle}>Alterar permissão</Text>
                    {ROLES.map(r => (
                      <TouchableOpacity
                        key={r.value}
                        style={[styles.rolePopoverItem, member.role === r.value && styles.rolePopoverItemActive]}
                        onPress={() => handleChangeRole(member.id, r.value)}
                        activeOpacity={0.8}
                      >
                        <Icon name={r.icon as any} size={18} color={r.color} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rolePopoverItemLabel}>{r.label}</Text>
                          <Text style={styles.rolePopoverItemDesc}>{r.desc}</Text>
                        </View>
                        {member.role === r.value && (
                          <Icon name="check" size={16} color={r.color} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )
          })}

          {members.length === 0 && (
            <View style={styles.emptyMembers}>
              <Icon name="group-add" size={36} color={C.tertiary} />
              <Text style={styles.emptyMembersText}>
                Nenhum membro convidado ainda.{'\n'}Use o campo acima para convidar alguém.
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── Info de permissões ───────────────────────────────── */}
      <View style={styles.permissionsInfo}>
        <Text style={styles.permissionsInfoTitle}>Sobre as permissões</Text>
        {ROLES.map(r => (
          <View key={r.value} style={styles.permInfoRow}>
            <Icon name={r.icon as any} size={15} color={r.color} />
            <Text style={styles.permInfoLabel}>{r.label}:</Text>
            <Text style={styles.permInfoDesc}>{r.desc}</Text>
          </View>
        ))}
      </View>
    </SheetModal>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Invite section
  inviteSection: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emailInput: {
    backgroundColor: C.background,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: C.primary,
    marginBottom: 14,
  },
  rolePickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.secondary,
    marginBottom: 8,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.tertiary,
  },
  roleDesc: {
    fontSize: 12,
    color: C.secondary,
    marginTop: 8,
    marginBottom: 14,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  btnDisabled: { opacity: 0.5 },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Divider
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },

  // Members
  loadingWrap: { alignItems: 'center', paddingVertical: 24 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  memberAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  memberInfo: { flex: 1, gap: 2 },
  memberEmail: { fontSize: 14, fontWeight: '600', color: C.primary },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberSub: { fontSize: 12, color: C.secondary },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // Owner badge
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5856D633',
    backgroundColor: '#5856D614',
  },
  ownerBadgeText: { fontSize: 11, fontWeight: '700', color: '#5856D6' },

  // Role badge
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },

  // Remove button
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF3B3014',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Role popover
  rolePopover: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  rolePopoverTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  rolePopoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  rolePopoverItemActive: { backgroundColor: C.background },
  rolePopoverItemLabel: { fontSize: 14, fontWeight: '600', color: C.primary },
  rolePopoverItemDesc: { fontSize: 12, color: C.secondary, marginTop: 1 },

  // Empty
  emptyMembers: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyMembersText: { fontSize: 13, color: C.secondary, textAlign: 'center', lineHeight: 20 },

  // Permissions info
  permissionsInfo: {
    marginTop: 20,
    backgroundColor: C.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    gap: 8,
  },
  permissionsInfoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  permInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permInfoLabel: { fontSize: 12, fontWeight: '700', color: C.secondary, width: 110 },
  permInfoDesc: { fontSize: 12, color: C.tertiary, flex: 1 },
})
