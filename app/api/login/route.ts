import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { no_peserta, password, token } = body

  // 1️⃣ Cek siswa
  const { data: siswa } = await supabase
    .from('data_siswa')
    .select('*')
    .eq('no_peserta', no_peserta)
    .eq('password', password)
    .single()

  if (!siswa) {
    return NextResponse.json({ error: 'Login gagal' }, { status: 401 })
  }

  // 2️⃣ Cek token aktif
  const { data: tokenData } = await supabase
    .from('token_ujian')
    .select('token, id_asesmen')
    .eq('status', true)
    .single()

  if (!tokenData || token.toUpperCase() !== tokenData.token) {
    return NextResponse.json({ error: 'Token salah' }, { status: 401 })
  }

  // 3️⃣ Generate session random
  const sessionToken = crypto.randomBytes(32).toString('hex')

  const expiredTime = new Date()
  expiredTime.setHours(expiredTime.getHours() + 2)

  // 4️⃣ Simpan ke DB
  await supabase.from('sesi_ujian').insert({
    no_peserta,
    id_asesmen: tokenData.id_asesmen,
    token_session: sessionToken,
    expired: expiredTime
  })

  // 5️⃣ Set Cookie
  const response = NextResponse.json({
    success: true,
    id_asesmen: tokenData.id_asesmen
  })

  response.cookies.set('cbt_session', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 2
  })

  return response
}