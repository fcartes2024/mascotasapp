'use client'

import { useEffect, useState } from 'react'
import { User } from '@/components/providers/auth-provider'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type PanelUsuarioProps = {
  user: User
  initialTab?: 'favoritos' | 'solicitudes' | 'perfil'
  onOpenPetDetail?: (pet: {
    id: number
    name: string
    image: string
    type?: string
    breed?: string
    age?: string
    gender?: string | null
    weight?: string | null
    location?: string
    vaccinated?: boolean
    sterilized?: boolean
    personality?: string[] | string | null
    about?: string | null
    good_with?: string[] | string | null
    energy?: string | null
    tone?: string | null
  }) => void
}

type Pet = {
  id: number
  name: string
  image: string
  type?: string
  breed?: string
  age?: string
  gender?: string | null
  weight?: string | null
  location?: string
  vaccinated?: boolean
  sterilized?: boolean
  personality?: string[] | string | null
  about?: string | null
  good_with?: string[] | string | null
  energy?: string | null
  tone?: string | null
}

type FavoriteItem = {
  id: number
  pet_id: number
  created_at: string
  pet: Pet
}

type RequestItem = {
  id: number
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'completada'
  message: string | null
  scheduled_date: string | null
  created_at: string
  pet: Pet
  foundation: { id: number; name: string }
}

type UserProfile = {
  id: number
  name: string
  email: string
  role: string
  avatar: string | null
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  aprobada: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-rose-100 text-rose-800',
  completada: 'bg-slate-200 text-slate-700',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-200 text-slate-700'
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider inline-flex items-center ${cls}`}
    >
      {status}
    </span>
  )
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function PanelUsuario({ user, initialTab, onOpenPetDetail }: PanelUsuarioProps) {
  const [tab, setTab] = useState<'favoritos' | 'solicitudes' | 'perfil'>(initialTab ?? 'favoritos')
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loadingFav, setLoadingFav] = useState(false)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loadingReq, setLoadingReq] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTab(initialTab ?? 'favoritos')
  }, [initialTab])

  useEffect(() => {
    if (tab === 'favoritos') loadFavorites()
  }, [tab, user.email])

  useEffect(() => {
    if (tab === 'solicitudes') loadRequests()
  }, [tab, user.email])

  useEffect(() => {
    if (tab === 'perfil') loadProfile()
  }, [tab, user.email])

  async function loadFavorites() {
    setLoadingFav(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/favorites?user_email=${encodeURIComponent(user.email)}`,
      )
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudieron cargar los favoritos')
      setFavorites(data.favorites ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoadingFav(false)
    }
  }

  async function loadRequests() {
    setLoadingReq(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/requests?user_email=${encodeURIComponent(user.email)}`,
      )
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudieron cargar las solicitudes')
      setRequests(data.requests ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoadingReq(false)
    }
  }

  async function loadProfile() {
    setError(null)
    setProfileMsg(null)
    try {
      const res = await fetch(`/api/users/me?email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo cargar el perfil')
      const u = data.user as UserProfile
      setProfile(u)
      setName(u.name ?? '')
      setAvatar(u.avatar ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  async function removeFavorite(petId: number) {
    try {
      const res = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, pet_id: petId }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo quitar el favorito')
      setFavorites((prev) => prev.filter((f) => f.pet_id !== petId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  async function cancelRequest(reqId: number) {
    if (!confirm('¿Cancelar esta solicitud?')) return
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rechazada',
          message: 'Cancelada por el usuario',
          action_by_email: user.email,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo cancelar la solicitud')
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'rechazada' } : r)),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const body: Record<string, unknown> = {
        email: user.email,
        name: name.trim(),
        avatar: avatar.trim() || null,
      }
      if (currentPassword || newPassword) {
        if (!currentPassword || !newPassword) {
          throw new Error('Completa tanto la contraseña actual como la nueva.')
        }
        body.current_password = currentPassword
        body.new_password = newPassword
      }
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo guardar el perfil')
      setProfileMsg({ ok: true, text: 'Perfil guardado correctamente.' })
      setCurrentPassword('')
      setNewPassword('')
      if (data.user) {
        setProfile(data.user)
      }
    } catch (e) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : 'Error' })
    } finally {
      setSavingProfile(false)
    }
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleAvatarFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProfileMsg({ ok: false, text: 'Selecciona un archivo de imagen válido.' })
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setAvatar(dataUrl)
    } catch (e) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al cargar la imagen.' })
    }
  }

  function verMascota(pet: Pet) {
    onOpenPetDetail?.(pet)
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full" id="panel-usuario-contenido">
      <TabsList>
        <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
        <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
      </TabsList>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <TabsContent value="favoritos">
        {loadingFav ? (
          <div className="text-[#52705a] text-sm py-8 text-center">Cargando favoritos…</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 text-[#52705a]">
            <p className="text-lg font-medium">No tienes mascotas favoritas aún.</p>
            <p className="text-sm mt-1 opacity-80">Explora el catálogo y guarda las que más te gusten.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((fav) => (
              <Card key={fav.id} className="overflow-hidden">
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#f8f6f1]">
                  {fav.pet.image ? (
                    <img
                      src={fav.pet.image}
                      alt={fav.pet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : null}
                </div>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-xl text-[#25302b]">{fav.pet.name}</h3>
                      {fav.pet.location && (
                        <p className="text-sm text-[#52705a] mt-0.5">{fav.pet.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => verMascota(fav.pet)}
                      className="bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity w-full"
                    >
                      Ver perfil
                    </Button>
                    <Button
                      onClick={() => removeFavorite(fav.pet.id)}
                      variant="outline"
                      className="border-[#dfe2dc] text-[#e56c4c] hover:bg-[#f8f6f1] w-full"
                    >
                      Quitar favorito
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="solicitudes">
        {loadingReq ? (
          <div className="text-[#52705a] text-sm py-8 text-center">Cargando solicitudes…</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-[#52705a]">
            <p className="text-lg font-medium">Aún no has enviado solicitudes de adopción.</p>
            <p className="text-sm mt-1 opacity-80">Cuando te postules para una mascota aparecerán aquí.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mascota</TableHead>
                <TableHead>Fundación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                        {r.pet.image && (
                          <img
                            src={r.pet.image}
                            alt={r.pet.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium text-[#25302b]">{r.pet.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#52705a]">{r.foundation.name}</TableCell>
                  <TableCell className="text-[#52705a]">{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-xs text-[#52705a] text-sm truncate">
                    {r.message || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'pendiente' ? (
                      <Button
                        onClick={() => cancelRequest(r.id)}
                        variant="outline"
                        size="sm"
                        className="border-[#dfe2dc] text-[#e56c4c] hover:bg-[#f8f6f1]"
                      >
                        Cancelar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="perfil">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={saveProfile} className="space-y-5 max-w-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                  {(avatar || profile?.avatar) ? (
                    <img
                      src={avatar || profile?.avatar || ''}
                      alt={name || profile?.name || 'avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-[#52705a] font-serif">
                      {(name || profile?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-[#25302b]">{profile?.name || user.name}</h3>
                  <p className="text-sm text-[#52705a]">{profile?.email || user.email}</p>
                  <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wider bg-[#ead9c6] text-[#9a624b] rounded-full px-3 py-1">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#25302b] font-medium">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-[#fffaf5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#25302b] font-medium">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || user.email}
                  readOnly
                  disabled
                  className="bg-[#f8f6f1] cursor-not-allowed opacity-80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar-file" className="text-[#25302b] font-medium">Avatar</Label>
                <Input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    void handleAvatarFile(e.target.files?.[0] ?? null)
                  }}
                  className="bg-[#fffaf5]"
                />
              </div>

              <div className="h-px bg-[#dfe2dc] my-4" />

              <h4 className="font-serif text-lg text-[#25302b]">Cambiar contraseña</h4>

              <div className="space-y-2">
                <Label htmlFor="cur-pw" className="text-[#25302b] font-medium">Contraseña actual</Label>
                <Input
                  id="cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                  className="bg-[#fffaf5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pw" className="text-[#25302b] font-medium">Nueva contraseña</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                  className="bg-[#fffaf5]"
                />
              </div>

              {profileMsg && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    profileMsg.ok
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingProfile ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
