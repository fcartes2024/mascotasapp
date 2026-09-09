'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  Crown,
  FileText,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  ListPlus,
  LogOut,
  MapPin,
  PawPrint,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Syringe,
  TrendingUp,
  User,
  Users,
  Weight,
  X,
} from 'lucide-react'
import { useAuth, roleLabels, roleBadge, safeRole, type UserRole } from '@/components/providers/auth-provider'
import PanelUsuario from '@/components/panels/PanelUsuario'
import PanelFundacion from '@/components/panels/PanelFundacion'
import PanelAdmin from '@/components/panels/PanelAdmin'
import PetFilterModal from '@/components/pets/PetFilterModal'
import HelpModal from '@/components/home/HelpModal'
import { mergeCatalogPets } from '@/lib/fallback-pets'

type Pet = {
  id?: number
  name: string
  type: 'Perro' | 'Gato'
  age: string
  location: string
  image: string
  tone: string
  breed: string | null
  gender: 'Macho' | 'Hembra' | null
  weight: string | null
  vaccinated: boolean
  sterilized: boolean
  personality: string[]
  about: string | null
  good_with: string[]
  energy: 'Baja' | 'Media' | 'Alta' | null
}

function ageNum(ageStr: string): number {
  const match = ageStr.match(/(\d+)/)
  if (!match) return 0
  const num = parseInt(match[1])
  if (/mes|cachorro/i.test(ageStr) && ageStr.includes('mes')) return num / 12
  return num
}

function getAgeCategory(ageYears: number): 'cachorro' | 'joven' | 'adulto' | 'senior' {
  if (ageYears < 1) return 'cachorro'
  if (ageYears < 3) return 'joven'
  if (ageYears < 7) return 'adulto'
  return 'senior'
}

export default function Page() {
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [adoptModalOpen, setAdoptModalOpen] = useState(false)
  const [adoptSubmitting, setAdoptSubmitting] = useState(false)
  const [adoptForm, setAdoptForm] = useState<{
    message: string
    housingType: '' | 'casa' | 'departamento'
    hasPatio: '' | 'si' | 'no'
    hasOtherPets: '' | 'si' | 'no'
    otherPetsCount: string
    householdSize: string
    homePhotos: string[]
  }>({
    message: '',
    housingType: '',
    hasPatio: '',
    hasOtherPets: '',
    otherPetsCount: '',
    householdSize: '',
    homePhotos: [],
  })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [pets, setPets] = useState<Pet[]>([])
  const [petsLoading, setPetsLoading] = useState(true)
  const [usuarioTab, setUsuarioTab] = useState<'favoritos' | 'solicitudes' | 'perfil'>('favoritos')
  const [fundacionTab, setFundacionTab] = useState<'solicitudes' | 'mascotas' | 'refugio'>('solicitudes')
  const [adminTab, setAdminTab] = useState<'solicitudes' | 'fundaciones' | 'reportes'>('solicitudes')
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({})
  const [publishNonce, setPublishNonce] = useState(0)
  const [favoritePetIds, setFavoritePetIds] = useState<Set<number>>(new Set())
  const [userRequests, setUserRequests] = useState<any[]>([])
  const [userLatestVisit, setUserLatestVisit] = useState<any | null>(null)
  const [visitModalOpen, setVisitModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const router = useRouter()

  async function loadPets() {
    try {
      const res = await fetch('/api/pets')
      const data = (await res.json()) as { ok: boolean; pets?: Pet[] }
      if (data.ok && data.pets) {
        setPets(mergeCatalogPets(data.pets) as Pet[])
      } else {
        setPets(mergeCatalogPets([]) as Pet[])
      }
    } catch (err) {
      console.error('[load pets]', err)
      setPets(mergeCatalogPets([]) as Pet[])
    } finally {
      setPetsLoading(false)
    }
  }

  async function loadFavorites() {
    if (!user) return
    try {
      const res = await fetch(`/api/favorites?user_email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (data.ok && data.favorites) {
        const ids = new Set<number>(data.favorites.map((f: any) => f.pet_id))
        setFavoritePetIds(ids)
      }
    } catch (err) {
      console.error('[load favorites]', err)
    }
  }

  async function loadUserRequests() {
    if (!user || user.role !== 'usuario') return
    try {
      const res = await fetch(`/api/requests?user_email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (!data.ok) return
      const list = Array.isArray(data.requests) ? data.requests : []
      setUserRequests(list)
      const scheduled = list
        .filter((r: any) => r?.scheduled_date)
        .sort((a: any, b: any) => String(b.scheduled_date).localeCompare(String(a.scheduled_date)))
      setUserLatestVisit(scheduled[0] ?? null)
    } catch (err) {
      console.error('[load user requests]', err)
    }
  }

  async function refetchPets() {
    await loadPets()
  }

  useEffect(() => {
    loadPets()
    if (user) {
      loadFavorites()
      loadUserRequests()
    } else {
      setUserRequests([])
      setUserLatestVisit(null)
    }
  }, [user?.email])

  const hasActiveFilters = useMemo(() => {
    return filter !== 'Todos' || query.trim() !== '' || Object.keys(appliedFilters).length > 0
  }, [filter, query, appliedFilters])

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      if (filter !== 'Todos' && pet.type !== filter) return false
      if (query && !pet.name.toLowerCase().includes(query.toLowerCase())) return false

      if (appliedFilters.type && pet.type !== appliedFilters.type) return false
      if (appliedFilters.gender && pet.gender !== appliedFilters.gender) return false
      if (appliedFilters.vaccinated !== undefined && pet.vaccinated !== appliedFilters.vaccinated) return false
      if (appliedFilters.sterilized !== undefined && pet.sterilized !== appliedFilters.sterilized) return false
      if (appliedFilters.energy && pet.energy !== appliedFilters.energy) return false
      if (appliedFilters.location && !pet.location.toLowerCase().includes(String(appliedFilters.location).toLowerCase())) return false
      if (appliedFilters.breed) {
        const breedStr = pet.breed ?? ''
        if (!breedStr.toLowerCase().includes(appliedFilters.breed.toLowerCase())) return false
      }
      if (appliedFilters.goodWith && Array.isArray(appliedFilters.goodWith)) {
        for (const gw of appliedFilters.goodWith) {
          const needle = String(gw).toLowerCase()
          const ok = pet.good_with.some((item) => item.toLowerCase().includes(needle) || needle.includes(item.toLowerCase()))
          if (!ok) return false
        }
      }
      if (appliedFilters.ageRange) {
        const years = ageNum(pet.age)
        const cat = getAgeCategory(years)
        if (cat !== appliedFilters.ageRange) return false
      }

      return true
    })
  }, [filter, query, pets, appliedFilters])

  async function toggleFavorite(petId: number) {
    if (!user) {
      router.push('/login')
      return
    }
    const isFav = favoritePetIds.has(petId)
    const newSet = new Set(favoritePetIds)
    if (isFav) {
      newSet.delete(petId)
    } else {
      newSet.add(petId)
    }
    setFavoritePetIds(newSet)
    try {
      const res = await fetch('/api/favorites', {
        method: isFav ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, pet_id: petId }),
      })
      if (!res.ok) {
        const rollback = new Set(favoritePetIds)
        setFavoritePetIds(rollback)
      }
    } catch (err) {
      const rollback = new Set(favoritePetIds)
      setFavoritePetIds(rollback)
      console.error('[toggle favorite]', err)
    }
  }

  async function handleAdopt(pet: Pet) {
    if (!user) {
      alert('Debes iniciar sesión para enviar una solicitud de adopción.')
      router.push('/login')
      return
    }
    setAdoptForm({
      message: `Me encantaría conocer a ${pet.name} y darle un hogar.`,
      housingType: '',
      hasPatio: '',
      hasOtherPets: '',
      otherPetsCount: '',
      householdSize: '',
      homePhotos: [],
    })
    setAdoptModalOpen(true)
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      reader.readAsDataURL(file)
    })
  }

  async function addHomePhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    const items = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const urls: string[] = []
    for (const f of items) {
      urls.push(await readFileAsDataUrl(f))
    }
    setAdoptForm((prev) => ({ ...prev, homePhotos: [...prev.homePhotos, ...urls] }))
  }

  async function submitAdoption(pet: Pet) {
    if (!user) return
    setAdoptSubmitting(true)
    try {
      const application = {
        housingType: adoptForm.housingType,
        hasPatio: adoptForm.hasPatio,
        hasOtherPets: adoptForm.hasOtherPets,
        otherPetsCount: adoptForm.otherPetsCount,
        householdSize: adoptForm.householdSize,
        homePhotos: adoptForm.homePhotos,
      }
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          pet_id: pet.id,
          message: adoptForm.message,
          application,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        alert('¡Solicitud enviada con éxito! La fundación se pondrá en contacto contigo pronto.')
        setAdoptModalOpen(false)
      } else {
        alert(data.error || 'Ocurrió un error al enviar la solicitud. Inténtalo de nuevo.')
      }
    } catch (err) {
      console.error('[submit adoption]', err)
      alert('Ocurrió un error al enviar la solicitud. Inténtalo de nuevo.')
    } finally {
      setAdoptSubmitting(false)
    }
  }

  function smoothScrollTo(hash: string) {
    if (typeof window !== 'undefined') {
      const id = hash.replace('#', '')
      const el = document.getElementById(id) ?? document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  function scrollToPanel(id: string) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const fallbackPet = (pet: Pet) => ({
    ...pet,
    breed: pet.breed ?? '',
    gender: pet.gender ?? ('Macho' as const),
    weight: pet.weight ?? '',
    about: pet.about ?? '',
    goodWith: pet.good_with ?? [],
    energy: pet.energy ?? ('Media' as const),
  })

  useEffect(() => {
    if (selectedPet) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedPet])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f6f1] text-[#25302b]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="#inicio" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="flex size-9 items-center justify-center rounded-full bg-[#e56c4c] text-[#fffaf5]"><PawPrint size={18} fill="currentColor" /></span><span className="text-lg">Huellas que unen</span></a>
        <div className="hidden items-center gap-8 text-sm font-medium text-[#68716b] md:flex">
          <a href="#adopta" className="text-[#25302b]">Adopta</a>
          <a href="#proceso">Cómo funciona</a>
          {user?.role === 'fundacion' && (
            <a href="#panel-fundacion" className="flex items-center gap-1.5 text-[#52705a]">
              <Building2 size={14} /> Mi refugio
            </a>
          )}
          {user?.role === 'admin' && (
            <a href="#panel-admin" className="flex items-center gap-1.5 text-[#25302b]">
              <Crown size={14} /> Admin
            </a>
          )}
          <a href="#historias">Historias</a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-full border border-[#dfe2dc] bg-[#fffaf5] py-1.5 pl-1.5 pr-3 transition hover:border-[#e56c4c]"
              >
                <span className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold text-[#fffaf5] ${user.role === 'admin' ? 'bg-[#25302b]' : user.role === 'fundacion' ? 'bg-[#52705a]' : 'bg-[#e56c4c]'}`}>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <div className="hidden items-start gap-2 text-left sm:flex sm:flex-col">
                  <span className="text-sm font-semibold leading-tight text-[#25302b]">
                    {user.name.split(' ')[0]}
                  </span>
                  {(() => {
                    const r = safeRole(user.role)
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadge[r].bg} ${roleBadge[r].text}`}
                      >
                        <span className={`size-1.5 rounded-full ${roleBadge[r].dot}`} />
                        {roleLabels[r]}
                      </span>
                    )
                  })()}
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] shadow-xl shadow-[#25302b]/10">
                  <div className="border-b border-[#dfe2dc] bg-gradient-to-br from-[#fff5f0] to-[#fffaf5] p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-12 items-center justify-center rounded-full text-base font-semibold text-[#fffaf5] ${
                          user.role === 'admin'
                            ? 'bg-[#25302b]'
                            : user.role === 'fundacion'
                              ? 'bg-[#52705a]'
                              : 'bg-[#e56c4c]'
                        }`}
                      >
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#25302b]">{user.name}</p>
                        <p className="truncate text-xs text-[#68716b]">{user.email}</p>
                        {user.foundationName && (
                          <p className="mt-1 truncate text-xs font-semibold text-[#52705a]">
                            🏠 {user.foundationName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      {(() => {
                        const r = safeRole(user.role)
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${roleBadge[r].bg} ${roleBadge[r].text}`}
                          >
                            {r === 'admin' ? (
                              <Crown size={11} />
                            ) : r === 'fundacion' ? (
                              <Building2 size={11} />
                            ) : (
                              <User size={11} />
                            )}
                            Cuenta de {roleLabels[r]}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="p-2">
                    {user.role === 'admin' && (
                      <>
                        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#87918a]">
                          Panel administrador
                        </p>
                        <a
                          href="#panel-admin"
                          onClick={(e) => {
                            e.preventDefault()
                            setAdminTab('solicitudes')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-admin-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </a>
                        <a
                          href="#panel-admin"
                          onClick={(e) => {
                            e.preventDefault()
                            setAdminTab('fundaciones')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-admin-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <Users size={16} /> Gestionar usuarios
                        </a>
                        <a
                          href="#panel-admin"
                          onClick={(e) => {
                            e.preventDefault()
                            setAdminTab('fundaciones')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-admin-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <Building2 size={16} /> Fundaciones
                        </a>
                        <a
                          href="#panel-admin"
                          onClick={(e) => {
                            e.preventDefault()
                            setAdminTab('reportes')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-admin-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <FileText size={16} /> Reportes
                        </a>
                        <a
                          href="#panel-admin"
                          onClick={(e) => {
                            e.preventDefault()
                            setAdminTab('reportes')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-admin-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <Settings size={16} /> Configuración
                        </a>
                        <div className="my-1 border-t border-[#efeff2]" />
                      </>
                    )}

                    {user.role === 'fundacion' && (
                      <>
                        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#87918a]">
                          Mi refugio
                        </p>
                        <a
                          href="#panel-fundacion"
                          onClick={(e) => {
                            e.preventDefault()
                            setFundacionTab('mascotas')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-fundacion-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <LayoutDashboard size={16} /> Panel de mascotas
                        </a>
                        <a
                          href="#panel-fundacion"
                          onClick={(e) => {
                            e.preventDefault()
                            setFundacionTab('mascotas')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-fundacion-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <ListPlus size={16} /> Publicar mascota
                        </a>
                        <a
                          href="#panel-fundacion"
                          onClick={(e) => {
                            e.preventDefault()
                            setFundacionTab('solicitudes')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-fundacion-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <Users size={16} /> Solicitudes
                        </a>
                        <div className="my-1 border-t border-[#efeff2]" />
                      </>
                    )}

                    {user.role === 'usuario' && (
                      <>
                        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#87918a]">
                          Mi cuenta
                        </p>
                        <a
                          href="#panel-usuario"
                          onClick={(e) => {
                            e.preventDefault()
                            setUsuarioTab('perfil')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-usuario-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <User size={16} /> Mi perfil
                        </a>
                        <a
                          href="#panel-usuario"
                          onClick={(e) => {
                            e.preventDefault()
                            setUsuarioTab('favoritos')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-usuario-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <Heart size={16} /> Mis favoritos
                        </a>
                        <a
                          href="#panel-usuario"
                          onClick={(e) => {
                            e.preventDefault()
                            setUsuarioTab('solicitudes')
                            setUserMenuOpen(false)
                            scrollToPanel('panel-usuario-contenido')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#68716b] transition hover:bg-[#f8f6f1] hover:text-[#25302b]"
                        >
                          <Calendar size={16} /> Mis solicitudes
                        </a>
                        <div className="my-1 border-t border-[#efeff2]" />
                      </>
                    )}

                    <button
                      onClick={() => {
                        logout()
                        setUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#cf593d] transition hover:bg-[#fdf0ea]"
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#25302b] transition hover:text-[#e56c4c]"
            >
              Iniciar sesión
            </Link>
          )}
          <button onClick={() => setHelpModalOpen(true)} className="rounded-full bg-[#25302b] px-5 py-2.5 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#e56c4c]">Quiero ayudar</button>
        </div>
      </nav>

      {user && (
        <>
          {user.role === 'admin' && (
            <section id="panel-admin" className="mx-auto max-w-7xl px-6 pb-4 pt-6 lg:px-10">
              <div className="rounded-3xl border border-[#dfe2dc] bg-gradient-to-br from-[#25302b] via-[#2d3833] to-[#25302b] p-6 text-[#fffaf5] lg:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#fffaf5]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      <Crown size={12} /> Panel de administración
                    </div>
                    <h3 className="font-serif text-3xl tracking-[-0.03em]">
                      Bienvenido de vuelta, {user.name.split(' ')[0]}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm text-[#cdd5cf]">
                      Gestiona usuarios, fundaciones y métricas del portal de adopción.
                    </p>
                  </div>
                  <button className="inline-flex items-center gap-2 self-start rounded-full bg-[#e56c4c] px-5 py-2.5 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#cf593d]">
                    <Settings size={15} /> Ajustes del sistema
                  </button>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Usuarios totales', value: '1,248', delta: '+12%', tone: 'bg-[#f4b08f]/15 text-[#f4b08f]', icon: <Users size={16} /> },
                    { label: 'Fundaciones', value: '12', delta: '+2 nuevas', tone: 'bg-[#e6eee1]/15 text-[#d9e5ce]', icon: <Building2 size={16} /> },
                    { label: 'Mascotas en adopción', value: '86', delta: '+5 esta sem.', tone: 'bg-[#ead9c6]/15 text-[#ecd6bc]', icon: <PawPrint size={16} /> },
                    { label: 'Adopciones este mes', value: '38', delta: '+18% vs mes ant.', tone: 'bg-[#d9e2d3]/15 text-[#cfded0]', icon: <TrendingUp size={16} /> },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-[#fffaf5]/5 p-4 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex size-9 items-center justify-center rounded-xl ${s.tone}`}>{s.icon}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9bd19f]">{s.delta}</span>
                      </div>
                      <p className="mt-3 font-serif text-3xl">{s.value}</p>
                      <p className="mt-0.5 text-xs text-[#cdd5cf]">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    { text: 'Ver solicitudes pendientes', tab: 'solicitudes' as const },
                    { text: 'Revisar fundaciones nuevas', tab: 'fundaciones' as const },
                    { text: 'Exportar reportes CSV', tab: 'reportes' as const },
                  ].map((cta) => (
                    <button
                      key={cta.text}
                      onClick={() => {
                        setAdminTab(cta.tab)
                        scrollToPanel('panel-admin-contenido')
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[#fffaf5]/15 px-4 py-2 text-xs font-semibold text-[#e8ebe8] transition hover:bg-[#fffaf5]/10"
                    >
                      {cta.text} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <PanelAdmin user={user} initialTab={adminTab} />
              </div>
            </section>
          )}

          {user.role === 'fundacion' && (
            <section id="panel-fundacion" className="mx-auto max-w-7xl px-6 pb-4 pt-6 lg:px-10">
              <div className="overflow-hidden rounded-3xl border border-[#dfe2dc] bg-gradient-to-br from-[#e6eee1] via-[#fffaf5] to-[#ead9c6] p-6 lg:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#52705a]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#52705a]">
                      <Building2 size={12} /> Panel de refugio
                    </div>
                    <h3 className="font-serif text-3xl tracking-[-0.03em] text-[#25302b]">
                      Hola, {user.foundationName ?? user.name.split(' ')[0]} 🐾
                    </h3>
                    <p className="mt-2 max-w-lg text-sm text-[#68716b]">
                      Gestiona tus mascotas publicadas y revisa las solicitudes de adopción.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFundacionTab('mascotas')
                      setPublishNonce((n) => n + 1)
                      scrollToPanel('panel-fundacion-contenido')
                    }}
                    className="inline-flex items-center gap-2 self-start rounded-full bg-[#52705a] px-5 py-2.5 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#3f5a47]"
                  >
                    <ListPlus size={15} /> Publicar nueva mascota
                  </button>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Mascotas publicadas', value: '14', tone: 'bg-[#e6eee1] text-[#52705a]', icon: <PawPrint size={16} /> },
                    { label: 'Solicitudes nuevas', value: '7', tone: 'bg-[#ead9c6] text-[#9a624b]', icon: <FileText size={16} /> },
                    { label: 'Adopciones completadas', value: '23', tone: 'bg-[#fde4dc] text-[#cf593d]', icon: <Heart size={16} fill="currentColor" /> },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-[#fffaf5] p-5 shadow-sm shadow-[#25302b]/5">
                      <div className={`flex size-11 items-center justify-center rounded-xl ${s.tone}`}>{s.icon}</div>
                      <div>
                        <p className="font-serif text-3xl leading-none text-[#25302b]">{s.value}</p>
                        <p className="mt-1 text-xs text-[#68716b]">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    { text: 'Ver solicitudes (7)', tab: 'solicitudes' as const },
                    { text: 'Gestionar mis mascotas', tab: 'mascotas' as const },
                    { text: 'Editar información del refugio', tab: 'refugio' as const },
                  ].map((cta) => (
                    <button
                      key={cta.text}
                      onClick={() => {
                        setFundacionTab(cta.tab)
                        scrollToPanel('panel-fundacion-contenido')
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[#cfd4cf] bg-[#fffaf5] px-4 py-2 text-xs font-semibold text-[#52705a] transition hover:bg-[#f8f6f1]"
                    >
                      {cta.text} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <PanelFundacion user={user} initialTab={fundacionTab} onPetCreated={refetchPets} openNewPet={publishNonce} />
              </div>
            </section>
          )}

          {user.role === 'usuario' && (
            <section id="panel-usuario" className="mx-auto max-w-7xl px-6 pb-4 pt-6 lg:px-10">
              <div className="overflow-hidden rounded-3xl border border-[#dfe2dc] bg-gradient-to-br from-[#fff5f0] via-[#fffaf5] to-[#f8f6f1] p-6 lg:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#e56c4c]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e56c4c]">
                      <Home size={12} /> Tu panel personal
                    </div>
                    <h3 className="font-serif text-3xl tracking-[-0.03em] text-[#25302b]">
                      ¡Qué bueno verte, {user.name.split(' ')[0]}! ♥
                    </h3>
                    <p className="mt-2 max-w-lg text-sm text-[#68716b]">
                      Continúa tu proceso de adopción y conoce a tu nuevo mejor amigo.
                    </p>
                  </div>
                  <button onClick={() => smoothScrollTo('#adopta')} className="inline-flex items-center gap-2 self-start rounded-full bg-[#e56c4c] px-5 py-2.5 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#cf593d]">
                    <Search size={15} /> Seguir buscando
                  </button>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Favoritos guardados', value: String(favoritePetIds.size), tone: 'bg-[#fde4dc] text-[#cf593d]', icon: <Heart size={16} fill="currentColor" /> },
                    { label: 'Solicitudes enviadas', value: String(userRequests.length), tone: 'bg-[#ead9c6] text-[#9a624b]', icon: <FileText size={16} /> },
                    { label: 'Visitas agendadas', value: String(userRequests.filter((r: any) => r?.scheduled_date).length), tone: 'bg-[#e6eee1] text-[#52705a]', icon: <Calendar size={16} /> },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-[#fffaf5] p-5 shadow-sm shadow-[#25302b]/5">
                      <div className={`flex size-11 items-center justify-center rounded-xl ${s.tone}`}>{s.icon}</div>
                      <div>
                        <p className="font-serif text-3xl leading-none text-[#25302b]">{s.value}</p>
                        <p className="mt-1 text-xs text-[#68716b]">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-dashed border-[#e56c4c]/40 bg-[#fff5f0] p-4">
                  {userLatestVisit ? (
                    <button
                      onClick={() => setVisitModalOpen(true)}
                      className="text-left text-sm font-semibold text-[#cf593d] hover:underline"
                    >
                      📌 Visita agendada con <strong>{userLatestVisit.pet?.name}</strong> el{' '}
                      {new Date(userLatestVisit.scheduled_date).toLocaleString('es-CL')} en{' '}
                      {userLatestVisit.pet?.location}
                    </button>
                  ) : (
                    <p className="text-sm font-semibold text-[#cf593d]">
                      📌 Aún no tienes visitas agendadas.
                    </p>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    { text: 'Ver mis favoritos (5)', tab: 'favoritos' as const },
                    { text: 'Seguimiento de solicitudes', tab: 'solicitudes' as const },
                    { text: 'Actualizar mi perfil', tab: 'perfil' as const },
                  ].map((cta) => (
                    <button
                      key={cta.text}
                      onClick={() => {
                        setUsuarioTab(cta.tab)
                        scrollToPanel('panel-usuario-contenido')
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dfe2dc] bg-[#fffaf5] px-4 py-2 text-xs font-semibold text-[#e56c4c] transition hover:bg-[#fff5f0]"
                    >
                      {cta.text} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <PanelUsuario user={user} initialTab={usuarioTab} onOpenPetDetail={setSelectedPet} />
              </div>
            </section>
          )}
        </>
      )}

      <section id="inicio" className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_0.9fr] lg:px-10 lg:pb-28 lg:pt-16">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e6eee1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#52705a]"><Sparkles size={14} /> Una familia está esperándote</div>
          <h1 className="font-serif text-6xl leading-[0.95] tracking-[-0.055em] text-[#25302b] sm:text-7xl">El comienzo de una <em className="text-[#e56c4c]">gran historia.</em></h1>
          <p className="mt-7 max-w-md text-lg leading-7 text-[#68716b]">Conoce perros y gatos que buscan un hogar lleno de cariño. Tu próximo mejor amigo puede estar más cerca de lo que imaginas.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4"><a href="#adopta" className="inline-flex items-center gap-3 rounded-full bg-[#e56c4c] px-6 py-3.5 text-sm font-semibold text-[#fffaf5] transition hover:-translate-y-0.5 hover:bg-[#cf593d]">Ver mascotas <ArrowRight size={17} /></a><a href="#proceso" className="text-sm font-semibold underline decoration-[#e56c4c] decoration-2 underline-offset-4">Conoce el proceso</a></div>
          <div className="mt-12 flex items-center gap-8 border-t border-[#dfe2dc] pt-5 text-sm"><div><strong className="block text-2xl font-semibold">240+</strong><span className="text-[#68716b]">adopciones felices</span></div><div><strong className="block text-2xl font-semibold">12</strong><span className="text-[#68716b]">refugios aliados</span></div></div>
        </div>
        <div className="relative mx-auto w-full max-w-lg lg:justify-self-end"><div className="absolute -right-5 top-10 size-24 rounded-full bg-[#e8c8a1] blur-sm" /><div className="absolute -bottom-7 left-4 size-28 rounded-full bg-[#b9cdb5] blur-sm" /><div className="relative aspect-[0.88] overflow-hidden rounded-[11rem_11rem_2rem_2rem] bg-[#ead9c6]"><img src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=90" alt="Perro y gato juntos esperando un hogar" className="h-full w-full object-cover" /></div><div className="absolute bottom-8 -left-5 rounded-2xl bg-[#fffaf5] px-5 py-4 shadow-xl shadow-[#25302b]/10"><p className="text-xs text-[#68716b]">Este mes encontramos hogar a</p><p className="mt-1 font-serif text-2xl text-[#e56c4c]">38 mascotas</p></div></div>
      </section>

            <section id="adopta" className="bg-[#fffaf5] px-6 py-20 lg:px-10"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Encuentra a tu compañero</p><h2 className="font-serif text-5xl tracking-[-0.04em]">Mascotas en adopción</h2></div><div className="flex items-center gap-2"><button onClick={() => setFilter('Todos')} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'Todos' ? 'bg-[#25302b] text-[#fffaf5]' : 'bg-[#f0f1ed] text-[#68716b]'}`}>Todos</button><button onClick={() => setFilter('Perro')} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'Perro' ? 'bg-[#25302b] text-[#fffaf5]' : 'bg-[#f0f1ed] text-[#68716b]'}`}>Perros</button><button onClick={() => setFilter('Gato')} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'Gato' ? 'bg-[#25302b] text-[#fffaf5]' : 'bg-[#f0f1ed] text-[#68716b]'}`}>Gatos</button></div></div><div className="mt-8 flex flex-col gap-3 rounded-2xl bg-[#f8f6f1] p-3 sm:flex-row"><div className="flex flex-1 items-center gap-3 rounded-xl bg-[#fffaf5] px-4 py-3"><Search size={18} className="text-[#87918a]" /><input aria-label="Buscar mascota" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca por nombre..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#9da49f]" /></div><button onClick={() => setFilterModalOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-[#dfe2dc] px-5 py-3 text-sm font-semibold text-[#68716b]"><SlidersHorizontal size={16} /> Más filtros</button></div>
              {hasActiveFilters && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-[#52705a]">
                    {filteredPets.length} mascota{filteredPets.length !== 1 ? 's' : ''} encontrada{filteredPets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{petsLoading ? (
          <>
            {[0,1,2,3].map(i => <div key={i} className="animate-pulse"><div className="aspect-[0.92] rounded-3xl bg-[#ead9c6]/60" /><div className="pt-4 space-y-2"><div className="h-7 w-24 rounded bg-[#dfe2dc]" /><div className="h-4 w-32 rounded bg-[#efeff2]" /><div className="h-3 w-28 rounded bg-[#efeff2]" /></div></div>)}
          </>
        ) : filteredPets.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[#dfe2dc] bg-[#fffaf5] p-16 text-center">
            <PawPrint size={48} className="mx-auto mb-4 text-[#e56c4c]/60" />
            <p className="font-serif text-2xl text-[#25302b]">No encontramos mascotas</p>
            <p className="mt-2 text-sm text-[#68716b]">Intenta con otros filtros o limpia la búsqueda.</p>
          </div>
        ) : filteredPets.map((pet) => {
          const isFav = pet.id !== undefined && favoritePetIds.has(pet.id)
          return (
            <article key={pet.id ?? pet.name} onClick={() => setSelectedPet(pet)} className="group cursor-pointer">
              <div className={`relative aspect-[0.92] overflow-hidden rounded-3xl ${pet.tone}`}>
                <img src={pet.image} alt={`${pet.name}, ${pet.type} en adopción`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (pet.id !== undefined) toggleFavorite(pet.id)
                  }}
                  aria-label={`${isFav ? 'Quitar de favoritos a' : 'Agregar a favoritos a'} ${pet.name}`}
                  className={`absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#fffaf5]/90 backdrop-blur-sm ${isFav ? 'text-[#e56c4c]' : 'text-[#25302b]'}`}
                >
                  <Heart size={17} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="flex items-start justify-between pt-4">
                <div>
                  <h3 className="font-serif text-2xl">{pet.name}</h3>
                  <p className="mt-1 text-sm text-[#68716b]">{pet.type} · {pet.age}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-[#87918a]"><MapPin size={13} /> {pet.location}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedPet(pet); }} aria-label={`Ver perfil de ${pet.name}`} className="mt-1 flex size-9 items-center justify-center rounded-full border border-[#dfe2dc] transition group-hover:border-[#e56c4c] group-hover:bg-[#e56c4c] group-hover:text-[#fffaf5]">
                  <ArrowRight size={16} />
                </button>
              </div>
            </article>
          )
        })}</div></div></section>

      <section id="proceso" className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Adoptar es sencillo</p><h2 className="max-w-md font-serif text-5xl leading-tight tracking-[-0.04em]">Un hogar cambia dos vidas.</h2><p className="mt-5 max-w-sm leading-7 text-[#68716b]">Te acompañamos en cada paso para que el encuentro con tu nuevo compañero sea el inicio de algo hermoso.</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-3xl bg-[#e6eee1] p-6"><span className="font-serif text-4xl text-[#52705a]">01</span><h3 className="mt-12 font-semibold">Conoce</h3><p className="mt-2 text-sm leading-6 text-[#68716b]">Explora perfiles y encuentra una conexión especial.</p></div><div className="rounded-3xl bg-[#ead9c6] p-6"><span className="font-serif text-4xl text-[#9a624b]">02</span><h3 className="mt-12 font-semibold">Conecta</h3><p className="mt-2 text-sm leading-6 text-[#68716b]">Agenda una visita para conocerse en persona.</p></div><div className="rounded-3xl bg-[#25302b] p-6 text-[#fffaf5]"><span className="font-serif text-4xl text-[#f4b08f]">03</span><h3 className="mt-12 font-semibold">Adopta</h3><p className="mt-2 text-sm leading-6 text-[#c1c8c1]">Prepara tu hogar y comienza su nueva historia.</p></div></div></div></section>
      <footer id="historias" className="border-t border-[#dfe2dc] px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#68716b] sm:flex-row"><span>© 2024 Huellas que unen</span><span>Hecho con cariño para quienes dan una segunda oportunidad.</span></div></footer>

      {selectedPet && (() => {
        const sp = fallbackPet(selectedPet)
        const isFav = sp.id !== undefined && favoritePetIds.has(sp.id)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPet(null)}>
            <div className="absolute inset-0 bg-[#25302b]/70 backdrop-blur-sm" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-[#fffaf5] shadow-2xl md:flex-row"
            >
              <button
                onClick={() => setSelectedPet(null)}
                aria-label="Cerrar perfil"
                className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-[#fffaf5]/95 text-[#25302b] shadow-md backdrop-blur transition hover:bg-[#e56c4c] hover:text-[#fffaf5]"
              >
                <X size={20} />
              </button>

              <div className={`relative aspect-square w-full shrink-0 overflow-hidden md:aspect-auto md:w-1/2 ${sp.tone}`}>
                <img
                  src={sp.image}
                  alt={`${sp.name}, ${sp.type} en adopción`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button
                    onClick={() => {
                      if (sp.id !== undefined) toggleFavorite(sp.id)
                    }}
                    aria-label={`${isFav ? 'Quitar de favoritos a' : 'Agregar a favoritos a'} ${sp.name}`}
                    className={`flex size-11 items-center justify-center rounded-full bg-[#fffaf5]/95 shadow-md backdrop-blur transition hover:scale-105 ${isFav ? 'text-[#e56c4c]' : 'text-[#e56c4c]'}`}
                  >
                    <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-4xl leading-tight tracking-[-0.02em] text-[#25302b]">{sp.name}</h2>
                    <p className="mt-1 text-sm text-[#68716b]">{sp.breed || 'Raza no especificada'}</p>
                  </div>
                  <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${sp.energy === 'Alta' ? 'bg-[#fde4dc] text-[#e56c4c]' : sp.energy === 'Media' ? 'bg-[#ead9c6] text-[#9a624b]' : 'bg-[#e6eee1] text-[#52705a]'}`}>
                    Energía {sp.energy}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-[#f8f6f1] px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#e6eee1] text-[#52705a]"><User size={16} /></div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#87918a]">Sexo</p>
                      <p className="text-sm font-semibold text-[#25302b]">{sp.gender}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-[#f8f6f1] px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#ead9c6] text-[#9a624b]"><Calendar size={16} /></div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#87918a]">Edad</p>
                      <p className="text-sm font-semibold text-[#25302b]">{sp.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-[#f8f6f1] px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#e9d8c8] text-[#9a624b]"><Weight size={16} /></div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#87918a]">Peso</p>
                      <p className="text-sm font-semibold text-[#25302b]">{sp.weight || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-[#f8f6f1] px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#d9e2d3] text-[#52705a]"><MapPin size={16} /></div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#87918a]">Ubicación</p>
                      <p className="text-sm font-semibold text-[#25302b]">{sp.location}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {sp.vaccinated ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6eee1] px-3 py-1.5 text-xs font-semibold text-[#52705a]"><Syringe size={13} /> Vacunado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fde4dc] px-3 py-1.5 text-xs font-semibold text-[#cf593d]"><Syringe size={13} /> Sin vacunar</span>
                  )}
                  {sp.sterilized ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6eee1] px-3 py-1.5 text-xs font-semibold text-[#52705a]"><Shield size={13} /> Esterilizado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fde4dc] px-3 py-1.5 text-xs font-semibold text-[#cf593d]"><Shield size={13} /> Sin esterilizar</span>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Personalidad</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sp.personality.map((trait) => (
                      <span key={trait} className="inline-flex items-center gap-1.5 rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-3.5 py-2 text-sm font-medium text-[#25302b]">
                        <CheckCircle size={14} className="text-[#52705a]" /> {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Sobre {sp.name}</h3>
                  <p className="mt-3 leading-7 text-[#68716b]">
                    {sp.about || 'Aún no tenemos una descripción detallada, ¡pero esta mascota es maravillosa! Agenda una visita para conocerla.'}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Se lleva bien con</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sp.goodWith.length === 0 ? (
                      <span className="text-sm text-[#87918a]">Por definir</span>
                    ) : sp.goodWith.map((item) => (
                      <span key={item} className="inline-flex items-center rounded-full bg-[#f8f6f1] px-4 py-2 text-sm font-semibold text-[#52705a]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
                  <button onClick={() => handleAdopt(sp)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#e56c4c] px-6 py-3.5 text-sm font-semibold text-[#fffaf5] transition hover:-translate-y-0.5 hover:bg-[#cf593d]">
                    <PawPrint size={16} /> Quiero adoptarlo
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe2dc] px-6 py-3.5 text-sm font-semibold text-[#68716b] transition hover:border-[#25302b] hover:text-[#25302b]">
                    <Info size={16} /> Más información
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {selectedPet && adoptModalOpen && (() => {
        const sp = fallbackPet(selectedPet)
        return (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-[#fffaf5] shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-[#dfe2dc] px-6 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Solicitud de adopción</p>
                  <h3 className="font-serif text-2xl text-[#25302b]">{sp.name}</h3>
                </div>
                <button
                  onClick={() => setAdoptModalOpen(false)}
                  className="flex size-10 items-center justify-center rounded-full border border-[#dfe2dc] bg-[#fffaf5] text-[#68716b] transition hover:border-[#25302b] hover:text-[#25302b]"
                  aria-label="Cerrar solicitud"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-[#25302b]">Mensaje</p>
                    <textarea
                      value={adoptForm.message}
                      onChange={(e) => setAdoptForm((prev) => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] outline-none focus:border-[#e56c4c]"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-[#25302b]">Tipo de vivienda</p>
                      <select
                        value={adoptForm.housingType}
                        onChange={(e) =>
                          setAdoptForm((prev) => ({ ...prev, housingType: e.target.value as any }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] outline-none focus:border-[#e56c4c]"
                      >
                        <option value="">Selecciona</option>
                        <option value="casa">Casa</option>
                        <option value="departamento">Departamento</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#25302b]">¿Tiene patio?</p>
                      <select
                        value={adoptForm.hasPatio}
                        onChange={(e) =>
                          setAdoptForm((prev) => ({ ...prev, hasPatio: e.target.value as any }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] outline-none focus:border-[#e56c4c]"
                      >
                        <option value="">Selecciona</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#25302b]">¿Tiene otras mascotas?</p>
                      <select
                        value={adoptForm.hasOtherPets}
                        onChange={(e) =>
                          setAdoptForm((prev) => ({ ...prev, hasOtherPets: e.target.value as any }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] outline-none focus:border-[#e56c4c]"
                      >
                        <option value="">Selecciona</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#25302b]">¿Cuántas personas viven ahí?</p>
                      <input
                        type="number"
                        min={1}
                        value={adoptForm.householdSize}
                        onChange={(e) =>
                          setAdoptForm((prev) => ({ ...prev, householdSize: e.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] outline-none focus:border-[#e56c4c]"
                        placeholder="Ej: 3"
                      />
                    </div>
                    {adoptForm.hasOtherPets === 'si' && (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-semibold text-[#25302b]">¿Cuántas mascotas tienes?</p>
                        <input
                          type="number"
                          min={1}
                          value={adoptForm.otherPetsCount}
                          onChange={(e) =>
                            setAdoptForm((prev) => ({ ...prev, otherPetsCount: e.target.value }))
                          }
                          className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] outline-none focus:border-[#e56c4c]"
                          placeholder="Ej: 2"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#25302b]">Fotos de la vivienda / patio</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        void addHomePhotos(e.target.files)
                      }}
                      className="mt-2 w-full rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b]"
                    />
                    {adoptForm.homePhotos.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {adoptForm.homePhotos.map((src, idx) => (
                          <button
                            key={`${idx}-${src.slice(0, 24)}`}
                            type="button"
                            onClick={() =>
                              setAdoptForm((prev) => ({
                                ...prev,
                                homePhotos: prev.homePhotos.filter((_, i) => i !== idx),
                              }))
                            }
                            className="relative aspect-square overflow-hidden rounded-2xl border border-[#dfe2dc] bg-[#f8f6f1]"
                          >
                            <img src={src} alt="foto vivienda" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#dfe2dc] px-6 py-4 sm:flex-row">
                <button
                  onClick={() => setAdoptModalOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-[#dfe2dc] bg-[#fffaf5] px-6 py-3 text-sm font-semibold text-[#68716b] transition hover:border-[#25302b] hover:text-[#25302b]"
                  disabled={adoptSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void submitAdoption(sp)}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#e56c4c] px-6 py-3 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#cf593d] disabled:opacity-50"
                  disabled={adoptSubmitting || !adoptForm.message.trim()}
                >
                  {adoptSubmitting ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {visitModalOpen && userLatestVisit && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-[#fffaf5] shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-[#dfe2dc] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e56c4c]">Visita agendada</p>
                <h3 className="font-serif text-2xl text-[#25302b]">{userLatestVisit.pet?.name}</h3>
              </div>
              <button
                onClick={() => setVisitModalOpen(false)}
                className="flex size-10 items-center justify-center rounded-full border border-[#dfe2dc] bg-[#fffaf5] text-[#68716b] transition hover:border-[#25302b] hover:text-[#25302b]"
                aria-label="Cerrar visita"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                  {userLatestVisit.pet?.image ? (
                    <img src={userLatestVisit.pet.image} alt={userLatestVisit.pet.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#25302b]">{userLatestVisit.foundation?.name}</p>
                  <p className="text-sm text-[#52705a]">{userLatestVisit.pet?.location}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Fecha y hora</p>
                <p className="mt-1 font-semibold">{new Date(userLatestVisit.scheduled_date).toLocaleString('es-CL')}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setVisitModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-[#25302b] px-6 py-3 text-sm font-semibold text-[#fffaf5] transition hover:opacity-90"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PetFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(filters: any, reset: boolean) => {
          if (reset) {
            setAppliedFilters({})
          } else {
            setAppliedFilters(filters)
          }
          setFilterModalOpen(false)
        }}
      />
      <HelpModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </main>
  )
}
