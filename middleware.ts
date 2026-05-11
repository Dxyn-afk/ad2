import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

// Route yang tidak perlu auth sama sekali
const PUBLIC_ROUTES = ['/login', '/register-admin', '/visitor']

// Route yang butuh minimal login (semua role termasuk melihat)
const VIEW_ROUTES = ['/dashboard', '/data', '/laporan']

// Route yang butuh petugas atau admin
const PETUGAS_ROUTES = ['/input', '/export']

// Route yang butuh admin saja
const ADMIN_ROUTES = ['/admin', '/users']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSessionFromRequest(request)

  // Bypass API routes (auth check dilakukan di handler)
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Public routes — redirect ke dashboard jika sudah login
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    if (session && pathname !== '/visitor') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Semua route lain butuh session
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes — hanya admin
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Petugas routes — admin + petugas
  if (PETUGAS_ROUTES.some(r => pathname.startsWith(r))) {
    if (session.role === 'melihat') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}
