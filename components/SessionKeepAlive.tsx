'use client'
/**
 * SessionKeepAlive — komponen invisible yang menjaga session aktif
 * Mencegah logout otomatis saat hosting di Vercel/serverless
 *
 * Cara kerja:
 * 1. Ping /api/auth/refresh setiap 8 menit (sebelum JWT 10 menit expire)
 * 2. Ping saat tab aktif kembali (visibilitychange)
 * 3. Ping saat ada interaksi user (debounced 5 menit)
 * 4. Tidak logout paksa jika network error — coba lagi
 */
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const PING_INTERVAL  = 8 * 60 * 1000   // 8 menit
const MIN_INTERACTION = 5 * 60 * 1000  // min 5 menit antar ping dari interaksi

export default function SessionKeepAlive() {
  const router = useRouter()
  const lastPing = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout>()
  const failCount = useRef(0)
  const MAX_FAILS = 3 // logout setelah 3 kali gagal berturut-turut

  async function ping() {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        // Tandai sebagai background request agar tidak menghalangi UX
        headers: { 'X-Refresh-Type': 'keepalive' },
      })

      if (res.status === 401) {
        failCount.current++
        if (failCount.current >= MAX_FAILS) {
          // Session benar-benar sudah tidak valid
          router.push('/login?reason=session_expired')
        }
        return
      }

      // Berhasil — reset fail counter
      failCount.current = 0
      lastPing.current = Date.now()
    } catch {
      // Network error — jangan logout, coba lagi nanti
      // Ini penting supaya tidak logout saat HP masuk sleep / jaringan putus sebentar
    }
  }

  // Interval ping rutin
  useEffect(() => {
    timerRef.current = setInterval(ping, PING_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  // Ping saat tab aktif kembali
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastPing.current
        // Ping jika sudah lebih dari 5 menit tidak ada ping
        if (elapsed > MIN_INTERACTION) {
          ping()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Ping saat ada interaksi (debounced)
  useEffect(() => {
    const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll']
    function handleInteraction() {
      const elapsed = Date.now() - lastPing.current
      if (elapsed > MIN_INTERACTION) ping()
    }
    EVENTS.forEach(e => window.addEventListener(e, handleInteraction, { passive: true }))
    return () => EVENTS.forEach(e => window.removeEventListener(e, handleInteraction))
  }, [])

  // Komponen tidak render apapun — invisible
  return null
}
