import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const admin_email = searchParams.get('admin_email')

    if (!admin_email) {
      return NextResponse.json({ ok: false, error: 'admin_email es requerido.' }, { status: 400 })
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

    const { data: foundations, error: foundationsError } = await supabase
      .from('foundations')
      .select('*')
      .order('created_at', { ascending: false })

    if (foundationsError) {
      throw foundationsError
    }

    const result = [] as Array<{
      id: number
      name: string
      description: string | null
      location: string | null
      email: string | null
      phone: string | null
      logo_url: string | null
      verified: number
      created_at: string
      pets_count: number
      users_count: number
    }>

    for (const foundation of foundations ?? []) {
      const { data: petRows } = await supabase
        .from('pets')
        .select('id')
        .eq('foundation_id', foundation.id)

      const { data: userRows } = await supabase
        .from('users')
        .select('id')
        .eq('foundation_id', foundation.id)

      result.push({
        id: foundation.id,
        name: foundation.name,
        description: foundation.description,
        location: foundation.location,
        email: foundation.email,
        phone: foundation.phone,
        logo_url: foundation.logo_url,
        verified: Number(foundation.verified ?? 1),
        created_at: foundation.created_at,
        pets_count: petRows?.length ?? 0,
        users_count: userRows?.length ?? 0,
      })
    }

    return NextResponse.json({ ok: true, foundations: result })
  } catch (err) {
    console.error('[admin/foundations GET]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const admin_email = searchParams.get('admin_email')
    const foundation_id = searchParams.get('foundation_id')

    if (!admin_email || !foundation_id) {
      return NextResponse.json(
        { ok: false, error: 'admin_email y foundation_id son requeridos.' },
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

    const fId = Number(foundation_id)
    if (!fId || isNaN(fId)) {
      return NextResponse.json({ ok: false, error: 'foundation_id inválido.' }, { status: 400 })
    }

    const { data: foundation, error: foundationError } = await supabase
      .from('foundations')
      .select('*')
      .eq('id', fId)
      .maybeSingle()

    if (foundationError && foundationError.code !== 'PGRST116') {
      throw foundationError
    }

    if (!foundation) {
      return NextResponse.json({ ok: false, error: 'Fundación no encontrada.' }, { status: 404 })
    }

    const body = (await req.json()) as {
      verified?: 0 | 1
      name?: string
      description?: string
      location?: string
      email?: string
      phone?: string
      logo_url?: string
    }

    const update: Record<string, unknown> = {}

    if (body.verified !== undefined) {
      update.verified = body.verified ? 1 : 0
    }
    if (body.name !== undefined) update.name = body.name.trim()
    if (body.description !== undefined) update.description = body.description || null
    if (body.location !== undefined) update.location = body.location || null
    if (body.email !== undefined) update.email = body.email || null
    if (body.phone !== undefined) update.phone = body.phone || null
    if (body.logo_url !== undefined) update.logo_url = body.logo_url || null

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabase
        .from('foundations')
        .update(update)
        .eq('id', fId)

      if (updateError) {
        throw updateError
      }
    }

    const { data: updatedFoundation, error: updatedError } = await supabase
      .from('foundations')
      .select('*')
      .eq('id', fId)
      .maybeSingle()

    if (updatedError && updatedError.code !== 'PGRST116') {
      throw updatedError
    }

    return NextResponse.json({
      ok: true,
      foundation: updatedFoundation,
    })
  } catch (err) {
    console.error('[admin/foundations PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
