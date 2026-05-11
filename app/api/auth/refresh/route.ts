import { NextResponse } from 'next/server'
import { getSession, setSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }
    // Re-issue token dengan expiry baru
    await setSessionCookie(session)
    return NextResponse.json({ valid: true, user: session })
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ valid: false }, { status: 401 })
    return NextResponse.json({ valid: true, user: session })
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}
