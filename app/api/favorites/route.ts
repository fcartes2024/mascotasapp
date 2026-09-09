import { NextResponse } from 'next/server'
import db, { type DBUser, type DBPet, type DBFavorite } from '@/lib/db'

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

    if (!userEmail) {
      return NextResponse.json({ ok: false, error: 'user_email es requerido.' }, { status: 400 })
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(userEmail.trim().toLowerCase()) as DBUser | undefined

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const rows = db
      .prepare(
        `SELECT f.*, p.* FROM favorites f
         INNER JOIN pets p ON f.pet_id = p.id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
      )
      .all(user.id) as Array<DBFavorite & DBPet>

    const favorites = rows.map((r) => ({
      id: r.id,
      pet_id: r.pet_id,
      created_at: r.created_at,
      pet: {
        id: r.pet_id,
        name: r.name,
        type: r.type,
        breed: r.breed,
        age: r.age,
        gender: r.gender,
        weight: r.weight,
        location: r.location,
        image: r.image,
        tone: r.tone,
        vaccinated: Boolean(r.vaccinated),
        sterilized: Boolean(r.sterilized),
        personality: parseJSON<string[]>(r.personality) ?? [],
        about: r.about,
        good_with: parseJSON<string[]>(r.good_with) ?? [],
        energy: r.energy,
        foundation_id: r.foundation_id,
        published_by: r.published_by,
        created_at: r.created_at,
      },
    }))

    return NextResponse.json({ ok: true, favorites })
  } catch (err) {
    console.error('[favorites/GET]', err)
    return NextResponse.json({ ok: false, error: 'Error al cargar favoritos.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { user_email, pet_id } = (await req.json()) as {
      user_email?: string
      pet_id?: number
    }

    if (!user_email || !pet_id) {
      return NextResponse.json(
        { ok: false, error: 'user_email y pet_id son requeridos.' },
        { status: 400 },
      )
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(user_email.trim().toLowerCase()) as DBUser | undefined

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const pet = db.prepare('SELECT id FROM pets WHERE id = ?').get(pet_id) as
      | { id: number }
      | undefined

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const existing = db
      .prepare('SELECT id FROM favorites WHERE user_id = ? AND pet_id = ?')
      .get(user.id, pet_id)

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Ya está en favoritos' },
        { status: 409 },
      )
    }

    const result = db
      .prepare('INSERT INTO favorites (user_id, pet_id) VALUES (?, ?)')
      .run(user.id, pet_id)

    const favorite = db
      .prepare('SELECT * FROM favorites WHERE id = ?')
      .get(result.lastInsertRowid) as DBFavorite

    return NextResponse.json({ ok: true, favorite })
  } catch (err) {
    console.error('[favorites/POST]', err)
    return NextResponse.json({ ok: false, error: 'Error al agregar favorito.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { user_email, pet_id } = (await req.json()) as {
      user_email?: string
      pet_id?: number
    }

    if (!user_email || !pet_id) {
      return NextResponse.json(
        { ok: false, error: 'user_email y pet_id son requeridos.' },
        { status: 400 },
      )
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(user_email.trim().toLowerCase()) as DBUser | undefined

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    db.prepare('DELETE FROM favorites WHERE user_id = ? AND pet_id = ?').run(user.id, pet_id)

    return NextResponse.json({ ok: true, removed: true })
  } catch (err) {
    console.error('[favorites/DELETE]', err)
    return NextResponse.json({ ok: false, error: 'Error al eliminar favorito.' }, { status: 500 })
  }
}
