'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type PetFilters = {
  type?: 'Perro' | 'Gato'
  ageRange?: 'cachorro' | 'joven' | 'adulto' | 'senior'
  gender?: 'Macho' | 'Hembra'
  location?: string
  breed?: string
  vaccinated?: boolean
  sterilized?: boolean
  energy?: 'Baja' | 'Media' | 'Alta'
  goodWith?: string[]
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

const GOOD_WITH_OPTIONS = ['Niños', 'Otros perros', 'Gatos', 'Ancianos']

interface PetFilterModalProps {
  open: boolean
  onClose: () => void
  onApply: (filters: any, reset: boolean) => void
  initialFilters?: any
}

export default function PetFilterModal({ open, onClose, onApply, initialFilters = {} }: PetFilterModalProps) {
  const [type, setType] = useState<'Todos' | 'Perro' | 'Gato'>(initialFilters.type ?? 'Todos')
  const [ageRange, setAgeRange] = useState<string>(initialFilters.ageRange ?? '')
  const [gender, setGender] = useState<'Todos' | 'Macho' | 'Hembra'>(
    initialFilters.gender ? initialFilters.gender : 'Todos'
  )
  const [location, setLocation] = useState<string>(initialFilters.location ?? '')
  const [breed, setBreed] = useState<string>(initialFilters.breed ?? '')
  const [vaccinated, setVaccinated] = useState<boolean>(initialFilters.vaccinated ?? false)
  const [sterilized, setSterilized] = useState<boolean>(initialFilters.sterilized ?? false)
  const [energy, setEnergy] = useState<string>(initialFilters.energy ?? '')
  const [goodWith, setGoodWith] = useState<string[]>(initialFilters.goodWith ?? [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function toggleGoodWith(opt: string) {
    setGoodWith((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
  }

  function handleClear() {
    setType('Todos')
    setAgeRange('')
    setGender('Todos')
    setLocation('')
    setBreed('')
    setVaccinated(false)
    setSterilized(false)
    setEnergy('')
    setGoodWith([])
    onApply({}, true)
  }

  function handleApply() {
    const filters: any = {}
    if (type !== 'Todos') filters.type = type
    if (ageRange !== '') filters.ageRange = ageRange
    if (gender !== 'Todos') filters.gender = gender
    if (location !== '') filters.location = location
    if (breed !== '') filters.breed = breed
    if (vaccinated === true) filters.vaccinated = true
    if (sterilized === true) filters.sterilized = true
    if (energy !== '') filters.energy = energy
    if (goodWith.length > 0) filters.goodWith = goodWith
    onApply(filters, false)
  }

  return (
    (!open) ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#dfe2dc] bg-[#fffaf5] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#dfe2dc] bg-[#f8f6f1] px-6 py-5">
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#25302b]">Filtros de búsqueda</h2>
            <p className="mt-1 text-sm text-[#68716b]">Encuentra a tu compañero ideal</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="flex size-10 items-center justify-center rounded-full bg-[#fffaf5] text-[#25302b] shadow-sm transition hover:bg-[#e56c4c] hover:text-[#fffaf5]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <Label>Tipo</Label>
            <div className="mt-2 flex gap-3">
              {(['Todos', 'Perro', 'Gato'] as const).map((t) => (
                <label
                  key={t}
                  className={cn(
                    'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
                    type === t
                      ? 'border-[#e56c4c] bg-[#e56c4c] text-[#fffaf5]'
                      : 'border-[#dfe2dc] bg-[#f8f6f1] text-[#68716b] hover:border-[#e56c4c]/50'
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="hidden"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ageRange">Rango de edad</Label>
              <Select
                id="ageRange"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="mt-2 w-full"
              >
                <option value="">Todas las edades</option>
                <option value="cachorro">Cachorro (menos de 1 año)</option>
                <option value="joven">Joven (1 - 3 años)</option>
                <option value="adulto">Adulto (3 - 7 años)</option>
                <option value="senior">Senior (más de 7 años)</option>
              </Select>
            </div>

            <div>
              <Label>Género</Label>
              <div className="mt-2 flex gap-3">
                {(['Todos', 'Macho', 'Hembra'] as const).map((g) => (
                  <label
                    key={g}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition',
                      gender === g
                        ? 'border-[#52705a] bg-[#52705a] text-[#fffaf5]'
                        : 'border-[#dfe2dc] bg-[#f8f6f1] text-[#68716b] hover:border-[#52705a]/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="hidden"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 w-full"
              >
                <option value="">Todas las ciudades</option>
                {CIUDADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="breed">Raza</Label>
              <Input
                id="breed"
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ej: Labrador, Siamés..."
                className="mt-2 w-full"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-0">Salud</Label>
              <div className="mt-2 space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dfe2dc] bg-[#f8f6f1] px-4 py-3 transition hover:border-[#52705a]/40">
                  <input
                    type="checkbox"
                    checked={vaccinated}
                    onChange={(e) => setVaccinated(e.target.checked)}
                    className="size-4 accent-[#52705a]"
                  />
                  <span className="text-sm font-medium text-[#25302b]">Vacunado</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dfe2dc] bg-[#f8f6f1] px-4 py-3 transition hover:border-[#52705a]/40">
                  <input
                    type="checkbox"
                    checked={sterilized}
                    onChange={(e) => setSterilized(e.target.checked)}
                    className="size-4 accent-[#52705a]"
                  />
                  <span className="text-sm font-medium text-[#25302b]">Esterilizado</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="energy">Nivel de energía</Label>
              <Select
                id="energy"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                className="mt-2 w-full"
              >
                <option value="">Cualquier nivel</option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Se lleva bien con</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {GOOD_WITH_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition',
                    goodWith.includes(opt)
                      ? 'border-[#e56c4c] bg-[#e56c4c]/10 text-[#cf593d]'
                      : 'border-[#dfe2dc] bg-[#f8f6f1] text-[#25302b] hover:border-[#e56c4c]/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={goodWith.includes(opt)}
                    onChange={() => toggleGoodWith(opt)}
                    className="size-4 accent-[#e56c4c]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#dfe2dc] bg-[#f8f6f1] px-6 py-4">
          <button
            onClick={handleClear}
            className="rounded-full border border-[#dfe2dc] bg-[#fffaf5] px-6 py-2.5 text-sm font-semibold text-[#68716b] transition hover:border-[#e56c4c] hover:text-[#e56c4c]"
          >
            Limpiar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-[#dfe2dc] bg-[#fffaf5] px-6 py-2.5 text-sm font-semibold text-[#68716b] transition hover:border-[#52705a] hover:text-[#52705a]"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="rounded-full bg-[#25302b] px-6 py-2.5 text-sm font-semibold text-[#fffaf5] transition hover:bg-[#e56c4c]"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
    )
  )
}
