import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import db, { type UserRole } from '@/lib/db'

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
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(lowerEmail)
    if (exists) {
      return NextResponse.json({ ok: false, error: 'Este correo ya está registrado.' }, { status: 409 })
    }

    let foundationId: number | null = null
    if (role === 'fundacion' && foundationName) {
      const foundInsert = db
        .prepare('INSERT INTO foundations (name, email) VALUES (?, ?)')
        .run(foundationName.trim(), lowerEmail)
      foundationId = Number(foundInsert.lastInsertRowid)
    }

    const insert = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, foundation_id) VALUES (?, ?, ?, ?, ?)',
    )
    const insertResult = insert.run(name.trim(), lowerEmail, hash(password), role, foundationId)
    const userId = Number(insertResult.lastInsertRowid)

    let returnedFoundationName: string | undefined
    if (foundationId && foundationName) {
      returnedFoundationName = foundationName.trim()
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        name: name.trim(),
        email: lowerEmail,
        role,
        foundationName: returnedFoundationName,
      },
    })
  } catch (err) {
    console.error('[auth/register]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
