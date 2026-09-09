import { NextResponse } from 'next/server'
import db, { type DBUser, type DBFoundation } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const admin_email = searchParams.get('admin_email')

    if (!admin_email) {
      return NextResponse.json({ ok: false, error: 'admin_email es requerido.' }, { status: 400 })
    }

    const admin = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(admin_email.trim().toLowerCase()) as DBUser | undefined

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin no encontrado.' }, { status: 404 })
    }

    if (admin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
    }

    const foundations = db.prepare('SELECT * FROM foundations ORDER BY created_at DESC').all() as DBFoundation[]

    const result = foundations.map((f) => {
      const petCount = db.prepare('SELECT COUNT(*) as count FROM pets WHERE foundation_id = ?').get(f.id) as { count: number }
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE foundation_id = ?').get(f.id) as { count: number }

      return {
        id: f.id,
        name: f.name,
        description: f.description,
        location: f.location,
        email: f.email,
        phone: f.phone,
        logo_url: f.logo_url,
        verified: Number((f as DBFoundation).verified ?? 1),
        created_at: f.created_at,
        pets_count: petCount.count,
        users_count: userCount.count,
      }
    })

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

    const admin = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(admin_email.trim().toLowerCase()) as DBUser | undefined

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

    const foundation = db.prepare('SELECT * FROM foundations WHERE id = ?').get(fId) as DBFoundation | undefined

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

    const fields: string[] = []
    const values: unknown[] = []

    if (body.verified !== undefined) {
      fields.push('verified = ?')
      values.push(body.verified ? 1 : 0)
    }

    if (body.name !== undefined) {
      fields.push('name = ?')
      values.push(body.name.trim())
    }
    if (body.description !== undefined) {
      fields.push('description = ?')
      values.push(body.description || null)
    }
    if (body.location !== undefined) {
      fields.push('location = ?')
      values.push(body.location || null)
    }
    if (body.email !== undefined) {
      fields.push('email = ?')
      values.push(body.email || null)
    }
    if (body.phone !== undefined) {
      fields.push('phone = ?')
      values.push(body.phone || null)
    }
    if (body.logo_url !== undefined) {
      fields.push('logo_url = ?')
      values.push(body.logo_url || null)
    }

    if (fields.length > 0) {
      values.push(fId)
      db.prepare(`UPDATE foundations SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    const updatedFoundation = db.prepare('SELECT * FROM foundations WHERE id = ?').get(fId) as DBFoundation

    return NextResponse.json({
      ok: true,
      foundation: updatedFoundation,
    })
  } catch (err) {
    console.error('[admin/foundations PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error del servidor.' }, { status: 500 })
  }
}
