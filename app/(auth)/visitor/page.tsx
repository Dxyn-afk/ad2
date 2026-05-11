'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye } from 'lucide-react'

export default function VisitorPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { toast.error('Masukkan nama Anda'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: nama.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Selamat datang, ${nama}!`)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal masuk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Pengunjung</h1>
          <p className="text-green-200 text-sm mt-1">Akses terbatas — hanya lihat data</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-700 text-sm font-semibold">ℹ️ Mode Pengunjung</p>
            <ul className="text-blue-600 text-xs mt-2 space-y-1">
              <li>• Dapat melihat semua data dan statistik</li>
              <li>• Dapat memfilter data berdasarkan periode</li>
              <li>• <strong>Tidak dapat</strong> menambah, edit, atau hapus data</li>
              <li>• <strong>Tidak dapat</strong> export PDF/Excel</li>
              <li>• Nama Anda dicatat untuk keperluan log</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama Anda</label>
              <input
                type="text"
                className="input"
                placeholder="Masukkan nama Anda"
                value={nama}
                onChange={e => setNama(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Nama ini dicatat sebagai log kunjungan
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Masuk...' : '👁 Lihat Data'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-[#1B5E20] hover:underline font-semibold">
              ← Login sebagai Admin/Petugas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
