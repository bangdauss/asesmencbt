import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const session = req.cookies.get('cbt_session')?.value

  if (!session) {
    return NextResponse.redirect(new URL('/peserta/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/peserta/ujian/:path*']
}