import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const VALID_STATUSES = ['pendiente', 'aprobada', 'rechazada', 'completada'] as const

type ValidStatus = (typeof VALID_STATUSES)[number]

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

    const supabase = getSupabaseClient()

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('*')
      .eq('email', action_by_email.trim().toLowerCase())
      .maybeSingle()

    if (actorError && actorError.code !== 'PGRST116') {
      throw actorError
    }

    if (!actor) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const { data: existingRequest, error: existingRequestError } = await supabase
      .from('adoption_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (existingRequestError && existingRequestError.code !== 'PGRST116') {
      throw existingRequestError
    }

    if (!existingRequest) {
      return NextResponse.json({ ok: false, error: 'Solicitud no encontrada.' }, { status: 404 })
    }

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', existingRequest.pet_id)
      .maybeSingle()

    if (petError && petError.code !== 'PGRST116') {
      throw petError
    }

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

    const update: Record<string, unknown> = {
      status,
      message: message !== undefined ? message || null : existingRequest.message,
      scheduled_date: scheduled_date !== undefined ? scheduled_date || null : existingRequest.scheduled_date,
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('adoption_requests')
      .update(update)
      .eq('id', requestId)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', updatedRequest.user_id)
      .maybeSingle()

    const { data: foundationData } = pet.foundation_id
      ? await supabase.from('foundations').select('id, name').eq('id', pet.foundation_id).maybeSingle()
      : { data: null }

    const request = {
      id: updatedRequest.id,
      status: updatedRequest.status,
      message: updatedRequest.message,
      scheduled_date: updatedRequest.scheduled_date,
      created_at: updatedRequest.created_at,
      user: {
        id: userData?.id ?? updatedRequest.user_id,
        name: userData?.name ?? '',
        email: userData?.email ?? '',
      },
      pet: {
        id: pet.id,
        name: pet.name,
        type: pet.type,
        image: pet.image,
        location: pet.location,
      },
      foundation: {
        id: foundationData?.id ?? pet.foundation_id ?? null,
        name: foundationData?.name ?? '',
      },
    }

    return NextResponse.json({ ok: true, request })
  } catch (err) {
    console.error('[requests/[id]/PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error al actualizar solicitud.' }, { status: 500 })
  }
}
