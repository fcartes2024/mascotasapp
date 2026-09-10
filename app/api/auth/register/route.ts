import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getSupabaseClient } from '@/lib/supabase'

type UserRole = 'usuario' | 'fundacion' | 'admin'

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
      role = 'usuario',
      foundationName,
    } = (await req.json()) as {
      name?: string
      email?: string
      password?: string
      role?: UserRole
      foundationName?: string
    }

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: 'Nombre, email y contraseña son requeridos.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
    }
    if (role === 'fundacion' && !foundationName) {
      return NextResponse.json({ ok: false, error: 'Ingresa el nombre de tu fundación.' }, { status: 400 })
    }

    const lowerEmail = email.trim().toLowerCase()
    const supabase = getSupabaseClient()

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError
    }

    if (existingUser) {
      return NextResponse.json({ ok: false, error: 'Este correo ya está registrado.' }, { status: 409 })
    }

    let foundationId: number | null = null
    if (role === 'fundacion' && foundationName) {
      const { data: foundation, error: foundationError } = await supabase
        .from('foundations')
        .insert([
          {
            name: foundationName.trim(),
            email: lowerEmail,
          },
        ])
        .select('id')
        .single()

      if (foundationError) {
        throw foundationError
      }

      foundationId = foundation.id
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name: name.trim(),
          email: lowerEmail,
          password_hash: hash(password),
          role,
          foundation_id: foundationId,
        },
      ])
      .select('id, name, email, role, foundation_id')
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: insertedUser.id,
        name: insertedUser.name,
        email: insertedUser.email,
        role: insertedUser.role,
        foundationName: foundationName?.trim(),
      },
    })
  } catch (err) {
    console.error('[auth/register]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
