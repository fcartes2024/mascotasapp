import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function mapPet(pet: any) {
  return {
    id: pet.id,
    name: pet.name,
    type: pet.type,
    breed: pet.breed,
    age: pet.age,
    gender: pet.gender,
    weight: pet.weight,
    location: pet.location,
    image: pet.image,
    adoption_state: pet.adoption_state ?? 'en_adopcion',
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

    const supabase = getSupabaseClient()

    const { data: editor, error: editorError } = await supabase
      .from('users')
      .select('*')
      .eq('email', editor_email.trim().toLowerCase())
      .maybeSingle()

    if (editorError && editorError.code !== 'PGRST116') {
      throw editorError
    }

    if (!editor) {
      return NextResponse.json({ ok: false, error: 'Editor no encontrado.' }, { status: 404 })
    }

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle()

    if (petError && petError.code !== 'PGRST116') {
      throw petError
    }

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

    const update: Record<string, unknown> = {}

    if (body.name !== undefined) update.name = body.name.trim()
    if (body.type !== undefined) update.type = body.type
    if (body.breed !== undefined) update.breed = body.breed?.trim() || null
    if (body.age !== undefined) update.age = body.age.trim()
    if (body.gender !== undefined) update.gender = body.gender || null
    if (body.weight !== undefined) update.weight = body.weight?.trim() || null
    if (body.location !== undefined) update.location = body.location.trim()
    if (body.image !== undefined) update.image = body.image
    if (body.adoption_state !== undefined) update.adoption_state = body.adoption_state
    if (body.tone !== undefined) update.tone = body.tone?.trim() || ''
    if (body.vaccinated !== undefined) update.vaccinated = Number(body.vaccinated)
    if (body.sterilized !== undefined) update.sterilized = Number(body.sterilized)
    if (body.personality !== undefined) update.personality = body.personality ? JSON.stringify(body.personality) : null
    if (body.about !== undefined) update.about = body.about?.trim() || null
    if (body.good_with !== undefined) update.good_with = body.good_with ? JSON.stringify(body.good_with) : null
    if (body.energy !== undefined) update.energy = body.energy || null

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, pet: mapPet(pet) })
    }

    const { data: updatedPet, error: updateError } = await supabase
      .from('pets')
      .update(update)
      .eq('id', petId)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      ok: true,
      pet: mapPet(updatedPet),
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

    const supabase = getSupabaseClient()

    const { data: editor, error: editorError } = await supabase
      .from('users')
      .select('*')
      .eq('email', editor_email.trim().toLowerCase())
      .maybeSingle()

    if (editorError && editorError.code !== 'PGRST116') {
      throw editorError
    }

    if (!editor) {
      return NextResponse.json({ ok: false, error: 'Editor no encontrado.' }, { status: 404 })
    }

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle()

    if (petError && petError.code !== 'PGRST116') {
      throw petError
    }

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

    const { error: deleteError } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ ok: true, message: 'Mascota eliminada correctamente.' })
  } catch (err) {
    console.error('[pets/[id] DELETE]', err)
    return NextResponse.json({ ok: false, error: 'Error al eliminar mascota.' }, { status: 500 })
  }
}
