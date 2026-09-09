
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Crown,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  PawPrint,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import { useAuth, type UserRole } from '@/components/providers/auth-provider'

type AccountType = {
  value: UserRole
  label: string
  description: string
  icon: React.ReactNode
  tone: string
  borderActive: string
}

const accountTypes: AccountType[] = [
  {
    value: 'usuario',
    label: 'Adoptante',
    description: 'Busco una mascota para mi familia',
    icon: <UserIcon size={20} />,
    tone: 'bg-[#ead9c6] text-[#9a624b]',
    borderActive: 'ring-2 ring-[#e56c4c] border-transparent',
  },
  {
    value: 'fundacion',
    label: 'Fundación / Refugio',
    description: 'Quiero publicar mascotas en adopción',
    icon: <Building2 size={20} />,
    tone: 'bg-[#e6eee1] text-[#52705a]',
    borderActive: 'ring-2 ring-[#52705a] border-transparent',
  },
]

type DemoAccount = {
  email: string
  password: string
  role: UserRole
  label: string
  description: string
  tone: string
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@huellas.com',
    password: 'admin1234',
    role: 'admin',
    label: 'Administrador',
    description: 'Panel de control total',
    tone: 'bg-[#25302b] text-[#fffaf5]',
  },
  {
    email: 'hola@patitasfelices.org',
    password: 'fundacion123',
    role: 'fundacion',
    label: 'Fundación',
    description: 'Gestiona tus mascotas',
    tone: 'bg-[#e6eee1] text-[#52705a]',
  },
  {
    email: 'maria@ejemplo.com',
    password: 'hola1234',
    role: 'usuario',
    label: 'Adoptante',
    description: 'Explora y adopta',
    tone: 'bg-[#ead9c6] text-[#9a624b]',
  },
]

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Crown size={12} />,
  fundacion: <Building2 size={12} />,
  usuario: <UserIcon size={12} />,
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountRole, setAccountRole] = useState<UserRole>('usuario')
  const [foundationName, setFoundationName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login, register } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password, accountRole, accountRole === 'fundacion' ? foundationName : undefined)
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Ocurrió un error')
      return
    }
    router.push('/')
  }

  function fillDemo(demo: DemoAccount) {
    setMode('login')
    setEmail(demo.email)
    setPassword(demo.password)
    setError(null)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f6f1] text-[#25302b]">
      <div className="absolute -left-20 top-20 size-72 rounded-full bg-[#ead9c6] blur-3xl opacity-70" />
      <div className="absolute -right-20 bottom-20 size-72 rounded-full bg-[#d9e2d3] blur-3xl opacity-70" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e56c4c] via-[#e8a18a] to-[#ead9c6]" />
          <img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=85"
            alt="Perro sonriendo"
            className="relative h-full w-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="relative flex h-full flex-col justify-between p-12 text-[#fffaf5]">
            <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#fffaf5] text-[#e56c4c]">
                <PawPrint size={18} fill="currentColor" />
              </span>
              <span className="text-lg">Huellas que unen</span>
            </Link>
            <div className="max-w-md">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#fffaf5]/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur">
                <Sparkles size={14} /> Bienvenido de vuelta
              </div>
              <h1 className="font-serif text-5xl leading-[1] tracking-[-0.04em]">
                Un <em className="not-italic text-[#fff3e9]">hogar</em> para tu corazón.
              </h1>
              <p className="mt-6 text-lg leading-7 text-[#fff3e9]/80">
                Ingresa como adoptante, fundación o administrador. Cada rol contribuye
                a encontrar un hogar para quien más lo necesita.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=85',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=85',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=85',
                  ].map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="size-10 rounded-full border-2 border-[#fffaf5] object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#fff3e9]/80">
                  <strong className="text-[#fffaf5]">2,400+</strong> familias ya encontraron
                  a su compañero.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#fff3e9]/70">
              <Heart size={14} fill="currentColor" className="text-[#fffaf5]" />
              Hecho con cariño para quienes dan una segunda oportunidad.
            </div>
          </div>
        </div>

        <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#e56c4c] text-[#fffaf5]">
                <PawPrint size={18} fill="currentColor" />
              </span>
              <span className="text-lg">Huellas que unen</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 rounded-full border border-[#dfe2dc] px-4 py-2 text-sm font-medium text-[#68716b]"
            >
              <ArrowLeft size={14} /> Volver
            </Link>
          </div>

          <div className="hidden lg:block">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#68716b] transition hover:text-[#25302b]"
            >
              <ArrowLeft size={16} /> Volver al inicio
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-md">
              <div className="mb-6">
                <h2 className="font-serif text-4xl tracking-[-0.03em] text-[#25302b]">
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}
                </h2>
                <p className="mt-2 text-[#68716b]">
                  {mode === 'login'
                    ? 'Ingresa con tu cuenta para continuar.'
                    : 'Elige el tipo de cuenta que mejor se adapte a ti.'}
                </p>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#f0f1ed] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === 'login'
                      ? 'bg-[#fffaf5] text-[#25302b] shadow-sm'
                      : 'text-[#68716b] hover:text-[#25302b]'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setError(null)
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === 'register'
                      ? 'bg-[#fffaf5] text-[#25302b] shadow-sm'
                      : 'text-[#68716b] hover:text-[#25302b]'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>

              {mode === 'register' && (
                <div className="mb-5 space-y-2">
                  <label className="text-sm font-semibold text-[#25302b]">Tipo de cuenta</label>
                  <div className="grid gap-2">
                    {accountTypes.map((acc) => (
                      <button
                        key={acc.value}
                        type="button"
                        onClick={() => setAccountRole(acc.value)}
                        className={`flex items-center gap-3 rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] p-3.5 text-left transition ${
                          accountRole === acc.value ? acc.borderActive : 'hover:border-[#cfd4cf]'
                        }`}
                      >
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${acc.tone}`}>
                          {acc.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#25302b]">{acc.label}</p>
                          <p className="text-xs text-[#68716b]">{acc.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-semibold text-[#25302b]">
                        {accountRole === 'fundacion' ? 'Nombre de contacto' : 'Nombre completo'}
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={accountRole === 'fundacion' ? 'Ej. Ana Morales' : 'Ej. Ana Morales'}
                        className="w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#9da49f] focus:border-[#e56c4c] focus:ring-4 focus:ring-[#e56c4c]/10"
                      />
                    </div>
                    {accountRole === 'fundacion' && (
                      <div className="space-y-2">
                        <label htmlFor="foundationName" className="text-sm font-semibold text-[#25302b]">
                          Nombre de la fundación o refugio
                        </label>
                        <input
                          id="foundationName"
                          type="text"
                          required
                          value={foundationName}
                          onChange={(e) => setFoundationName(e.target.value)}
                          placeholder="Ej. Patitas Felices A.C."
                          className="w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#9da49f] focus:border-[#52705a] focus:ring-4 focus:ring-[#52705a]/10"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-[#25302b]">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#9da49f] focus:border-[#e56c4c] focus:ring-4 focus:ring-[#e56c4c]/10"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-semibold text-[#25302b]">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs font-semibold text-[#e56c4c] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-[#9da49f] focus:border-[#e56c4c] focus:ring-4 focus:ring-[#e56c4c]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#87918a] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-[#fde4dc] bg-[#fdf0ea] px-4 py-3 text-sm font-medium text-[#cf593d]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e56c4c] px-6 py-3.5 text-sm font-semibold text-[#fffaf5] shadow-lg shadow-[#e56c4c]/20 transition hover:-translate-y-0.5 hover:bg-[#cf593d] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Cargando...
                    </>
                  ) : mode === 'login' ? (
                    'Iniciar sesión'
                  ) : (
                    'Crear mi cuenta'
                  )}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#dfe2dc]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#f8f6f1] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#9da49f]">
                      O continúa con
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#25302b] transition hover:bg-[#f8f6f1]"
                  >
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.1-3.9 9.1-9.4 0-.6-.1-1.1-.2-1.6H12z"
                      />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#25302b] transition hover:bg-[#f8f6f1]"
                  >
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .3c5.3 0 9.6 4.3 9.6 9.6 0 4.2-2.7 7.8-6.5 9.1-.5.1-.6-.2-.6-.5v-2.1c2.7.6 3.2-1.3 3.2-1.3.4-1.2 1.1-1.5 1.1-1.5.9-.6.1-.6.1-.6-1 .1-1.5 1-1.5 1-.9 1.5-2.3 1.1-2.9.8-.1-.6.3-1.1.6-1.4-2.1-.2-4.3-1.1-4.3-4.7 0-1 .4-1.9 1-2.5-.1-.2-.5-1.2.1-2.5 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.3.2 2.3.1 2.5.6.6 1 1.5 1 2.5 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.7c0 .3-.1.6-.6.5C5.1 17.7 2.4 14.1 2.4 9.9 2.4 4.6 6.7.3 12 .3z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                <p className="pt-2 text-center text-sm text-[#68716b]">
                  {mode === 'login' ? (
                    <>
                      ¿No tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register')
                          setError(null)
                        }}
                        className="font-semibold text-[#e56c4c] hover:underline"
                      >
                        Regístrate
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login')
                          setError(null)
                        }}
                        className="font-semibold text-[#e56c4c] hover:underline"
                      >
                        Inicia sesión
                      </button>
                    </>
                  )}
                </p>
              </form>

              <div className="mt-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">
                  💡 Prueba con una cuenta demo
                </p>
                <div className="grid gap-2">
                  {demoAccounts.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => fillDemo(demo)}
                      className="group flex items-center gap-3 rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] p-3 text-left transition hover:border-[#e56c4c]/60 hover:bg-[#fff5f0]"
                    >
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${demo.tone}`}>
                        {roleIcons[demo.role]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#25302b]">{demo.label}</p>
                        </div>
                        <p className="truncate text-xs text-[#68716b]">{demo.description} · {demo.email}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f8f6f1] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#87918a] transition group-hover:bg-[#e56c4c] group-hover:text-[#fffaf5]">
                        Usar
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
