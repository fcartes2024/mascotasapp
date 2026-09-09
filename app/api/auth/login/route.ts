import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import db, { type DBUser } from '@/lib/db'

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string }
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email y contraseña son requeridos.' }, { status: 400 })
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as DBUser | undefined

    if (!user || user.password_hash !== hash(password)) {
      return NextResponse.json({ ok: false, error: 'Correo o contraseña incorrectos.' }, { status: 401 })
    }

    let foundationName: string | undefined
    if (user.foundation_id) {
      const f = db
        .prepare('SELECT name FROM foundations WHERE id = ?')
        .get(user.foundation_id) as { name: string } | undefined
      foundationName = f?.name
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
