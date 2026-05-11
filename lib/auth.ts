import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'
import type { SessionUser, Role } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)
const COOKIE_NAME = 'day-session'
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 hari (dalam detik)

// ============================================================
// JWT HELPERS
// ============================================================
export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

// ============================================================
// COOKIE HELPERS
// ============================================================
export async function setSessionCookie(user: SessionUser): Promise<string> {
  const token = await signToken(user)
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
  return token
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function clearSession() {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Untuk middleware (dari Request object)
export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ============================================================
// SESSION MANAGEMENT (admin: hanya 1 sesi aktif)
// ============================================================
export async function createDbSession(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Hapus semua sesi lama user ini
  await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('user_id', userId)

  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000).toISOString()

  await supabaseAdmin.from('sessions').insert({
    user_id: userId,
    token,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt,
  })
}

export async function invalidateDbSession(userId: string) {
  await supabaseAdmin.from('sessions').delete().eq('user_id', userId)
}

export async function isSessionValid(
  userId: string,
  token: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('sessions')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('token', token)
    .single()

  if (!data) return false
  if (new Date(data.expires_at) < new Date()) return false
  return true
}

// ============================================================
// ADMIN CHECK — apakah admin sudah terdaftar
// ============================================================
export async function adminExists(): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
  return (count ?? 0) > 0
}

// ============================================================
// ROLE GUARDS
// ============================================================
export function canEdit(role?: Role): boolean {
  return role === 'admin'
}

export function canDelete(role?: Role): boolean {
  return role === 'admin'
}

export function canInput(role?: Role): boolean {
  return role === 'admin' || role === 'petugas'
}

export function canExport(role?: Role): boolean {
  return role === 'admin' || role === 'petugas'
}

export function canView(role?: Role): boolean {
  return role === 'admin' || role === 'petugas' || role === 'melihat'
}

export function canManageUsers(role?: Role): boolean {
  return role === 'admin'
}
