import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: Request) {
  const body = await req.json()
  const { no_peserta, password, token } = body

  const { data: siswa } = await supabase
    .from('data_siswa')
    .select('*')
    .eq('no_peserta', no_peserta)
    .eq('password', password)
    .single()

  if (!siswa) {
    return NextResponse.json({ error: 'Login gagal' }, { status: 401 })
  }

  const { data: tokenData } = await supabase
    .from('token_ujian')
    .select('token, id_asesmen')
    .eq('status', true)
    .single()

  if (!tokenData || token.toUpperCase() !== tokenData.token) {
    return NextResponse.json({ error: 'Token salah' }, { status: 401 })
  }

  const sessionToken = generateToken()

  const expiredTime = new Date()
  expiredTime.setHours(expiredTime.getHours() + 2)

  await supabase.from('sesi_ujian').insert({
    no_peserta,
    id_asesmen: tokenData.id_asesmen,
    token_session: sessionToken,
    expired: expiredTime
  })

  const response = NextResponse.json({
    success: true,
    id_asesmen: tokenData.id_asesmen
  })

  response.cookies.set('cbt_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2
  })

  return response
}