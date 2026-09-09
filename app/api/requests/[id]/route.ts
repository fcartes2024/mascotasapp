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

const VALID_STATUSES = ['pendiente', 'aprobada', 'rechazada', 'completada'] as const
type ValidStatus = (typeof VALID_STATUSES)[number]

type RequestRow = DBAdoptionRequest & {
  user_id_req: number
  pet_id_req: number
  status_req: string
  message_req: string | null
  scheduled_date_req: string | null
  request_created_at: string
  user_name: string
  user_email: string
  pet_name: string
  pet_type: string
  pet_image: string
  pet_location: string
  foundation_id: number
  foundation_name: string
  user_id: number
  pet_id: number
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const requestId = Number(id)
    if (!requestId || isNaN(requestId)) {
      return NextResponse.json({ ok: false, error: 'ID de solicitud inválido.' }, { status: 400 })
    }

    const body = (await req.json()) as {
      status?: string
      message?: string
      scheduled_date?: string
      action_by_email?: string
    }

    const { status, message, scheduled_date, action_by_email } = body

    if (!action_by_email) {
      return NextResponse.json(
        { ok: false, error: 'action_by_email es requerido.' },
        { status: 400 },
      )
    }

    if (!status) {
      return NextResponse.json({ ok: false, error: 'status es requerido.' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json(
        { ok: false, error: 'Status inválido. Valores permitidos: pendiente, aprobada, rechazada, completada.' },
        { status: 400 },
      )
    }

    const actor = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(action_by_email.trim().toLowerCase()) as DBUser | undefined

    if (!actor) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const existingRequest = db
      .prepare('SELECT * FROM adoption_requests WHERE id = ?')
      .get(requestId) as DBAdoptionRequest | undefined

    if (!existingRequest) {
      return NextResponse.json({ ok: false, error: 'Solicitud no encontrada.' }, { status: 404 })
    }

    const pet = db
      .prepare('SELECT * FROM pets WHERE id = ?')
      .get(existingRequest.pet_id) as DBPet | undefined

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const isOwner = actor.id === existingRequest.user_id
    const isAdmin = actor.role === 'admin'
    const isFoundationOfPet =
      actor.role === 'fundacion' &&
      actor.foundation_id !== null &&
      pet.foundation_id !== null &&
      actor.foundation_id === pet.foundation_id

    if (!isOwner && !isAdmin && !isFoundationOfPet) {
      return NextResponse.json(
        { ok: false, error: 'No tienes permisos para modificar esta solicitud.' },
        { status: 403 },
      )
    }

    const updateFields: string[] = []
    const updateParams: Array<string | number | null> = []

    updateFields.push('status = ?')
    updateParams.push(status)

    if (message !== undefined) {
      updateFields.push('message = ?')
      updateParams.push(message || null)
    }

    if (scheduled_date !== undefined) {
      updateFields.push('scheduled_date = ?')
      updateParams.push(scheduled_date || null)
    }

    updateParams.push(requestId)

    db.prepare(
      `UPDATE adoption_requests SET ${updateFields.join(', ')} WHERE id = ?`,
    ).run(...updateParams)

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
    console.error('[requests/[id]/PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error al actualizar solicitud.' }, { status: 500 })
  }
}
