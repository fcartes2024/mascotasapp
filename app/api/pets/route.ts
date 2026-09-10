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

    const supabase = getSupabaseClient()
    let query = supabase.from('pets').select('*')

    if (type) query = query.eq('type', type)
    if (gender) query = query.eq('gender', gender)
    if (vaccinated === '0' || vaccinated === '1') query = query.eq('vaccinated', Number(vaccinated))
    if (sterilized === '0' || sterilized === '1') query = query.eq('sterilized', Number(sterilized))
    if (energy) query = query.eq('energy', energy)
    if (location) query = query.ilike('location', `%${location}%`)
    if (breed) query = query.ilike('breed', `%${breed}%`)

    if (publisherEmail) {
      const { data: publisher, error: publisherError } = await supabase
        .from('users')
        .select('*')
        .eq('email', publisherEmail.trim().toLowerCase())
        .maybeSingle()

      if (publisherError && publisherError.code !== 'PGRST116') {
        throw publisherError
      }

      if (publisher?.foundation_id) {
        query = query.eq('foundation_id', publisher.foundation_id)
      } else if (publisher) {
        query = query.eq('published_by', publisher.id)
      }
    }

    query = query.order('created_at', { ascending: false })

    const { data: rows, error } = await query

    if (error) {
      throw error
    }

    const pets = (rows ?? []).map((pet) => ({
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

    const supabase = getSupabaseClient()
    const lowerEmail = publisher_email.trim().toLowerCase()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    if (user.role !== 'fundacion') {
      return NextResponse.json(
        { ok: false, error: 'Solo fundaciones pueden publicar mascotas.' },
        { status: 403 },
      )
    }

    const { data: pet, error: insertError } = await supabase
      .from('pets')
      .insert([
        {
          name: name.trim(),
          type,
          breed: body.breed?.trim() || null,
          age: age.trim(),
          gender: body.gender || null,
          weight: body.weight?.trim() || null,
          location: location.trim(),
          image,
          tone: body.tone?.trim() || '',
          vaccinated: body.vaccinated ?? 0,
          sterilized: body.sterilized ?? 0,
          personality: body.personality ? JSON.stringify(body.personality) : null,
          about: body.about?.trim() || null,
          good_with: body.good_with ? JSON.stringify(body.good_with) : null,
          energy: body.energy || null,
          foundation_id: user.foundation_id,
          published_by: user.id,
          adoption_state: 'en_adopcion',
        },
      ])
      .select('*')
      .single()

    if (insertError) {
      throw insertError
    }

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
      },
    })
  } catch (err) {
    console.error('[pets POST]', err)
    return NextResponse.json({ ok: false, error: 'Error al crear mascota.' }, { status: 500 })
  }
}
