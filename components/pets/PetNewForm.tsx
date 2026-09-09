'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { X, PawPrint, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type PetType = 'Perro' | 'Gato'
type Gender = 'Macho' | 'Hembra'
type Energy = 'Baja' | 'Media' | 'Alta'

export type PetFormData = {
  id?: number
  name: string
  type: PetType
  breed: string
  age: string
  gender: Gender | ''
  weight: string
  location: string
  image: string
  tone: string
  vaccinated: boolean
  sterilized: boolean
  personality: string
  about: string
  good_with: string
  energy: Energy | ''
}

type InitialPet = {
  id: number
  name: string
  type: PetType
  breed: string | null
  age: string
  gender: Gender | null
  weight: string | null
  location: string
  image: string
  tone: string
  vaccinated: boolean
  sterilized: boolean
  personality: string[]
  about: string | null
  good_with: string[]
  energy: Energy | null
}

const CIUDADES = [
  'Providencia, Santiago',
  'Las Condes, Santiago',
  'Ñuñoa, Santiago',
  'La Florida, Santiago',
  'Maipú, Santiago',
  'Puente Alto, Santiago',
  'Valparaíso',
  'Viña del Mar',
  'Concepción',
  'La Serena',
]

const TONE_PRESETS = [
  '#e9d8c8',
  '#ead9c6',
  '#d9e2d3',
  '#e6eee1',
  '#fde4dc',
  '#fff5f0',
  '#cde1d0',
  '#f4b08f',
]

interface PetNewFormProps {
  onClose: () => void
  onSubmit?: (data: PetFormData & { id?: number }) => void
  userEmail: string
  initialPet?: InitialPet
}

const EMPTY_FORM: PetFormData = {
  name: '',
  type: 'Perro',
  breed: '',
  age: '',
  gender: '',
  weight: '',
  location: '',
  image: '',
  tone: '',
  vaccinated: false,
  sterilized: false,
  personality: '',
  about: '',
  good_with: '',
  energy: '',
}

export default function PetNewForm({ onClose, onSubmit, userEmail, initialPet }: PetNewFormProps) {
  const [form, setForm] = useState<PetFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialPet

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (initialPet) {
      setForm({
        id: initialPet.id,
        name: initialPet.name,
        type: initialPet.type,
        breed: initialPet.breed ?? '',
        age: initialPet.age,
        gender: initialPet.gender ?? '',
        weight: initialPet.weight ?? '',
        location: initialPet.location,
        image: initialPet.image,
        tone: initialPet.tone ?? '',
        vaccinated: initialPet.vaccinated,
        sterilized: initialPet.sterilized,
        personality: (initialPet.personality ?? []).join(', '),
        about: initialPet.about ?? '',
        good_with: (initialPet.good_with ?? []).join(', '),
        energy: initialPet.energy ?? '',
      })
    }
  }, [initialPet])

  function update<K extends keyof PetFormData>(key: K, value: PetFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleImageFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen válido.')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      update('image', dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la imagen.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.age.trim() || !form.location.trim() || !form.image.trim()) {
      setError('Nombre, edad, ubicación e imagen URL son obligatorios.')
      return
    }
    if (!userEmail) {
      setError('Usuario no autenticado.')
      return
    }

    setSubmitting(true)
    try {
      const personalityArr = form.personality
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const goodWithArr = form.good_with
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || null,
        age: form.age.trim(),
        gender: form.gender || null,
        weight: form.weight.trim() || null,
        location: form.location.trim(),
        image: form.image.trim(),
        tone: form.tone || 'bg-[#ead9c6]',
        vaccinated: form.vaccinated ? 1 : 0,
        sterilized: form.sterilized ? 1 : 0,
        personality: personalityArr,
        about: form.about.trim() || null,
        good_with: goodWithArr,
        energy: form.energy || null,
      }

      let res: Response
      if (isEditing && initialPet) {
        res = await fetch(`/api/pets/${initialPet.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            editor_email: userEmail,
            ...payload,
          }),
        })
      } else {
        res = await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publisher_email: userEmail,
            ...payload,
          }),
        })
      }

      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Error al guardar la mascota.')
        return
      }

      if (onSubmit) {
        onSubmit({
          id: data.pet?.id,
          name: data.pet?.name ?? form.name,
          type: data.pet?.type ?? form.type,
          breed: data.pet?.breed ?? form.breed,
          age: data.pet?.age ?? form.age,
          gender: data.pet?.gender ?? form.gender,
          weight: data.pet?.weight ?? form.weight,
          location: data.pet?.location ?? form.location,
          image: data.pet?.image ?? form.image,
          tone: data.pet?.tone ?? form.tone,
          vaccinated: data.pet?.vaccinated ?? form.vaccinated,
          sterilized: data.pet?.sterilized ?? form.sterilized,
          personality: Array.isArray(data.pet?.personality)
            ? data.pet.personality.join(', ')
            : form.personality,
          about: data.pet?.about ?? form.about,
          good_with: Array.isArray(data.pet?.good_with)
            ? data.pet.good_with.join(', ')
            : form.good_with,
          energy: data.pet?.energy ?? form.energy,
        })
      }
      onClose()
    } catch (err) {
      console.error('[PetNewForm submit]', err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#dfe2dc] bg-[#fffaf5] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#dfe2dc] bg-[#f8f6f1] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#52705a] text-[#fffaf5]">
              <PawPrint size={18} />
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-[#25302b]">
                {isEditing ? 'Editar mascota' : 'Publicar nueva mascota'}
              </h2>
              <p className="mt-1 text-sm text-[#68716b]">
                {isEditing ? 'Actualiza los datos del perfil' : 'Completa la información para encontrarle un hogar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="flex size-10 items-center justify-center rounded-full bg-[#fffaf5] text-[#25302b] shadow-sm transition hover:bg-[#e56c4c] hover:text-[#fffaf5]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-xl border border-[#e56c4c]/30 bg-[#fff5f0] px-4 py-3 text-sm text-[#cf593d]">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pet-name">Nombre *</Label>
              <Input
                id="pet-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ej: Luna, Max, Milo..."
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <div className="mt-1.5 flex gap-3">
                {(['Perro', 'Gato'] as const).map((t) => (
                  <label
                    key={t}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
                      form.type === t
                        ? 'border-[#52705a] bg-[#52705a] text-[#fffaf5]'
                        : 'border-[#dfe2dc] bg-[#f8f6f1] text-[#68716b] hover:border-[#52705a]/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="pet-type"
                      value={t}
                      checked={form.type === t}
                      onChange={() => update('type', t)}
                      className="hidden"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pet-breed">Raza</Label>
              <Input
                id="pet-breed"
                type="text"
                value={form.breed}
                onChange={(e) => update('breed', e.target.value)}
                placeholder="Ej: Golden Retriever, Criollo..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pet-age">Edad *</Label>
              <Input
                id="pet-age"
                type="text"
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
                placeholder="Ej: 2 años, 6 meses..."
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Género</Label>
              <div className="mt-1.5 flex gap-3">
                {(['Macho', 'Hembra'] as const).map((g) => {
                  const active = form.gender === g
                  return (
                    <label
                      key={g}
                      className={cn(
                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
                        active
                          ? 'border-[#e56c4c] bg-[#e56c4c] text-[#fffaf5]'
                          : 'border-[#dfe2dc] bg-[#f8f6f1] text-[#68716b] hover:border-[#e56c4c]/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="pet-gender"
                        value={g}
                        checked={active}
                        onChange={() => update('gender', g)}
                        className="hidden"
                      />
                      {g}
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="pet-weight">Peso</Label>
              <Input
                id="pet-weight"
                type="text"
                value={form.weight}
                onChange={(e) => update('weight', e.target.value)}
                placeholder="Ej: 12 kg, 3.5 kg..."
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pet-location">Ubicación *</Label>
              <Select
                id="pet-location"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className="mt-1.5 w-full"
                required
              >
                <option value="">Selecciona una ciudad</option>
                {CIUDADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pet-energy">Nivel de energía</Label>
              <Select
                id="pet-energy"
                value={form.energy}
                onChange={(e) => update('energy', e.target.value as Energy | '')}
                className="mt-1.5 w-full"
              >
                <option value="">Selecciona</option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="pet-image-file">Imagen *</Label>
            <Input
              id="pet-image-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                void handleImageFile(e.target.files?.[0] ?? null)
              }}
              className="mt-1.5"
              required={!isEditing}
            />
            {form.image && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-[#87918a]">Vista previa:</p>
                <div
                  className={cn(
                    'relative aspect-[4/3] w-48 overflow-hidden rounded-2xl',
                    form.tone && /^#/.test(form.tone) ? '' : form.tone || 'bg-[#ead9c6]'
                  )}
                  style={{ backgroundColor: /^#/.test(form.tone) ? form.tone : undefined }}
                >
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Tono / color de fondo</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {TONE_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update('tone', `bg-[${color}]`)}
                  className={cn(
                    'size-10 rounded-full border-2 transition',
                    form.tone === `bg-[${color}]`
                      ? 'border-[#25302b] scale-110'
                      : 'border-[#dfe2dc] hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Tono ${color}`}
                />
              ))}
              <div className="relative h-10 w-px bg-[#dfe2dc]" />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={/^#/.test(form.tone) ? form.tone : '#ead9c6'}
                  onChange={(e) => update('tone', e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={form.tone}
                  onChange={(e) => update('tone', e.target.value)}
                  placeholder="bg-[#...] o #hex"
                  className="w-40 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-0">Salud</Label>
              <div className="mt-2 space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dfe2dc] bg-[#f8f6f1] px-4 py-3 transition hover:border-[#52705a]/40">
                  <input
                    type="checkbox"
                    checked={form.vaccinated}
                    onChange={(e) => update('vaccinated', e.target.checked)}
                    className="size-4 accent-[#52705a]"
                  />
                  <span className="text-sm font-medium text-[#25302b]">Vacunado</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dfe2dc] bg-[#f8f6f1] px-4 py-3 transition hover:border-[#52705a]/40">
                  <input
                    type="checkbox"
                    checked={form.sterilized}
                    onChange={(e) => update('sterilized', e.target.checked)}
                    className="size-4 accent-[#52705a]"
                  />
                  <span className="text-sm font-medium text-[#25302b]">Esterilizado</span>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pet-personality">Personalidad (separado por comas)</Label>
                <Input
                  id="pet-personality"
                  type="text"
                  value={form.personality}
                  onChange={(e) => update('personality', e.target.value)}
                  placeholder="Ej: Tierno, Juguetón, Tranquilo"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="pet-goodwith">Se lleva bien con (separado por comas)</Label>
                <Input
                  id="pet-goodwith"
                  type="text"
                  value={form.good_with}
                  onChange={(e) => update('good_with', e.target.value)}
                  placeholder="Ej: Niños, Otros perros, Gatos"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="pet-about">Acerca de esta mascota</Label>
            <Textarea
              id="pet-about"
              value={form.about}
              onChange={(e) => update('about', e.target.value)}
              placeholder="Cuéntanos su historia, comportamiento y qué tipo de hogar le gustaría..."
              rows={4}
              className="mt-1.5"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-[#dfe2dc] bg-[#f8f6f1] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#dfe2dc] bg-[#fffaf5] px-6 py-2.5 text-sm font-semibold text-[#68716b] transition hover:border-[#cf593d] hover:text-[#cf593d]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#25302b] px-6 py-2.5 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#e56c4c] disabled:opacity-50"
          >
            <Save size={15} />
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar mascota'}
          </button>
        </div>
      </div>
    </div>
  )
}
