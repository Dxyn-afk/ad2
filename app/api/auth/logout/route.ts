import { NextResponse } from 'next/server'
import { getSession, clearSession, invalidateDbSession } from '@/lib/auth'
import { logActivity } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const session = await getSession()
    if (session && session.id && !session.isVisitor) {
      await invalidateDbSession(session.id)
      await logActivity({
        userId: session.id,
        userName: session.nama,
        action: 'LOGOUT',
      })
    }
    await clearSession()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
