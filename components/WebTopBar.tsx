import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { usePathname, router } from 'expo-router'
import CachedImage from './CachedImage'
import { Colors } from '../constants/Colors'
import Icon from './Icon'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StatsSheet from './StatsSheet'
import ProfileSheet from './ProfileSheet'

const C = Colors.dark

type NavItem = {
  label: string
  icon: React.ComponentProps<typeof Icon>['name']
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Minhas Viagens', icon: 'flight', path: '/(tabs)/home' },
]

export default function WebTopBar() {
  const pathname = usePathname()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || '')
        const name = (data.user.user_metadata?.full_name as string | undefined)
          || (data.user.user_metadata?.display_name as string | undefined)
          || data.user.email?.split('@')[0]
          || ''
        setUserName(name)
        const raw = (data.user.user_metadata?.avatar_url as string | undefined) || null
        setAvatarUrl(raw?.startsWith('https://') ? raw : null)
      }
    })
  }, [])

  function isActive(path: string) {
    if (path === '/(tabs)/home') return pathname === '/home' || pathname === '/(tabs)/home' || pathname === '/'
    return pathname.startsWith(path)
  }

  const initials = userName ? userName.charAt(0).toUpperCase() : '?'

  return (
    <>
      <View style={styles.bar}>
        {/* Logo */}
        <TouchableOpacity style={styles.logo} onPress={() => router.push('/(tabs)/home' as any)} activeOpacity={0.8}>
          <View style={styles.logoIcon}>
            <Icon name="flight" size={18} color="#fff" />
          </View>
          <Text style={styles.logoText}>MyWay</Text>
        </TouchableOpacity>

        {/* Nav central */}
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <TouchableOpacity
                key={item.path}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => router.push(item.path as any)}
                activeOpacity={0.7}
              >
                <Icon name={item.icon} size={16} color={active ? C.primary : C.tertiary} />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            )
          })}
          {/* Estatísticas abre drawer */}
          <TouchableOpacity
            style={[styles.navItem, showStats && styles.navItemActive]}
            onPress={() => setShowStats(true)}
            activeOpacity={0.7}
          >
            <Icon name="bar-chart" size={16} color={showStats ? C.primary : C.tertiary} />
            <Text style={[styles.navLabel, showStats && styles.navLabelActive]}>Estatísticas</Text>
          </TouchableOpacity>
        </View>

        {/* Direita: saudação + avatar */}
        <TouchableOpacity style={styles.userArea} onPress={() => setShowProfile(true)} activeOpacity={0.8}>
          <Text style={styles.greeting}>
            Olá, <Text style={styles.greetingName}>{userName || 'viajante'}</Text>
          </Text>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <CachedImage uri={avatarUrl} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <StatsSheet visible={showStats} onClose={() => setShowStats(false)} />
      <ProfileSheet visible={showProfile} onClose={() => setShowProfile(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 28,
    height: 60,
    gap: 16,
  },

  // Logo
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },

  // Nav
  nav: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  navItemActive: { backgroundColor: C.surfaceHigh },
  navLabel: { fontSize: 14, fontWeight: '500', color: C.tertiary },
  navLabelActive: { color: C.primary, fontWeight: '700' },

  // User
  userArea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 13, color: C.secondary },
  greetingName: { fontWeight: '700', color: C.primary },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
