'use client'

import { useState, useEffect } from 'react'
import { X, Package, Heart, Share2, Gift, Send, Users, MessageSquare, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const MATERIALES = ['Alimento para perros y gatos', 'Medicinas y artículos de higiene', 'Cobijas y camas', 'Juguetes y collares']

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const [voluntario, setVoluntario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: '',
  })
  const [enviado, setEnviado] = useState(false)

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

  function handleVoluntarioSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviado(true)
    setTimeout(() => {
      setEnviado(false)
      setVoluntario({ nombre: '', email: '', telefono: '', mensaje: '' })
    }, 2500)
  }

  function handleShare(red: string) {
    alert(`Gracias por compartir en ${red}! (Función simulada)`)
  }

  return (
    (!open) ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#dfe2dc] bg-[#fffaf5] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#dfe2dc] bg-gradient-to-r from-[#e6eee1] via-[#f8f6f1] to-[#ead9c6] px-6 py-5">
          <div>
            <h2 className="font-serif text-2xl tracking-tight text-[#25302b]">
              ¿Cómo puedes ayudar?
            </h2>
            <p className="mt-1 text-sm text-[#68716b]">
              Cada gran cambio empieza con un pequeño gesto.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-10 items-center justify-center rounded-full bg-[#fffaf5] text-[#25302b] shadow-sm transition hover:bg-[#e56c4c] hover:text-[#fffaf5]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#ead9c6] text-[#9a624b]">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#25302b]">Dona materiales</h3>
                  <p className="text-xs text-[#68716b]">Artículos que siempre necesitamos</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {MATERIALES.map((m) => (
                  <li
                    key={m}
                    className="flex items-center gap-3 rounded-xl bg-[#f8f6f1] px-4 py-3 text-sm text-[#25302b]"
                  >
                    <Gift size={15} className="text-[#e56c4c]" />
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl border border-dashed border-[#dfe2dc] bg-[#fff5f0] p-3 text-xs text-[#cf593d]">
                  📦 Puedes dejar tus donaciones en cualquiera de nuestros refugios aliados o
                  coordinar la entrega por WhatsApp.
                </p>
              </div>

            <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#e6eee1] text-[#52705a]">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#25302b]">Hazte voluntario</h3>
                  <p className="text-xs text-[#68716b]">Únete a nuestro equipo</p>
                </div>
              </div>
              <form onSubmit={handleVoluntarioSubmit} className="mt-5 space-y-3">
                <div>
                  <Label htmlFor="v-nombre">Nombre completo</Label>
                  <Input
                    id="v-nombre"
                    type="text"
                    value={voluntario.nombre}
                    onChange={(e) => setVoluntario({ ...voluntario, nombre: e.target.value })}
                    placeholder="Tu nombre"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="v-email">Email</Label>
                    <Input
                      id="v-email"
                      type="email"
                      value={voluntario.email}
                      onChange={(e) => setVoluntario({ ...voluntario, email: e.target.value })}
                      placeholder="tu@email.com"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="v-tel">Teléfono</Label>
                    <Input
                      id="v-tel"
                      type="tel"
                      value={voluntario.telefono}
                      onChange={(e) => setVoluntario({ ...voluntario, telefono: e.target.value })}
                      placeholder="55 1234 5678"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="v-msg">¿Por qué quieres ser voluntario?</Label>
                  <Textarea
                    id="v-msg"
                    value={voluntario.mensaje}
                    onChange={(e) => setVoluntario({ ...voluntario, mensaje: e.target.value })}
                    placeholder="Cuéntanos un poco sobre ti..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviado}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#fffaf5] transition',
                    enviado
                      ? 'bg-[#52705a]'
                      : 'bg-[#52705a] hover:bg-[#3f5a47]'
                  )}
                >
                  {enviado ? (
                    <>¡Solicitud enviada! ♥</>
                  ) : (
                    <>
                      <Send size={15} /> Enviar solicitud
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#fde4dc] text-[#cf593d]">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#25302b]">Comparte en redes</h3>
                  <p className="text-xs text-[#68716b]">Ayúdanos a dar visibilidad</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-[#68716b]">
                Compartir los perfiles de nuestras mascotas ayuda a que lleguen a más personas
                ojos de quienes buscan un compañero. ¡Un click puede cambiar una vida.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShare('Facebook')}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <ExternalLink size={17} /> Facebook
                </button>
                <button
                  onClick={() => handleShare('WhatsApp')}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <MessageSquare size={17} /> WhatsApp
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-[#dfe2dc] bg-[#f8f6f1] p-3">
                <p className="text-xs text-[#68716b]">
                  💡 <strong className="text-[#25302b]">Tip:</strong> cada publicación
                  compartida incrementa en un 60% las posibilidades de adopción.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffaf5] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#e56c4c]/15 text-[#e56c4c]">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#25302b]">Padrinos</h3>
                  <p className="text-xs text-[#68716b]">Apadrinar una mascota</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[#68716b]">
                <p>
                  ¿Te encantaría ayudar pero no puedes adoptar en este momento? Conviértete en
                  <strong className="text-[#25302b]"> padrino o madrina</strong>.
                </p>
                <p>
                  Con una aportación mensual cubres alimento, atención veterinaria y
                gastos básicos de una mascota mientras encuentra su hogar definitivo.
                </p>
                <p>
                  Recibirás fotos, actualizaciones y podrás visitarla cuando quieras.
                </p>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-xs text-[#52705a]">
                  <span className="size-1.5 rounded-full bg-[#52705a]" />
                  Apadrinamientos desde $300 mxn al mes
                </li>
                <li className="flex items-center gap-2 text-xs text-[#52705a]">
                  <span className="size-1.5 rounded-full bg-[#52705a]" />
                  Deducible de impuestos
                </li>
                <li className="flex items-center gap-2 text-xs text-[#52705a]">
                  <span className="size-1.5 rounded-full bg-[#52705a]" />
                  Puedes cancelar cuando quieras
                </li>
              </ul>
              <button className="mt-5 w-full rounded-full border-2 border-[#e56c4c] bg-[#fffaf5] px-5 py-2.5 text-sm font-semibold text-[#e56c4c] transition hover:bg-[#e56c4c] hover:text-[#fffaf5]">
                Quiero ser padrino
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  )
}
