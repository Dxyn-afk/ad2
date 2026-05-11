'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function RegisterAdminPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [adminExists, setAdminExists] = useState(false)
  const [form, setForm] = useState({ nama: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState({ nama: '', password: '' })

  useEffect(() => {
    fetch('/api/auth/admin-exists')
      .then(r => r.json())
      .then(d => {
        if (d.exists) {
          setAdminExists(true)
          router.replace('/login')
        }
        setChecking(false)
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Password tidak cocok')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Tampilkan kredensial sekali saja
      setCredentials({ nama: form.nama, password: form.password })
      setShowCredentials(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mendaftar')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1B5E20] flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Memuat...</div>
      </div>
    )
  }

  if (adminExists) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-3xl font-bold text-white">day</h1>
          <p className="text-green-200 mt-1">Manajemen Kebun Sawit</p>
        </div>

        {!showCredentials ? (
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Daftarkan Admin</h2>
              <p className="text-sm text-gray-500 mt-1">
                Halaman ini hanya muncul <strong>sekali</strong>. Setelah admin
                terdaftar, halaman ini tidak akan bisa diakses lagi.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm font-semibold">⚠️ Penting!</p>
              <p className="text-amber-700 text-xs mt-1">
                Simpan nama dan password admin di tempat yang aman.
                Password tidak bisa dilihat kembali setelah halaman ini ditutup.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nama Admin</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masukkan nama admin"
                  value={form.nama}
                  onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label">Konfirmasi Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Ulangi password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full mt-2"
                disabled={loading}
              >
                {loading ? 'Mendaftarkan...' : 'Daftarkan Admin'}
              </button>
            </form>
          </div>
        ) : (
          /* Tampilkan kredensial sekali saja */
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-xl font-bold text-[#1B5E20]">Admin Berhasil Didaftarkan!</h2>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
              <p className="text-red-700 font-bold text-sm mb-3">
                🔐 Simpan kredensial ini sekarang! Tidak akan ditampilkan lagi.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-24">Nama:</span>
                  <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg flex-1">
                    {credentials.nama}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-24">Password:</span>
                  <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg flex-1 font-mono">
                    {credentials.password}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mb-4">
              Setelah menekan tombol di bawah, halaman pendaftaran admin tidak
              akan pernah muncul lagi.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="btn-primary w-full"
            >
              Saya Sudah Menyimpan — Lanjut ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
