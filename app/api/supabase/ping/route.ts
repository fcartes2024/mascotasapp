import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from('pets').select('id').limit(1)

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('[supabase/ping GET]', err)
    return NextResponse.json({ ok: false, error: 'No se pudo conectar a Supabase.' }, { status: 500 })
  }
}

