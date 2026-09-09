import { NextResponse } from 'next/server'
import db, { type DBPet, type DBUser } from '@/lib/db'

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
    const type = searchParams.get('type')
    const gender = searchParams.get('gender')
    const vaccinated = searchParams.get('vaccinated')
    const sterilized = searchParams.get('sterilized')
    const energy = searchParams.get('energy')
    const location = searchParams.get('location')
    const breed = searchParams.get('breed')
    const publisherEmail = searchParams.get('publisher_email')

    const where: string[] = []
    const params: unknown[] = []

    if (type) {
      where.push('type = ?')
      params.push(type)
    }
    if (gender) {
      where.push('gender = ?')
      params.push(gender)
    }
    if (vaccinated === '0' || vaccinated === '1') {
      where.push('vaccinated = ?')
      params.push(Number(vaccinated))
    }
    if (sterilized === '0' || sterilized === '1') {
      where.push('sterilized = ?')
      params.push(Number(sterilized))
    }
    if (publisherEmail) {
      const publisher = db
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(publisherEmail.trim().toLowerCase()) as DBUser | undefined
      if (publisher?.foundation_id) {
        where.push('foundation_id = ?')
        params.push(publisher.foundation_id)
      } else if (publisher) {
        where.push('published_by = ?')
        params.push(publisher.id)
      }
    }
    if (energy) {
      where.push('energy = ?')
      params.push(energy)
    }
    if (location) {
      where.push('location LIKE ?')
      params.push(`%${location}%`)
    }
    if (breed) {
      where.push('breed LIKE ?')
      params.push(`%${breed}%`)
    }

    const sql = `SELECT * FROM pets ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`
    const rows = db.prepare(sql).all(...params) as DBPet[]

    const pets = rows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      breed: p.breed,
      age: p.age,
      gender: p.gender,
      weight: p.weight,
      location: p.location,
      image: p.image,
      adoption_state: (p as any).adoption_state ?? 'en_adopcion',
      tone: p.tone,
      vaccinated: Boolean(p.vaccinated),
      sterilized: Boolean(p.sterilized),
      personality: parseJSON<string[]>(p.personality) ?? [],
      about: p.about,
      good_with: parseJSON<string[]>(p.good_with) ?? [],
      energy: p.energy,
      foundation_id: p.foundation_id,
      published_by: p.published_by,
      created_at: p.created_at,
    }))

    return NextResponse.json({ ok: true, pets })
  } catch (err) {
    console.error('[pets]', err)
    return NextResponse.json({ ok: false, error: 'Error al cargar mascotas.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      publisher_email: string
      name: string
      type: 'Perro' | 'Gato'
      breed?: string
      age: string
      gender?: 'Macho' | 'Hembra'
      weight?: string
      location: string
      image: string
      tone?: string
      vaccinated?: 0 | 1
      sterilized?: 0 | 1
      personality?: string[]
      about?: string
      good_with?: string[]
      energy?: 'Baja' | 'Media' | 'Alta'
    }

    const { publisher_email, name, type, age, location, image } = body

    if (!publisher_email || !name || !type || !age || !location || !image) {
      return NextResponse.json(
        { ok: false, error: 'publisher_email, name, type, age, location e image son requeridos.' },
        { status: 400 },
      )
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(publisher_email.trim().toLowerCase()) as DBUser | undefined

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    if (user.role !== 'fundacion') {
      return NextResponse.json(
        { ok: false, error: 'Solo fundaciones pueden publicar mascotas.' },
        { status: 403 },
      )
    }

    const insert = db.prepare(
      `INSERT INTO pets (
        name, type, breed, age, gender, weight, location, image, tone,
        vaccinated, sterilized, personality, about, good_with, energy,
        foundation_id, published_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )

    const result = insert.run(
      name.trim(),
      type,
      body.breed?.trim() || null,
      age.trim(),
      body.gender || null,
      body.weight?.trim() || null,
      location.trim(),
      image,
      body.tone?.trim() || '',
      body.vaccinated ?? 0,
      body.sterilized ?? 0,
      body.personality ? JSON.stringify(body.personality) : null,
      body.about?.trim() || null,
      body.good_with ? JSON.stringify(body.good_with) : null,
      body.energy || null,
      user.foundation_id,
      user.id,
    )

    const petId = Number(result.lastInsertRowid)
    const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId) as DBPet

    return NextResponse.json({
      ok: true,
      pet: {
        id: pet.id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        age: pet.age,
        gender: pet.gender,
        weight: pet.weight,
        location: pet.location,
        image: pet.image,
        adoption_state: (pet as any).adoption_state ?? 'en_adopcion',
        tone: pet.tone,
        vaccinated: Boolean(pet.vaccinated),
        sterilized: Boolean(pet.sterilized),
        personality: parseJSON<string[]>(pet.personality) ?? [],
        about: pet.about,
        good_with: parseJSON<string[]>(pet.good_with) ?? [],
        energy: pet.energy,
        foundation_id: pet.foundation_id,
        published_by: pet.published_by,
        created_at: pet.created_at,
      },
    })
  } catch (err) {
    console.error('[pets POST]', err)
    return NextResponse.json({ ok: false, error: 'Error al crear mascota.' }, { status: 500 })
  }
}
