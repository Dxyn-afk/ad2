import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import {
  setSessionCookie, createDbSession, invalidateDbSession,
  clearSession
} from '@/lib/auth'
import { logActivity } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { nama, password } = await req.json()
    if (!nama || !password) {
      return NextResponse.json({ error: 'Nama dan password wajib' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, nama, role, password_hash, aktif')
      .eq('nama', nama.trim())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Nama atau password salah' }, { status: 401 })
    }
    if (!user.aktif) {
      return NextResponse.json({ error: 'Akun dinonaktifkan' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Nama atau password salah' }, { status: 401 })
    }

    const sessionUser = {
      id: user.id,
      nama: user.nama,
      role: user.role as 'admin' | 'petugas',
    }

    // Admin: invalidate sesi lain (hanya 1 sesi aktif)
    if (user.role === 'admin') {
      await invalidateDbSession(user.id)
    }

    const token = await setSessionCookie(sessionUser)
    await createDbSession(
      user.id, token,
      req.headers.get('x-forwarded-for') ?? undefined,
      req.headers.get('user-agent') ?? undefined
    )

    await logActivity({
      userId: user.id,
      userName: user.nama,
      action: 'LOGIN',
      entity: 'sessions',
      detail: { role: user.role, ip: req.headers.get('x-forwarded-for') },
    })

    return NextResponse.json({ user: sessionUser })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
