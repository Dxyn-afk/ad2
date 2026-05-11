import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { adminExists, setSessionCookie, createDbSession } from '@/lib/auth'
import { logActivity } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const exists = await adminExists()
    if (exists) {
      return NextResponse.json({ error: 'Admin sudah terdaftar' }, { status: 403 })
    }

    const { nama, password } = await req.json()
    if (!nama?.trim() || !password) {
      return NextResponse.json({ error: 'Nama dan password wajib diisi' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ nama: nama.trim(), password_hash: hash, role: 'admin' })
      .select()
      .single()

    if (error) throw error

    const sessionUser = { id: user.id, nama: user.nama, role: 'admin' as const }
    const token = await setSessionCookie(sessionUser)
    await createDbSession(
      user.id, token,
      req.headers.get('x-forwarded-for') ?? undefined,
      req.headers.get('user-agent') ?? undefined
    )

    await logActivity({
      userId: user.id,
      userName: user.nama,
      action: 'REGISTER_ADMIN',
      entity: 'users',
      entityId: user.id,
    })

    return NextResponse.json({ user: sessionUser })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: 'Gagal mendaftarkan admin' }, { status: 500 })
  }
}
