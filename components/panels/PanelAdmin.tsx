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
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PanelAdminProps = {
  user: User
  initialTab?: 'solicitudes' | 'fundaciones' | 'reportes'
}

type RequestItem = {
  id: number
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'completada'
  message: string | null
  scheduled_date: string | null
  created_at: string
  pet: { id: number; name: string; image: string; location?: string }
  user: { id: number; name: string; email: string }
  foundation: { id: number; name: string }
}

type FoundationItem = {
  id: number
  name: string
  description: string | null
  location: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
  created_at: string
  pets_count: number
  users_count: number
  verified?: number
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

type StatusFilter = 'todas' | 'pendiente' | 'aprobada' | 'rechazada' | 'completada'

export default function PanelAdmin({ user, initialTab }: PanelAdminProps) {
  const [tab, setTab] = useState<'solicitudes' | 'fundaciones' | 'reportes'>(initialTab ?? 'solicitudes')
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loadingReq, setLoadingReq] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')

  const [foundations, setFoundations] = useState<FoundationItem[]>([])
  const [loadingFound, setLoadingFound] = useState(false)
  const [foundationFilter, setFoundationFilter] = useState<'todas' | 'nuevas'>('nuevas')

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTab(initialTab ?? 'solicitudes')
    if (initialTab === 'fundaciones') setFoundationFilter('nuevas')
  }, [initialTab])

  useEffect(() => {
    if (tab === 'solicitudes') loadRequests(statusFilter)
  }, [tab, statusFilter, user.email])

  useEffect(() => {
    if (tab === 'fundaciones') loadFoundations()
  }, [tab, user.email])

  async function loadRequests(filter: StatusFilter) {
    setLoadingReq(true)
    setError(null)
    try {
      let url = `/api/requests?admin_email=${encodeURIComponent(user.email)}`
      if (filter !== 'todas') {
        url += `&status=${encodeURIComponent(filter)}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudieron cargar las solicitudes')
      setRequests(data.requests ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoadingReq(false)
    }
  }

  async function loadFoundations() {
    setLoadingFound(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/foundations?admin_email=${encodeURIComponent(user.email)}`,
      )
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudieron cargar las fundaciones')
      setFoundations(data.foundations ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoadingFound(false)
    }
  }

  async function verificarFoundation(fId: number) {
    try {
      const res = await fetch(
        `/api/admin/foundations?admin_email=${encodeURIComponent(
          user.email,
        )}&foundation_id=${fId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verified: 1 }),
        },
      )
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'No se pudo verificar')
      setFoundations((prev) =>
        prev.map((f) => (f.id === fId ? { ...f, verified: 1 } : f)),
      )
      alert('Fundación verificada correctamente.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  function reportUrl(type: 'pets' | 'requests' | 'users' | 'foundations') {
    return `/api/admin/reports?admin_email=${encodeURIComponent(user.email)}&type=${type}`
  }

  function countsByStatus(arr: RequestItem[]) {
    const c: Record<string, number> = { pendiente: 0, aprobada: 0, rechazada: 0, completada: 0 }
    for (const r of arr) c[r.status] = (c[r.status] ?? 0) + 1
    return c
  }

  const counts = countsByStatus(requests)
  const pendingFoundations = foundations.filter((f) => !f.verified)
  const visibleFoundations =
    foundationFilter === 'nuevas' ? pendingFoundations : foundations

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full" id="panel-admin-contenido">
      <TabsList>
        <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
        <TabsTrigger value="fundaciones">Fundaciones</TabsTrigger>
        <TabsTrigger value="reportes">Reportes</TabsTrigger>
      </TabsList>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <TabsContent value="solicitudes">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[#52705a] font-medium">Filtrar:</span>
            {(['todas', 'pendiente', 'aprobada', 'rechazada', 'completada'] as StatusFilter[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === s
                      ? 'bg-[#25302b] text-[#fffaf5]'
                      : 'bg-[#f8f6f1] border border-[#dfe2dc] text-[#52705a] hover:bg-[#fffaf5]'
                  }`}
                >
                  {s === 'todas' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== 'todas' && (
                    <span className="ml-1.5 opacity-75">({counts[s] ?? 0})</span>
                  )}
                </button>
              ),
            )}
          </div>
          <div className="text-xs text-[#52705a] opacity-80">
            Total: {requests.length} solicitudes
          </div>
        </div>

        {loadingReq ? (
          <div className="text-[#52705a] text-sm py-8 text-center">Cargando solicitudes…</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-[#52705a]">
            <p className="text-lg font-medium">No se encontraron solicitudes.</p>
            <p className="text-sm mt-1 opacity-80">Cambia el filtro para ver más resultados.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Mascota</TableHead>
                <TableHead>Adoptante</TableHead>
                <TableHead>Fundación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="max-w-xs">Mensaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-[#52705a] font-mono text-xs">#{r.id}</TableCell>
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
                  <TableCell>
                    <div>
                      <p className="font-medium text-[#25302b]">{r.user.name}</p>
                      <p className="text-xs text-[#52705a]">{r.user.email}</p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="fundaciones">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFoundationFilter('nuevas')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                foundationFilter === 'nuevas'
                  ? 'bg-[#25302b] text-[#fffaf5]'
                  : 'bg-[#f8f6f1] border border-[#dfe2dc] text-[#52705a]'
              }`}
            >
              Nuevas pendientes ({pendingFoundations.length})
            </button>
            <button
              onClick={() => setFoundationFilter('todas')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                foundationFilter === 'todas'
                  ? 'bg-[#25302b] text-[#fffaf5]'
                  : 'bg-[#f8f6f1] border border-[#dfe2dc] text-[#52705a]'
              }`}
            >
              Todas ({foundations.length})
            </button>
          </div>
        </div>
        {loadingFound ? (
          <div className="text-[#52705a] text-sm py-8 text-center">Cargando fundaciones…</div>
        ) : visibleFoundations.length === 0 ? (
          <div className="text-center py-12 text-[#52705a]">
            <p className="text-lg font-medium">
              {foundationFilter === 'nuevas'
                ? 'No hay fundaciones pendientes de revisión.'
                : 'No hay fundaciones registradas.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fundación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Mascotas</TableHead>
                <TableHead className="text-center">Usuarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleFoundations.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="text-[#52705a] font-mono text-xs">#{f.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f8f6f1] border border-[#dfe2dc]">
                        {f.logo_url ? (
                          <img
                            src={f.logo_url}
                            alt={f.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#52705a] font-serif">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#25302b]">{f.name}</p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            f.verified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.verified ? 'Verificada' : 'Pendiente'}
                        </span>
                        {f.description && (
                          <p className="text-xs text-[#52705a] line-clamp-1 max-w-xs">
                            {f.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {f.email && <p className="text-[#25302b]">{f.email}</p>}
                      {f.phone && <p className="text-[#52705a]">{f.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#52705a] text-sm">
                    {f.location || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block rounded-lg bg-[#e6eee1] text-[#52705a] px-2.5 py-1 text-xs font-bold">
                      {f.pets_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block rounded-lg bg-[#ead9c6] text-[#9a624b] px-2.5 py-1 text-xs font-bold">
                      {f.users_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => verificarFoundation(f.id)}
                        size="sm"
                        className="bg-[#52705a] text-[#fffaf5] hover:opacity-90"
                        disabled={!!f.verified}
                      >
                        {f.verified ? 'Verificada' : 'Verificar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          alert(
                            [
                              `#${f.id} · ${f.name}`,
                              f.email ? `Email: ${f.email}` : '',
                              f.phone ? `Tel: ${f.phone}` : '',
                              f.location ? `Ubicación: ${f.location}` : '',
                              f.description ? `\n${f.description}` : '',
                            ]
                              .filter(Boolean)
                              .join('\n'),
                          )
                        }
                        className="border-[#dfe2dc] text-[#25302b] hover:bg-[#f8f6f1]"
                      >
                        Ver
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="reportes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#e6eee1] text-[#52705a] font-serif">
                  🐾
                </span>
                <span className="text-[#25302b]">Mascotas publicadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-[#52705a]">
                Reporte CSV con listado completo de mascotas publicadas, incluyendo fundación, estado de vacunación y
                esterilización, energía y fecha de registro.
              </p>
            </CardContent>
            <CardFooter className="pt-0 justify-end">
              <a
                href={reportUrl('pets')}
                download
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-3 bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity no-underline"
              >
                Descargar CSV
              </a>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#ead9c6] text-[#9a624b] font-serif">
                  📋
                </span>
                <span className="text-[#25302b]">Solicitudes de adopción</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-[#52705a]">
                Reporte CSV con todas las solicitudes de adopción, sus estatus, adoptantes, fundaciones asociadas y
                fecha de visita agendada.
              </p>
            </CardContent>
            <CardFooter className="pt-0 justify-end">
              <a
                href={reportUrl('requests')}
                download
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-3 bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity no-underline"
              >
                Descargar CSV
              </a>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#ead9c6] text-[#e56c4c] font-serif">
                  👥
                </span>
                <span className="text-[#25302b]">Usuarios registrados</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-[#52705a]">
                Reporte CSV con el padrón de usuarios del sistema: adoptantes, fundaciones y administradores con su
                rol y fecha de registro.
              </p>
            </CardContent>
            <CardFooter className="pt-0 justify-end">
              <a
                href={reportUrl('users')}
                download
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-3 bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity no-underline"
              >
                Descargar CSV
              </a>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#e6eee1] text-[#25302b] font-serif">
                  🏠
                </span>
                <span className="text-[#25302b]">Fundaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-[#52705a]">
                Reporte CSV con el listado de fundaciones, su información de contacto, ubicación, cantidad de mascotas
                publicadas y fecha de registro.
              </p>
            </CardContent>
            <CardFooter className="pt-0 justify-end">
              <a
                href={reportUrl('foundations')}
                download
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-8 px-3 bg-[#25302b] text-[#fffaf5] hover:opacity-90 transition-opacity no-underline"
              >
                Descargar CSV
              </a>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
