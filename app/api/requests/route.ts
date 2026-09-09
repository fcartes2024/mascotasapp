import { NextResponse } from 'next/server'
import db, { type DBUser, type DBFoundation, type DBPet, type DBAdoptionRequest } from '@/lib/db'

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

type RequestRow = DBAdoptionRequest &
  DBUser &
  DBPet &
  DBFoundation & {
    request_id: number
    user_id_req: number
    pet_id_req: number
    status_req: string
    message_req: string | null
    scheduled_date_req: string | null
    application_req: string | null
    request_created_at: string
    user_name: string
    user_email: string
    pet_name: string
    pet_type: string
    pet_image: string
    pet_location: string
    foundation_name: string
  }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('user_email')
    const foundationEmail = searchParams.get('foundation_email')
    const adminEmail = searchParams.get('admin_email')
    const statusFilter = searchParams.get('status')

    const filters: string[] = []
    const params: Array<string | number> = []

    if (userEmail) {
      const user = db
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(userEmail.trim().toLowerCase()) as DBUser | undefined

      if (!user) {
        return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
      }
      filters.push('r.user_id = ?')
      params.push(user.id)
    }

    if (foundationEmail) {
      const foundation = db
        .prepare('SELECT * FROM foundations WHERE email = ?')
        .get(foundationEmail.trim().toLowerCase()) as DBFoundation | undefined

      if (!foundation) {
        return NextResponse.json({ ok: false, error: 'Fundación no encontrada.' }, { status: 404 })
      }
      filters.push('p.foundation_id = ?')
      params.push(foundation.id)
    }

    if (adminEmail) {
      const admin = db
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(adminEmail.trim().toLowerCase()) as DBUser | undefined

      if (!admin) {
        return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
      }
      if (admin.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Permisos insuficientes.' }, { status: 403 })
      }
    }

    if (!userEmail && !foundationEmail && !adminEmail) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere user_email, foundation_email o admin_email.' },
        { status: 400 },
      )
    }

    if (statusFilter) {
      const validStatuses = ['pendiente', 'aprobada', 'rechazada', 'completada']
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { ok: false, error: 'Status inválido.' },
          { status: 400 },
        )
      }
      filters.push('r.status = ?')
      params.push(statusFilter)
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''

    const query = `
      SELECT
        r.id AS request_id,
        r.user_id AS user_id_req,
        r.pet_id AS pet_id_req,
        r.status AS status_req,
        r.message AS message_req,
        r.scheduled_date AS scheduled_date_req,
        r.application AS application_req,
        r.created_at AS request_created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        p.id AS pet_id,
        p.name AS pet_name,
        p.type AS pet_type,
        p.image AS pet_image,
        p.location AS pet_location,
        f.id AS foundation_id,
        f.name AS foundation_name
      FROM adoption_requests r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN pets p ON r.pet_id = p.id
      INNER JOIN foundations f ON p.foundation_id = f.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `

    const rows = db.prepare(query).all(...params) as RequestRow[]

    const requests = rows.map((r) => ({
      id: r.request_id,
      status: r.status_req as DBAdoptionRequest['status'],
      message: r.message_req,
      scheduled_date: r.scheduled_date_req,
      application: parseJSON<unknown>(r.application_req),
      created_at: r.request_created_at,
      user: {
        id: r.user_id,
        name: r.user_name,
        email: r.user_email,
      },
      pet: {
        id: r.pet_id,
        name: r.pet_name,
        type: r.pet_type,
        image: r.pet_image,
        location: r.pet_location,
      },
      foundation: {
        id: r.foundation_id,
        name: r.foundation_name,
      },
    }))

    return NextResponse.json({ ok: true, requests })
  } catch (err) {
    console.error('[requests/GET]', err)
    return NextResponse.json({ ok: false, error: 'Error al cargar solicitudes.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      user_email?: string
      pet_id?: number
      message?: string
      scheduled_date?: string
      application?: unknown
    }

    const { user_email, pet_id, message, scheduled_date, application } = body

    if (!user_email || !pet_id) {
      return NextResponse.json(
        { ok: false, error: 'user_email y pet_id son requeridos.' },
        { status: 400 },
      )
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(user_email.trim().toLowerCase()) as DBUser | undefined

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    if (user.role !== 'usuario') {
      return NextResponse.json(
        { ok: false, error: 'Solo los adoptantes pueden enviar solicitudes.' },
        { status: 403 },
      )
    }

    const pet = db.prepare('SELECT id FROM pets WHERE id = ?').get(pet_id) as
      | { id: number }
      | undefined

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const existing = db
      .prepare("SELECT id FROM adoption_requests WHERE user_id = ? AND pet_id = ? AND status != 'rechazada' AND status != 'completada'")
      .get(user.id, pet_id)

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Ya tienes una solicitud activa para esta mascota.' },
        { status: 409 },
      )
    }

    const result = db
      .prepare(
        'INSERT INTO adoption_requests (user_id, pet_id, status, message, scheduled_date, application) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        user.id,
        pet_id,
        'pendiente',
        message?.trim() || null,
        scheduled_date?.trim() || null,
        application ? JSON.stringify(application) : null,
      )

    const requestId = Number(result.lastInsertRowid)

    const updatedRow = db
      .prepare(
        `
        SELECT
          r.id AS request_id,
          r.user_id AS user_id_req,
          r.pet_id AS pet_id_req,
          r.status AS status_req,
          r.message AS message_req,
          r.scheduled_date AS scheduled_date_req,
          r.application AS application_req,
          r.created_at AS request_created_at,
          u.id AS user_id,
          u.name AS user_name,
          u.email AS user_email,
          p.id AS pet_id,
          p.name AS pet_name,
          p.type AS pet_type,
          p.image AS pet_image,
          p.location AS pet_location,
          f.id AS foundation_id,
          f.name AS foundation_name
        FROM adoption_requests r
        INNER JOIN users u ON r.user_id = u.id
        INNER JOIN pets p ON r.pet_id = p.id
        INNER JOIN foundations f ON p.foundation_id = f.id
        WHERE r.id = ?
      `,
      )
      .get(requestId) as RequestRow

    const request = {
      id: updatedRow.request_id,
      status: updatedRow.status_req as DBAdoptionRequest['status'],
      message: updatedRow.message_req,
      scheduled_date: updatedRow.scheduled_date_req,
      application: parseJSON<unknown>(updatedRow.application_req),
      created_at: updatedRow.request_created_at,
      user: {
        id: updatedRow.user_id,
        name: updatedRow.user_name,
        email: updatedRow.user_email,
      },
      pet: {
        id: updatedRow.pet_id,
        name: updatedRow.pet_name,
        type: updatedRow.pet_type,
        image: updatedRow.pet_image,
        location: updatedRow.pet_location,
      },
      foundation: {
        id: updatedRow.foundation_id,
        name: updatedRow.foundation_name,
      },
    }

    return NextResponse.json({ ok: true, request })
  } catch (err) {
    console.error('[requests/POST]', err)
    return NextResponse.json({ ok: false, error: 'Error al crear solicitud.' }, { status: 500 })
  }
}
