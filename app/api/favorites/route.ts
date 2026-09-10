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
    const userEmail = searchParams.get('user_email')

    if (!userEmail) {
      return NextResponse.json({ ok: false, error: 'user_email es requerido.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const lowerEmail = userEmail.trim().toLowerCase()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const { data: favoriteRows, error: favoritesError } = await supabase
      .from('favorites')
      .select('id, pet_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (favoritesError) {
      throw favoritesError
    }

    const petIds = (favoriteRows ?? []).map((item) => item.pet_id)
    const { data: pets, error: petsError } = petIds.length
      ? await supabase.from('pets').select('*').in('id', petIds)
      : { data: [], error: null }

    if (petsError) {
      throw petsError
    }

    const petMap = new Map((pets ?? []).map((pet) => [pet.id, pet]))

    const favorites = (favoriteRows ?? []).map((favorite) => {
      const pet = petMap.get(favorite.pet_id)
      return {
        id: favorite.id,
        pet_id: favorite.pet_id,
        created_at: favorite.created_at,
        pet: pet
          ? {
              id: pet.id,
              name: pet.name,
              type: pet.type,
              breed: pet.breed,
              age: pet.age,
              gender: pet.gender,
              weight: pet.weight,
              location: pet.location,
              image: pet.image,
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
          : null,
      }
    })

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

    const supabase = getSupabaseClient()
    const lowerEmail = user_email.trim().toLowerCase()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('id', pet_id)
      .maybeSingle()

    if (petError && petError.code !== 'PGRST116') {
      throw petError
    }

    if (!pet) {
      return NextResponse.json({ ok: false, error: 'Mascota no encontrada.' }, { status: 404 })
    }

    const { data: existing, error: existingError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('pet_id', pet_id)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Ya está en favoritos' },
        { status: 409 },
      )
    }

    const { data: favorite, error: insertError } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, pet_id }])
      .select('id, user_id, pet_id, created_at')
      .single()

    if (insertError) {
      throw insertError
    }

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

    const supabase = getSupabaseClient()
    const lowerEmail = user_email.trim().toLowerCase()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', lowerEmail)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado.' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('pet_id', pet_id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ ok: true, removed: true })
  } catch (err) {
    console.error('[favorites/DELETE]', err)
    return NextResponse.json({ ok: false, error: 'Error al eliminar favorito.' }, { status: 500 })
  }
}
