import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getSupabaseClient } from '@/lib/supabase'

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email es requerido.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const lowerEmail = email.trim().toLowerCase()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    let foundation = null
    if (user.foundation_id) {
      const { data: foundationData, error: foundationError } = await supabase
        .from('foundations')
        .select('*')
        .eq('id', user.foundation_id)
        .maybeSingle()

      if (foundationError && foundationError.code !== 'PGRST116') {
        throw foundationError
      }

      foundation = foundationData
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at,
        foundation,
      },
    })
  } catch (err) {
    console.error('[users/me]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      email: string
      name?: string
      avatar?: string
      current_password?: string
      new_password?: string
      foundation_id?: number
      name_foundation?: string
      description?: string
      location?: string
      email_foundation?: string
      phone?: string
      logo_url?: string
      available_slots?: string
    }

    const { email } = body
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email es requerido.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const lowerEmail = email.trim().toLowerCase()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    if (body.new_password) {
      if (!body.current_password) {
        return NextResponse.json({ ok: false, error: 'Contraseña actual es requerida.' }, { status: 400 })
      }
      if (user.password_hash !== hash(body.current_password)) {
        return NextResponse.json({ ok: false, error: 'Contraseña actual incorrecta.' }, { status: 401 })
      }

      const { error: updatePasswordError } = await supabase
        .from('users')
        .update({ password_hash: hash(body.new_password) })
        .eq('id', user.id)

      if (updatePasswordError) {
        throw updatePasswordError
      }
    }

    const userUpdate: Record<string, unknown> = {}
    if (body.name !== undefined) userUpdate.name = body.name.trim()
    if (body.avatar !== undefined) userUpdate.avatar = body.avatar || null

    if (Object.keys(userUpdate).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', user.id)

      if (userUpdateError) throw userUpdateError
    }

    if (user.role === 'fundacion' && user.foundation_id) {
      const foundationUpdate: Record<string, unknown> = {}
      if (body.name_foundation !== undefined) foundationUpdate.name = body.name_foundation.trim()
      if (body.description !== undefined) foundationUpdate.description = body.description || null
      if (body.location !== undefined) foundationUpdate.location = body.location || null
      if (body.email_foundation !== undefined) foundationUpdate.email = body.email_foundation || null
      if (body.phone !== undefined) foundationUpdate.phone = body.phone || null
      if (body.logo_url !== undefined) foundationUpdate.logo_url = body.logo_url || null
      if (body.available_slots !== undefined) foundationUpdate.available_slots = body.available_slots || null

      if (Object.keys(foundationUpdate).length > 0) {
        const { error: foundationUpdateError } = await supabase
          .from('foundations')
          .update(foundationUpdate)
          .eq('id', user.foundation_id)

        if (foundationUpdateError) throw foundationUpdateError
      }
    }

    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (updatedUserError && updatedUserError.code !== 'PGRST116') {
      throw updatedUserError
    }

    let foundation = null
    if (updatedUser?.foundation_id) {
      const { data: foundationData, error: foundationError } = await supabase
        .from('foundations')
        .select('*')
        .eq('id', updatedUser.foundation_id)
        .maybeSingle()

      if (foundationError && foundationError.code !== 'PGRST116') {
        throw foundationError
      }

      foundation = foundationData
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        role: updatedUser!.role,
        avatar: updatedUser!.avatar,
        created_at: updatedUser!.created_at,
        foundation,
      },
    })
  } catch (err) {
    console.error('[users/me PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
