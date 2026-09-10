import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getSupabaseClient } from '@/lib/supabase'

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string }
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email y contraseña son requeridos.' }, { status: 400 })
    }

    const lowerEmail = email.trim().toLowerCase()
    const supabase = getSupabaseClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user || user.password_hash !== hash(password)) {
      return NextResponse.json({ ok: false, error: 'Correo o contraseña incorrectos.' }, { status: 401 })
    }

    let foundationName: string | undefined
    if (user.foundation_id) {
      const { data: foundation, error: foundationError } = await supabase
        .from('foundations')
        .select('name')
        .eq('id', user.foundation_id)
        .maybeSingle()

      if (foundationError && foundationError.code !== 'PGRST116') {
        throw foundationError
      }

      foundationName = foundation?.name ?? undefined
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar ?? undefined,
        foundationName,
      },
    })
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
