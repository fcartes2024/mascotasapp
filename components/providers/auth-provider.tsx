'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type UserRole = 'admin' | 'fundacion' | 'usuario'

export type User = {
  id?: number
  name: string
  email: string
  role: UserRole
  avatar?: string
  foundationName?: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    foundationName?: string,
  ) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'huellas-que-unen-auth'
const VALID_ROLES: UserRole[] = ['admin', 'fundacion', 'usuario']

export function isUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole)
}

export function safeRole(role: unknown): UserRole {
  return isUserRole(role) ? role : 'usuario'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<User>
        if (parsed.name && parsed.email) {
          const u: User = {
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            role: safeRole(parsed.role),
            avatar: parsed.avatar,
            foundationName: parsed.foundationName,
          }
          setUser(u)
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user, loaded])

  async function login(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json()) as { ok: boolean; user?: User; error?: string }
      if (!data.ok) {
        return { ok: false, error: data.error ?? 'Credenciales inválidas.' }
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: safeRole(data.user.role),
          avatar: data.user.avatar,
          foundationName: data.user.foundationName,
        })
      }
      return { ok: true }
    } catch (err) {
      console.error('[auth login]', err)
      return { ok: false, error: 'Error al conectar con el servidor.' }
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: UserRole = 'usuario',
    foundationName?: string,
  ) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, foundationName }),
      })
      const data = (await res.json()) as { ok: boolean; user?: User; error?: string }
      if (!data.ok) {
        return { ok: false, error: data.error ?? 'No se pudo crear la cuenta.' }
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: safeRole(data.user.role),
          avatar: data.user.avatar,
          foundationName: data.user.foundationName,
        })
      }
      return { ok: true }
    } catch (err) {
      console.error('[auth register]', err)
      return { ok: false, error: 'Error al conectar con el servidor.' }
    }
  }

  function logout() {
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  fundacion: 'Fundación',
  usuario: 'Adoptante',
}

export const roleBadge: Record<UserRole, { bg: string; text: string; dot: string }> = {
  admin: { bg: 'bg-[#25302b]', text: 'text-[#fffaf5]', dot: 'bg-[#f4b08f]' },
  fundacion: { bg: 'bg-[#e6eee1]', text: 'text-[#52705a]', dot: 'bg-[#52705a]' },
  usuario: { bg: 'bg-[#ead9c6]', text: 'text-[#9a624b]', dot: 'bg-[#e56c4c]' },
}
