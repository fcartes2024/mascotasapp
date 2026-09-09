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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import PetNewForm from '@/components/pets/PetNewForm'

type PanelFundacionProps = {
  user: User
  initialTab?: 'solicitudes' | 'mascotas' | 'refugio'
  onPetCreated?: () => void
  openNewPet?: number
}

type Pet = {
  id: number
  name: string
  image: string
  type?: string
  breed?: string
  age?: string
  gender?: string | null
  location?: string
  vaccinated?: boolean
  sterilized?: boolean
  adoption_state?: 'en_adopcion' | 'rescatado' | 'adoptado'
}

type RequestItem = {
  id: number
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'completada'
  message: string | null
  scheduled_date: string | null
  application: any | null
  created_at: string
  pet: Pet
  user: { id: number; name: string; email: string }
}

type FoundationData = {
  id: number
  name: string
  description: string | null
  location: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
  available_slots: string | null
  created_at: string
  pets_count?: number
  users_count?: number
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

export default function PanelFundacion({
  user,
  initialTab,
  onPetCreated,
  openNewPet,
}: PanelFundacionProps) {
  const [tab, setTab] = useState<'solicitudes' | 'mascotas' | 'refugio'>(initialTab ?? 'solicitudes')
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loadingReq, setLoadingReq] = useState(false)

  const [pets, setPets] = useState<Pet[]>([])
  const [loadingPets, setLoadingPets] = useState(false)
  const [showNewPet, setShowNewPet] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [editForm, setEditForm] = useState<Partial<Pet>>({})

  const [foundation, setFoundation] = useState<FoundationData | null>(null)
  const [fName, setFName] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fLocation, setFLocation] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fLogo, setFLogo] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [newSlot, setNewSlot] = useState('')
  const [savingFoundation, setSavingFoundation] = useState(false)
  const [fMsg, setFMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [schedDate, setSchedDate] = useState<Record<number, string>>({})
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)

  useEffect(() => {
    setTab(initialTab ?? 'solicitudes')
  }, [initialTab])

  useEffect(() => {
    if (openNewPet && openNewPet > 0) {
      setTab('mascotas')
      setShowNewPet(true)
    }
  }, [openNewPet])

  useEffect(() => {
    if (tab === 'solicitudes') loadRequests()
  }, [tab, user.email])

  useEffect(() => {
    if (tab === 'mascotas') loadPets()
  }, [tab, user.email])

  useEffect(() => {
    if (tab === 'refugio') loadFoundation()
  }, [tab, user.email])

  async function loadRequests() {
    setLoadingReq(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/requests?foundation_email=${encodeURIComponent(user.email)}`,
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

  async function loadPets() {
    setLoadingPets(true)
    setError(null)
    try {
      const res = await fetch(`/api/pets?publisher_email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudieron cargar las mascotas')
      setPets(data.pets ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoadingPets(false)
    }
  }

  async function loadFoundation() {
    setError(null)
    setFMsg(null)
    try {
      const res = await fetch(`/api/users/me?email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo cargar la fundación')
      const f = (data.user as { foundation: FoundationData | null }).foundation
      if (f) {
        setFoundation(f)
        setFName(f.name ?? '')
        setFDescription(f.description ?? '')
        setFLocation(f.location ?? '')
        setFEmail(f.email ?? '')
        setFPhone(f.phone ?? '')
        setFLogo(f.logo_url ?? '')
        try {
          const parsed = f.available_slots ? (JSON.parse(f.available_slots) as unknown) : []
          setAvailableSlots(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [])
        } catch {
          setAvailableSlots([])
        }
        setNewSlot('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  async function patchRequest(
    reqId: number,
    status: RequestItem['status'],
    extra: Partial<{ scheduled_date: string; message: string }> = {},
  ) {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          action_by_email: user.email,
          ...extra,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo actualizar la solicitud')
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status, ...extra } : r)),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  async function updatePetState(petId: number, adoption_state: Pet['adoption_state']) {
    if (!adoption_state) return
    try {
      const res = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editor_email: user.email, adoption_state }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo actualizar el estado')
      setPets((prev) =>
        prev.map((p) => (p.id === petId ? { ...p, adoption_state: data.pet?.adoption_state ?? adoption_state } : p)),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  async function saveFoundation(e: React.FormEvent) {
    e.preventDefault()
    setSavingFoundation(true)
    setFMsg(null)
    try {
      const body: Record<string, unknown> = {
        email: user.email,
        name_foundation: fName.trim(),
        description: fDescription.trim() || null,
        location: fLocation.trim() || null,
        email_foundation: fEmail.trim() || null,
        phone: fPhone.trim() || null,
        logo_url: fLogo.trim() || null,
        available_slots: JSON.stringify(availableSlots),
      }
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo guardar')
      setFMsg({ ok: true, text: 'Datos de la fundación guardados correctamente.' })
    } catch (e) {
      setFMsg({ ok: false, text: e instanceof Error ? e.message : 'Error' })
    } finally {
      setSavingFoundation(false)
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

  async function handleLogoFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFMsg({ ok: false, text: 'Selecciona un archivo de imagen válido.' })
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setFLogo(dataUrl)
    } catch (e) {
      setFMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al cargar la imagen.' })
    }
  }

  async function handleEditPetImage(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen válido.')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setEditForm((prev) => ({ ...prev, image: dataUrl }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  function openEditPet(pet: Pet) {
    setEditingPet(pet)
    setEditForm({
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender ?? undefined,
      location: pet.location,
      image: pet.image,
    })
  }

  async function savePetEdit() {
    if (!editingPet) return
    try {
      const res = await fetch(`/api/pets/${editingPet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editor_email: user.email,
          ...editForm,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo guardar')
      setPets((prev) =>
        prev.map((p) => (p.id === editingPet.id ? { ...p, ...(data.pet ?? editForm) } : p)),
      )
      setEditingPet(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full" id="panel-fundacion-contenido">
      <TabsList>
        <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
        <TabsTrigger value="mascotas">Mascotas</TabsTrigger>
        <TabsTrigger value="refugio">Refugio</TabsTrigger>
      </TabsList>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <TabsContent value="solicitudes">
        {loadingReq ? (
          <div className="text-[#52705a] text-sm py-8 text-center">Cargando solicitudes…</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-[#52705a]">
            <p className="text-lg font-medium">No hay solicitudes de adopción aún.</p>
            <p className="text-sm mt-1 opacity-80">Las solicitudes para tus mascotas aparecerán aquí.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mascota</TableHead>
                <TableHead>Adoptante</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Agendar</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedRequest(r)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                        {r.pet.image && (
                          <img src={r.pet.image} alt={r.pet.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium text-[#25302b]">{r.pet.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[#25302b]">{r.user.name}</p>
                      <p className="text-xs text-[#52705a]">{r.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#52705a]">{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-xs text-[#52705a] text-sm truncate">
                    {r.message || '—'}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="datetime-local"
                      size={1}
                      value={schedDate[r.id] ?? ''}
                      onChange={(e) =>
                        setSchedDate((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-48 text-xs py-1.5 h-auto"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          void patchRequest(r.id, 'aprobada')
                        }}
                        size="sm"
                        className="bg-[#52705a] text-[#fffaf5] hover:opacity-90"
                        disabled={r.status === 'aprobada' || r.status === 'completada'}
                      >
                        Aprobar
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          void patchRequest(
                            r.id,
                            'aprobada',
                            schedDate[r.id] ? { scheduled_date: schedDate[r.id] } : {},
                          )
                        }}
                        size="sm"
                        variant="outline"
                        className="border-[#dfe2dc] text-[#25302b] hover:bg-[#f8f6f1]"
                        disabled={r.status === 'completada'}
                      >
                        Agendar
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          void patchRequest(r.id, 'rechazada')
                        }}
                        size="sm"
                        variant="outline"
                        className="border-[#dfe2dc] text-[#e56c4c] hover:bg-[#f8f6f1]"
                        disabled={r.status === 'rechazada' || r.status === 'completada'}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="mascotas">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowNewPet(true)}
            className="bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity"
          >
            + Publicar nueva
          </Button>
        </div>

        {loadingPets ? (
          <div className="text-[#52705a] text-sm py-8 text-center">Cargando mascotas…</div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12 text-[#52705a]">
            <p className="text-lg font-medium">Todavía no has publicado mascotas.</p>
            <p className="text-sm mt-1 opacity-80">Presiona “Publicar nueva” para dar de alta un animal en adopción.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pets.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#f8f6f1]">
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )}
                </div>
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-xl text-[#25302b]">{p.name}</h3>
                      <span className="text-xs font-bold uppercase tracking-wider bg-[#e6eee1] text-[#52705a] rounded-full px-3 py-1">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-sm text-[#52705a] mt-1">
                      {p.breed ? `${p.breed} · ` : ''}{p.age ?? ''}
                    </p>
                    {p.location && <p className="text-xs text-[#52705a] mt-0.5 opacity-80">{p.location}</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => openEditPet(p)}
                      variant="outline"
                      className="border-[#dfe2dc] text-[#25302b] hover:bg-[#f8f6f1] w-full"
                    >
                      Editar
                    </Button>
                    <Select
                      value={p.adoption_state ?? 'en_adopcion'}
                      onChange={(e) =>
                        void updatePetState(p.id, e.target.value as Pet['adoption_state'])
                      }
                      className="border-[#dfe2dc] text-[#25302b] bg-[#fffaf5] w-full"
                    >
                      <option value="en_adopcion">En adopción</option>
                      <option value="rescatado">Rescatado</option>
                      <option value="adoptado">Adoptado</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showNewPet && (
          <PetNewForm
            userEmail={user.email}
            onSubmit={() => {
              onPetCreated?.()
              loadPets()
            }}
            onClose={() => setShowNewPet(false)}
          />
        )}

        {editingPet && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <Card className="w-full max-w-xl max-h-[90vh] overflow-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl text-[#25302b]">Editar {editingPet.name}</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setEditingPet(null)}
                    className="text-[#52705a] hover:text-[#25302b] hover:bg-[#f8f6f1]"
                  >
                    Cerrar
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#25302b] font-medium">Nombre</Label>
                    <Input
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#25302b] font-medium">Raza</Label>
                    <Input
                      value={editForm.breed ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#25302b] font-medium">Edad</Label>
                    <Input
                      value={editForm.age ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#25302b] font-medium">Ubicación</Label>
                    <Input
                      value={editForm.location ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#25302b] font-medium">Imagen</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        void handleEditPetImage(e.target.files?.[0] ?? null)
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingPet(null)}
                      className="border-[#dfe2dc] text-[#25302b] hover:bg-[#f8f6f1]"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={savePetEdit}
                      className="bg-[#25302b] text-[#fffaf5] hover:opacity-90"
                    >
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      <TabsContent value="refugio">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={saveFoundation} className="space-y-5 max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                  {(fLogo || foundation?.logo_url) ? (
                    <img
                      src={fLogo || foundation?.logo_url || ''}
                      alt="logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-[#52705a] font-serif">
                      {(fName || foundation?.name || 'F').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-[#25302b]">
                    {foundation?.name || user.foundationName || user.name}
                  </h3>
                  <p className="text-sm text-[#52705a]">Información pública de tu refugio</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#25302b] font-medium">Nombre de la fundación</Label>
                <Input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Refugio Huellas"
                  className="bg-[#fffaf5]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#25302b] font-medium">Descripción</Label>
                <Textarea
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                  placeholder="Cuéntanos sobre tu refugio, misión, visión..."
                  rows={4}
                  className="bg-[#fffaf5] rounded-xl border-[#dfe2dc]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#25302b] font-medium">Ubicación</Label>
                <Input
                  value={fLocation}
                  onChange={(e) => setFLocation(e.target.value)}
                  placeholder="Ciudad, País"
                  className="bg-[#fffaf5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#25302b] font-medium">Email de contacto</Label>
                  <Input
                    type="email"
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    placeholder="hola@refugio.org"
                    className="bg-[#fffaf5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#25302b] font-medium">Teléfono</Label>
                  <Input
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="bg-[#fffaf5]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#25302b] font-medium">Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    void handleLogoFile(e.target.files?.[0] ?? null)
                  }}
                  className="bg-[#fffaf5]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#25302b] font-medium">Fechas disponibles para visitas</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="datetime-local"
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="bg-[#fffaf5]"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newSlot) return
                      setAvailableSlots((prev) =>
                        Array.from(new Set([...prev, newSlot])).sort((a, b) => a.localeCompare(b)),
                      )
                      setNewSlot('')
                    }}
                    className="bg-[#52705a] text-[#fffaf5] hover:opacity-90"
                    disabled={!newSlot}
                  >
                    Agregar fecha
                  </Button>
                </div>
                {availableSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {availableSlots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAvailableSlots((prev) => prev.filter((x) => x !== s))}
                        className="rounded-full border border-[#dfe2dc] bg-[#fffaf5] px-3 py-1 text-xs font-semibold text-[#25302b] hover:bg-[#f8f6f1]"
                      >
                        {new Date(s).toLocaleString('es-CL')} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {fMsg && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    fMsg.ok
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {fMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={savingFoundation}
                  className="bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingFoundation ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl text-[#25302b]">Solicitud #{selectedRequest.id}</h3>
                  <p className="text-sm text-[#52705a]">
                    {selectedRequest.user.name} · {selectedRequest.user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedRequest(null)}
                  className="text-[#52705a] hover:text-[#25302b] hover:bg-[#f8f6f1]"
                >
                  Cerrar
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                  {selectedRequest.pet.image && (
                    <img
                      src={selectedRequest.pet.image}
                      alt={selectedRequest.pet.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-serif text-xl text-[#25302b]">{selectedRequest.pet.name}</p>
                  <p className="text-xs text-[#52705a]">{selectedRequest.pet.location}</p>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#25302b]">Mensaje</p>
                <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#52705a]">
                  {selectedRequest.message || '—'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#25302b]">Formulario del adoptante</p>
                <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] px-4 py-3 text-sm text-[#25302b] space-y-2">
                  {selectedRequest.application ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Vivienda</p>
                          <p className="text-sm">{String((selectedRequest.application as any).housingType || '—')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Patio</p>
                          <p className="text-sm">{String((selectedRequest.application as any).hasPatio || '—')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Otras mascotas</p>
                          <p className="text-sm">{String((selectedRequest.application as any).hasOtherPets || '—')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Personas en el hogar</p>
                          <p className="text-sm">{String((selectedRequest.application as any).householdSize || '—')}</p>
                        </div>
                        {(selectedRequest.application as any).otherPetsCount ? (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Cantidad mascotas</p>
                            <p className="text-sm">{String((selectedRequest.application as any).otherPetsCount)}</p>
                          </div>
                        ) : null}
                      </div>
                      {Array.isArray((selectedRequest.application as any).homePhotos) &&
                      (selectedRequest.application as any).homePhotos.length > 0 ? (
                        <div className="pt-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#87918a]">Fotos vivienda/patio</p>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(selectedRequest.application as any).homePhotos.map((src: string, idx: number) => (
                              <div
                                key={`${idx}-${src.slice(0, 24)}`}
                                className="aspect-square overflow-hidden rounded-2xl border border-[#dfe2dc] bg-[#f8f6f1]"
                              >
                                <img src={src} alt="foto vivienda" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-[#52705a]">No hay formulario adicional en esta solicitud.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-[#25302b]">Agendar visita</p>
                  <Input
                    type="datetime-local"
                    value={schedDate[selectedRequest.id] ?? selectedRequest.scheduled_date ?? ''}
                    onChange={(e) =>
                      setSchedDate((prev) => ({ ...prev, [selectedRequest.id]: e.target.value }))
                    }
                    className="bg-[#fffaf5]"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-[#25302b]">Usar fecha disponible</p>
                  <Select
                    value=""
                    onChange={(e) => {
                      const v = e.target.value
                      if (!v) return
                      setSchedDate((prev) => ({ ...prev, [selectedRequest.id]: v }))
                    }}
                    className="border-[#dfe2dc] text-[#25302b] bg-[#fffaf5] w-full"
                  >
                    <option value="">Selecciona</option>
                    {availableSlots.map((s) => (
                      <option key={s} value={s}>
                        {new Date(s).toLocaleString('es-CL')}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  onClick={() => {
                    void (async () => {
                      await patchRequest(selectedRequest.id, 'aprobada')
                      setSelectedRequest(null)
                    })()
                  }}
                  className="bg-[#52705a] text-[#fffaf5] hover:opacity-90"
                  disabled={selectedRequest.status === 'aprobada' || selectedRequest.status === 'completada'}
                >
                  Aprobar
                </Button>
                <Button
                  onClick={() => {
                    void (async () => {
                      await patchRequest(
                        selectedRequest.id,
                        'aprobada',
                        schedDate[selectedRequest.id]
                          ? { scheduled_date: schedDate[selectedRequest.id] }
                          : {},
                      )
                      setSelectedRequest(null)
                    })()
                  }}
                  variant="outline"
                  className="border-[#dfe2dc] text-[#25302b] hover:bg-[#f8f6f1]"
                  disabled={selectedRequest.status === 'completada'}
                >
                  Agendar
                </Button>
                <Button
                  onClick={() => {
                    void (async () => {
                      await patchRequest(selectedRequest.id, 'rechazada')
                      setSelectedRequest(null)
                    })()
                  }}
                  variant="outline"
                  className="border-[#dfe2dc] text-[#e56c4c] hover:bg-[#f8f6f1]"
                  disabled={selectedRequest.status === 'rechazada' || selectedRequest.status === 'completada'}
                >
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Tabs>
  )
}
