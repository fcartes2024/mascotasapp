import { NextResponse } from 'next/server'
import db, { type DBUser } from '@/lib/db'

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

    const admin = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(admin_email.trim().toLowerCase()) as DBUser | undefined

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

      const pets = db
        .prepare(
          `SELECT p.*, f.name as foundation_name
           FROM pets p
           LEFT JOIN foundations f ON p.foundation_id = f.id
           ORDER BY p.created_at DESC`,
        )
        .all() as Array<{
          id: number
          name: string
          type: string
          breed: string | null
          age: string
          weight: string | null
          location: string
          foundation_name: string | null
          vaccinated: number
          sterilized: number
          energy: string | null
          created_at: string
        }>

      for (const p of pets) {
        rows.push(
          [
            p.id,
            p.name,
            p.type,
            p.breed || '',
            p.age,
            p.weight || '',
            p.location,
            p.foundation_name || '',
            p.vaccinated ? 'Sí' : 'No',
            p.sterilized ? 'Sí' : 'No',
            p.energy || '',
            p.created_at,
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

      const requests = db
        .prepare(
          `SELECT ar.*, p.name as pet_name, u.email as user_email, f.name as foundation_name
           FROM adoption_requests ar
           LEFT JOIN pets p ON ar.pet_id = p.id
           LEFT JOIN users u ON ar.user_id = u.id
           LEFT JOIN foundations f ON p.foundation_id = f.id
           ORDER BY ar.created_at DESC`,
        )
        .all() as Array<{
          id: number
          pet_name: string | null
          user_email: string | null
          foundation_name: string | null
          status: string
          message: string | null
          scheduled_date: string | null
          created_at: string
        }>

      for (const r of requests) {
        rows.push(
          [
            r.id,
            r.pet_name || '',
            r.user_email || '',
            r.foundation_name || '',
            r.status,
            r.message || '',
            r.scheduled_date || '',
            r.created_at,
          ]
            .map(escapeCSV)
            .join(','),
        )
      }
    } else if (type === 'users') {
      const headers = ['id', 'nombre', 'email', 'rol', 'fundacion', 'fecha_registro']
      rows.push(headers.map(escapeCSV).join(','))

      const users = db
        .prepare(
          `SELECT u.*, f.name as foundation_name
           FROM users u
           LEFT JOIN foundations f ON u.foundation_id = f.id
           ORDER BY u.created_at DESC`,
        )
        .all() as Array<{
          id: number
          name: string
          email: string
          role: string
          foundation_name: string | null
          created_at: string
        }>

      for (const u of users) {
        rows.push(
          [
            u.id,
            u.name,
            u.email,
            u.role,
            u.foundation_name || '',
            u.created_at,
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

      const foundations = db
        .prepare('SELECT * FROM foundations ORDER BY created_at DESC')
        .all() as Array<{
          id: number
          name: string
          email: string | null
          location: string | null
          phone: string | null
          created_at: string
        }>

      for (const f of foundations) {
        const petCount = db
          .prepare('SELECT COUNT(*) as count FROM pets WHERE foundation_id = ?')
          .get(f.id) as { count: number }

        rows.push(
          [
            f.id,
            f.name,
            f.email || '',
            f.location || '',
            f.phone || '',
            f.created_at,
            petCount.count,
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
