import { NextRequest, NextResponse } from 'next/server'
import { getSession, canManageUsers } from '@/lib/auth'
import { getKategori, addKategori } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await getKategori()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(session.role)) {
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
  }
  const { nama } = await req.json()
  if (!nama?.trim()) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 })
  await addKategori(nama)
  return NextResponse.json({ ok: true })
}
