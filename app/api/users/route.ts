import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession, canManageUsers } from '@/lib/auth'
import { getUsers, logActivity, getNamaHistory } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  if (searchParams.get('type') === 'history') {
    const history = await getNamaHistory()
    return NextResponse.json(history)
  }

  if (!canManageUsers(session.role)) {
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
  }
  const data = await getUsers()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(session.role)) {
    return NextResponse.json({ error: 'Hanya admin yang bisa mendaftarkan petugas' }, { status: 403 })
  }

  try {
    const { nama, password, keterangan } = await req.json()
    if (!nama?.trim() || !password) {
      return NextResponse.json({ error: 'Nama dan password wajib' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('nama', nama.trim())
      .single()
    if (existing) {
      return NextResponse.json({ error: 'Nama sudah digunakan' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        nama: nama.trim(),
        password_hash: hash,
        role: 'petugas',
        keterangan: keterangan || null,
      })
      .select('id, nama, role, keterangan, aktif')
      .single()

    if (error) throw error

    await logActivity({
      userId: session.id,
      userName: session.nama,
      action: 'CREATE_PETUGAS',
      entity: 'users',
      entityId: user.id,
      detail: { nama: user.nama },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membuat akun'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
