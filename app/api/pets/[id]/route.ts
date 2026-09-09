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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const petId = Number(id)
    if (!petId || isNaN(petId)) {
      return NextResponse.json({ ok: false, error: 'ID de mascota inválido.' }, { status: 400 })
    }

    const body = (await req.json()) as {
      editor_email: string
      name?: string
      type?: 'Perro' | 'Gato'
      breed?: string
      age?: string
      gender?: 'Macho' | 'Hembra'
      weight?: string
      location?: string
      image?: string
      adoption_state?: 'en_adopcion' | 'rescatado' | 'adoptado'
      tone?: string
      vaccinated?: 0 | 1
      sterilized?: 0 | 1
      personality?: string[]
      about?: string
      good_with?: string[]
      energy?: 'Baja' | 'Media' | 'Alta'
    }

    const { editor_email } = body

    if (!editor_email) {
      return NextResponse.json({ ok: false, error: 'editor_email es requerido.' }, { status: 400 })
    }

    const editor = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(editor_email.trim().toLowerCase()) as DBUser | undefined

    if (!editor) {
      return NextResponse.json({ ok: false, error: 'Editor no encontrado.' }, { status: 404 })
    }

    const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId) as DBPet | undefined

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const isAdmin = editor.role === 'admin'
    const isPublisher = pet.published_by === editor.id

    if (!isAdmin && !isPublisher) {
      return NextResponse.json(
        { ok: false, error: 'No tienes permisos para editar esta mascota.' },
        { status: 403 },
      )
    }

    const fields: string[] = []
    const values: unknown[] = []

    if (body.name !== undefined) {
      fields.push('name = ?')
      values.push(body.name.trim())
    }
    if (body.type !== undefined) {
      fields.push('type = ?')
      values.push(body.type)
    }
    if (body.breed !== undefined) {
      fields.push('breed = ?')
      values.push(body.breed?.trim() || null)
    }
    if (body.age !== undefined) {
      fields.push('age = ?')
      values.push(body.age.trim())
    }
    if (body.gender !== undefined) {
      fields.push('gender = ?')
      values.push(body.gender || null)
    }
    if (body.weight !== undefined) {
      fields.push('weight = ?')
      values.push(body.weight?.trim() || null)
    }
    if (body.location !== undefined) {
      fields.push('location = ?')
      values.push(body.location.trim())
    }
    if (body.image !== undefined) {
      fields.push('image = ?')
      values.push(body.image)
    }
    if (body.adoption_state !== undefined) {
      fields.push('adoption_state = ?')
      values.push(body.adoption_state)
    }
    if (body.tone !== undefined) {
      fields.push('tone = ?')
      values.push(body.tone?.trim() || '')
    }
    if (body.vaccinated !== undefined) {
      fields.push('vaccinated = ?')
      values.push(Number(body.vaccinated))
    }
    if (body.sterilized !== undefined) {
      fields.push('sterilized = ?')
      values.push(Number(body.sterilized))
    }
    if (body.personality !== undefined) {
      fields.push('personality = ?')
      values.push(body.personality ? JSON.stringify(body.personality) : null)
    }
    if (body.about !== undefined) {
      fields.push('about = ?')
      values.push(body.about?.trim() || null)
    }
    if (body.good_with !== undefined) {
      fields.push('good_with = ?')
      values.push(body.good_with ? JSON.stringify(body.good_with) : null)
    }
    if (body.energy !== undefined) {
      fields.push('energy = ?')
      values.push(body.energy || null)
    }

    if (fields.length > 0) {
      values.push(petId)
      db.prepare(`UPDATE pets SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    const updatedPet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId) as DBPet

    return NextResponse.json({
      ok: true,
      pet: {
        id: updatedPet.id,
        name: updatedPet.name,
        type: updatedPet.type,
        breed: updatedPet.breed,
        age: updatedPet.age,
        gender: updatedPet.gender,
        weight: updatedPet.weight,
        location: updatedPet.location,
        image: updatedPet.image,
        adoption_state: (updatedPet as any).adoption_state ?? 'en_adopcion',
        tone: updatedPet.tone,
        vaccinated: Boolean(updatedPet.vaccinated),
        sterilized: Boolean(updatedPet.sterilized),
        personality: parseJSON<string[]>(updatedPet.personality) ?? [],
        about: updatedPet.about,
        good_with: parseJSON<string[]>(updatedPet.good_with) ?? [],
        energy: updatedPet.energy,
        foundation_id: updatedPet.foundation_id,
        published_by: updatedPet.published_by,
        created_at: updatedPet.created_at,
      },
    })
  } catch (err) {
    console.error('[pets/[id] PATCH]', err)
    return NextResponse.json({ ok: false, error: 'Error al actualizar mascota.' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const petId = Number(id)
    if (!petId || isNaN(petId)) {
      return NextResponse.json({ ok: false, error: 'ID de mascota inválido.' }, { status: 400 })
    }

    const body = (await req.json()) as { editor_email: string }
    const { editor_email } = body

    if (!editor_email) {
      return NextResponse.json({ ok: false, error: 'editor_email es requerido.' }, { status: 400 })
    }

    const editor = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(editor_email.trim().toLowerCase()) as DBUser | undefined

    if (!editor) {
      return NextResponse.json({ ok: false, error: 'Editor no encontrado.' }, { status: 404 })
    }

    const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId) as DBPet | undefined

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const isAdmin = editor.role === 'admin'
    const isPublisher = pet.published_by === editor.id

    if (!isAdmin && !isPublisher) {
      return NextResponse.json(
        { ok: false, error: 'No tienes permisos para eliminar esta mascota.' },
        { status: 403 },
      )
    }

    db.prepare('DELETE FROM pets WHERE id = ?').run(petId)

    return NextResponse.json({ ok: true, message: 'Mascota eliminada correctamente.' })
  } catch (err) {
    console.error('[pets/[id] DELETE]', err)
    return NextResponse.json({ ok: false, error: 'Error al eliminar mascota.' }, { status: 500 })
  }
}
