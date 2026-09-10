import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

type ReportType = 'pets' | 'requests' | 'users' | 'foundations'

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const admin_email = searchParams.get('admin_email')
    const type = searchParams.get('type') as ReportType | null

    if (!admin_email || !type) {
      return NextResponse.json(
        { ok: false, error: 'admin_email y type son requeridos.' },
        { status: 400 },
      )
    }

    if (!['pets', 'requests', 'users', 'foundations'].includes(type)) {
      return NextResponse.json(
        { ok: false, error: 'type debe ser pets, requests, users o foundations.' },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()

    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', admin_email.trim().toLowerCase())
      .maybeSingle()

    if (adminError && adminError.code !== 'PGRST116') {
      throw adminError
    }

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin no encontrado.' }, { status: 404 })
    }

    if (admin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
    }

    let csv = ''
    const rows: string[] = []

    if (type === 'pets') {
      const headers = [
        'id', 'nombre', 'tipo', 'raza', 'edad', 'peso', 'ubicacion',
        'fundacion', 'vacunado', 'esterilizado', 'energia', 'fecha_creacion',
      ]
      rows.push(headers.map(escapeCSV).join(','))

      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: false })

      if (petsError) {
        throw petsError
      }

      const { data: foundations } = await supabase
        .from('foundations')
        .select('id, name')

      const foundationMap = new Map((foundations ?? []).map((item) => [item.id, item.name]))

      for (const pet of pets ?? []) {
        rows.push(
          [
            pet.id,
            pet.name,
            pet.type,
            pet.breed || '',
            pet.age,
            pet.weight || '',
            pet.location,
            foundationMap.get(pet.foundation_id) || '',
            pet.vaccinated ? 'Sí' : 'No',
            pet.sterilized ? 'Sí' : 'No',
            pet.energy || '',
            pet.created_at,
          ]
            .map(escapeCSV)
            .join(','),
        )
      }
    } else if (type === 'requests') {
      const headers = [
        'id', 'mascota', 'adoptante_email', 'fundacion',
        'status', 'mensaje', 'fecha_visita', 'fecha_envio',
      ]
      rows.push(headers.map(escapeCSV).join(','))

      const { data: requests, error: requestsError } = await supabase
        .from('adoption_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (requestsError) {
        throw requestsError
      }

      const userIds = [...new Set((requests ?? []).map((request) => request.user_id))]
      const petIds = [...new Set((requests ?? []).map((request) => request.pet_id))]

      const { data: usersData } = userIds.length
        ? await supabase.from('users').select('id, email').in('id', userIds)
        : { data: [] }

      const { data: petsData } = petIds.length
        ? await supabase.from('pets').select('id, name, foundation_id').in('id', petIds)
        : { data: [] }

      const { data: foundationsData } = petIds.length
        ? await supabase.from('foundations').select('id, name').in('id', (petsData ?? []).map((pet) => pet.foundation_id).filter(Boolean))
        : { data: [] }

      const userMap = new Map((usersData ?? []).map((item) => [item.id, item.email]))
      const petMap = new Map((petsData ?? []).map((item) => [item.id, item]))
      const foundationMap = new Map((foundationsData ?? []).map((item) => [item.id, item.name]))

      for (const request of requests ?? []) {
        const pet = petMap.get(request.pet_id)
        rows.push(
          [
            request.id,
            pet?.name || '',
            userMap.get(request.user_id) || '',
            pet ? foundationMap.get(pet.foundation_id) || '' : '',
            request.status,
            request.message || '',
            request.scheduled_date || '',
            request.created_at,
          ]
            .map(escapeCSV)
            .join(','),
        )
      }
    } else if (type === 'users') {
      const headers = ['id', 'nombre', 'email', 'rol', 'fundacion', 'fecha_registro']
      rows.push(headers.map(escapeCSV).join(','))

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        throw usersError
      }

      const foundationIds = [...new Set((users ?? []).map((user) => user.foundation_id).filter(Boolean))]
      const { data: foundations } = foundationIds.length
        ? await supabase.from('foundations').select('id, name').in('id', foundationIds)
        : { data: [] }

      const foundationMap = new Map((foundations ?? []).map((item) => [item.id, item.name]))

      for (const user of users ?? []) {
        rows.push(
          [
            user.id,
            user.name,
            user.email,
            user.role,
            foundationMap.get(user.foundation_id) || '',
            user.created_at,
          ]
            .map(escapeCSV)
            .join(','),
        )
      }
    } else if (type === 'foundations') {
      const headers = [
        'id', 'nombre', 'email', 'ubicacion', 'telefono',
        'fecha_creacion', 'mascotas_publicadas',
      ]
      rows.push(headers.map(escapeCSV).join(','))

      const { data: foundations, error: foundationsError } = await supabase
        .from('foundations')
        .select('*')
        .order('created_at', { ascending: false })

      if (foundationsError) {
        throw foundationsError
      }

      for (const foundation of foundations ?? []) {
        const { data: petRows } = await supabase
          .from('pets')
          .select('id')
          .eq('foundation_id', foundation.id)

        rows.push(
          [
            foundation.id,
            foundation.name,
            foundation.email || '',
            foundation.location || '',
            foundation.phone || '',
            foundation.created_at,
            petRows?.length ?? 0,
          ]
            .map(escapeCSV)
            .join(','),
        )
      }
    }

    csv = rows.join('\r\n')

    const filename = `reporte_${type}_${formatDate()}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[admin/reports GET]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
