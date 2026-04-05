import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { usePathname, router } from 'expo-router'
import { Colors } from '../constants/Colors'
import Icon from './Icon'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = Colors.dark

type NavItem = {
  label: string
  icon: React.ComponentProps<typeof Icon>['name']
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Minhas Viagens', icon: 'flight', path: '/(tabs)/home' },
  { label: 'Estatísticas', icon: 'bar-chart', path: '/stats' },
  { label: 'Perfil', icon: 'person', path: '/profile' },
]

export default function WebSidebar({ width }: { width: number }) {
  const pathname = usePathname()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || '')
        setUserName(data.user.user_metadata?.name || data.user.email?.split('@')[0] || '')
      }
    })
  }, [])

  function isActive(path: string) {
    if (path === '/(tabs)/home') return pathname === '/home' || pathname === '/(tabs)/home' || pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <View style={[styles.container, { width }]}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Icon name="flight" size={22} color="#fff" />
        </View>
        <Text style={styles.logoText}>MyWay</Text>
      </View>

      {/* Navigation */}
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
              <Icon name={item.icon} size={20} color={active ? C.primary : C.tertiary} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* User */}
      <View style={styles.userSection}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {userName ? userName[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderRightWidth: 1,
    borderRightColor: C.border,
    paddingVertical: 24,
    justifyContent: 'flex-start',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.5,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: C.surfaceHigh,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: C.tertiary,
  },
  navLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  userEmail: {
    fontSize: 11,
    color: C.tertiary,
  },
})
