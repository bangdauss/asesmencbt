import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('cbt_session')?.value

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('sesi_ujian')
    .select('*')
    .eq('token_session', session)
    .eq('status', true)
    .single()

  if (!data) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (new Date(data.expired) < new Date()) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/peserta/ujian/:path*']
}