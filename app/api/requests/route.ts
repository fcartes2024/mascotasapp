import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('user_email')
    const foundationEmail = searchParams.get('foundation_email')
    const adminEmail = searchParams.get('admin_email')
    const statusFilter = searchParams.get('status')

    if (statusFilter) {
      const validStatuses = ['pendiente', 'aprobada', 'rechazada', 'completada']
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { ok: false, error: 'Status inválido.' },
          { status: 400 },
        )
      }
    }

    if (!userEmail && !foundationEmail && !adminEmail) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere user_email, foundation_email o admin_email.' },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()

    let user: any = null
    let foundation: any = null
    let admin: any = null

    if (userEmail) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail.trim().toLowerCase())
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      if (!userData) {
        return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
      }

      user = userData
    }

    if (foundationEmail) {
      const { data: foundationData, error: foundationError } = await supabase
        .from('foundations')
        .select('*')
        .eq('email', foundationEmail.trim().toLowerCase())
        .maybeSingle()

      if (foundationError && foundationError.code !== 'PGRST116') {
        throw foundationError
      }

      if (!foundationData) {
        return NextResponse.json({ ok: false, error: 'Fundación no encontrada.' }, { status: 404 })
      }

      foundation = foundationData
    }

    if (adminEmail) {
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', adminEmail.trim().toLowerCase())
        .maybeSingle()

      if (adminError && adminError.code !== 'PGRST116') {
        throw adminError
      }

      if (!adminData) {
        return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
      }

      admin = adminData

      if (admin.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Permisos insuficientes.' }, { status: 403 })
      }
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from('adoption_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (requestsError) {
      throw requestsError
    }

    const petIds = [...new Set((requestsData ?? []).map((request) => request.pet_id))]
    const userIds = [...new Set((requestsData ?? []).map((request) => request.user_id))]

    const { data: petsData } = petIds.length
      ? await supabase.from('pets').select('id, name, type, image, location, foundation_id').in('id', petIds)
      : { data: [] }

    const { data: usersData } = userIds.length
      ? await supabase.from('users').select('id, name, email').in('id', userIds)
      : { data: [] }

    const foundationIds = [...new Set((petsData ?? []).map((pet) => pet.foundation_id).filter(Boolean))]
    const { data: foundationsData } = foundationIds.length
      ? await supabase.from('foundations').select('id, name').in('id', foundationIds)
      : { data: [] }

    const userMap = new Map((usersData ?? []).map((u) => [u.id, u]))
    const petMap = new Map((petsData ?? []).map((p) => [p.id, p]))
    const foundationMap = new Map((foundationsData ?? []).map((f) => [f.id, f.name]))

    const filteredRequests = (requestsData ?? []).filter((request) => {
      if (userEmail && request.user_id !== user.id) {
        return false
      }

      if (foundationEmail) {
        const pet = petMap.get(request.pet_id)
        if (!pet || pet.foundation_id !== foundation.id) {
          return false
        }
      }

      if (statusFilter && request.status !== statusFilter) {
        return false
      }

      return true
    })

    const requests = filteredRequests.map((request) => {
      const userItem = userMap.get(request.user_id)
      const petItem = petMap.get(request.pet_id)
      const foundationName = petItem ? foundationMap.get(petItem.foundation_id) ?? '' : ''

      return {
        id: request.id,
        status: request.status,
        message: request.message,
        scheduled_date: request.scheduled_date,
        application: parseJSON<unknown>(request.application),
        created_at: request.created_at,
        user: {
          id: userItem?.id ?? request.user_id,
          name: userItem?.name ?? '',
          email: userItem?.email ?? '',
        },
        pet: {
          id: petItem?.id ?? request.pet_id,
          name: petItem?.name ?? '',
          type: petItem?.type ?? '',
          image: petItem?.image ?? '',
          location: petItem?.location ?? '',
        },
        foundation: {
          id: petItem?.foundation_id ?? null,
          name: foundationName,
        },
      }
    })

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

    const supabase = getSupabaseClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user_email.trim().toLowerCase())
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    if (user.role !== 'usuario') {
      return NextResponse.json(
        { ok: false, error: 'Solo los adoptantes pueden enviar solicitudes.' },
        { status: 403 },
      )
    }

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id, foundation_id')
      .eq('id', pet_id)
      .maybeSingle()

    if (petError && petError.code !== 'PGRST116') {
      throw petError
    }

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const { data: existingRequests, error: existingError } = await supabase
      .from('adoption_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('pet_id', pet_id)

    if (existingError) {
      throw existingError
    }

    const hasActive = (existingRequests ?? []).some(
      (existing) => existing.status !== 'rechazada' && existing.status !== 'completada',
    )

    if (hasActive) {
      return NextResponse.json(
        { ok: false, error: 'Ya tienes una solicitud activa para esta mascota.' },
        { status: 409 },
      )
    }

    const { data: insertedRequest, error: insertError } = await supabase
      .from('adoption_requests')
      .insert([
        {
          user_id: user.id,
          pet_id,
          status: 'pendiente',
          message: message?.trim() || null,
          scheduled_date: scheduled_date?.trim() || null,
          application: application ? JSON.stringify(application) : null,
        },
      ])
      .select('*')
      .single()

    if (insertError) {
      throw insertError
    }

    const { data: foundationData } = pet.foundation_id
      ? await supabase.from('foundations').select('id, name').eq('id', pet.foundation_id).maybeSingle()
      : { data: null }

    const request = {
      id: insertedRequest.id,
      status: insertedRequest.status,
      message: insertedRequest.message,
      scheduled_date: insertedRequest.scheduled_date,
      application: parseJSON<unknown>(insertedRequest.application),
      created_at: insertedRequest.created_at,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      pet: {
        id: pet.id,
        name: pet.name ?? '',
        type: pet.type ?? '',
        image: pet.image ?? '',
        location: pet.location ?? '',
      },
      foundation: {
        id: foundationData?.id ?? pet.foundation_id ?? null,
        name: foundationData?.name ?? '',
      },
    }

    return NextResponse.json({ ok: true, request })
  } catch (err) {
    console.error('[requests/POST]', err)
    return NextResponse.json({ ok: false, error: 'Error al crear solicitud.' }, { status: 500 })
  }
}
