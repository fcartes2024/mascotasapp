import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import db, { type DBUser, type DBFoundation } from '@/lib/db'

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

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as DBUser | undefined

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    let foundation: DBFoundation | null = null
    if (user.foundation_id) {
      foundation = db
        .prepare('SELECT * FROM foundations WHERE id = ?')
        .get(user.foundation_id) as DBFoundation | null
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

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as DBUser | undefined

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
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        hash(body.new_password),
        user.id,
      )
    }

    const userFields: string[] = []
    const userValues: unknown[] = []

    if (body.name !== undefined) {
      userFields.push('name = ?')
      userValues.push(body.name.trim())
    }
    if (body.avatar !== undefined) {
      userFields.push('avatar = ?')
      userValues.push(body.avatar || null)
    }

    if (userFields.length > 0) {
      userValues.push(user.id)
      db.prepare(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`).run(...userValues)
    }

    if (user.role === 'fundacion' && user.foundation_id) {
      const fFields: string[] = []
      const fValues: unknown[] = []

      if (body.name_foundation !== undefined) {
        fFields.push('name = ?')
        fValues.push(body.name_foundation.trim())
      }
      if (body.description !== undefined) {
        fFields.push('description = ?')
        fValues.push(body.description || null)
      }
      if (body.location !== undefined) {
        fFields.push('location = ?')
        fValues.push(body.location || null)
      }
      if (body.email_foundation !== undefined) {
        fFields.push('email = ?')
        fValues.push(body.email_foundation || null)
      }
      if (body.phone !== undefined) {
        fFields.push('phone = ?')
        fValues.push(body.phone || null)
      }
      if (body.logo_url !== undefined) {
        fFields.push('logo_url = ?')
        fValues.push(body.logo_url || null)
      }
      if (body.available_slots !== undefined) {
        fFields.push('available_slots = ?')
        fValues.push(body.available_slots || null)
      }

      if (fFields.length > 0) {
        fValues.push(user.foundation_id)
        db.prepare(`UPDATE foundations SET ${fFields.join(', ')} WHERE id = ?`).run(...fValues)
      }
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DBUser
    let foundation: DBFoundation | null = null
    if (updatedUser.foundation_id) {
      foundation = db
        .prepare('SELECT * FROM foundations WHERE id = ?')
        .get(updatedUser.foundation_id) as DBFoundation | null
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        created_at: updatedUser.created_at,
        foundation,
      },
    })
  } catch (err) {
    console.error('[users/me PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
