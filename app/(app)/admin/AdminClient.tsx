'use client'
import { useState } from 'react'
import { Plus, Tag, Clock, Activity, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import type { KategoriPengeluaran, ActivityLog } from '@/types'

interface Props {
  kategoriList: KategoriPengeluaran[]
  activityLog: ActivityLog[]
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: '🔐 Login',
  LOGOUT: '🚪 Logout',
  CREATE_DATA_HARIAN: '📝 Input Data',
  UPDATE_DATA_HARIAN: '✏️ Edit Data',
  DELETE_DATA_HARIAN: '🗑️ Hapus Data',
  CREATE_PETUGAS: '👤 Tambah Petugas',
  UPDATE_USER: '✏️ Edit Pengguna',
  DELETE_USER: '🗑️ Hapus Pengguna',
  REGISTER_ADMIN: '🌿 Register Admin',
}

export default function AdminClient({ kategoriList, activityLog }: Props) {
  const [kategori, setKategori] = useState(kategoriList)
  const [newKat, setNewKat] = useState('')
  const [addingKat, setAddingKat] = useState(false)
  const [log, setLog] = useState(activityLog)

  async function handleAddKategori(e: React.FormEvent) {
    e.preventDefault()
    if (!newKat.trim()) return
    setAddingKat(true)
    try {
      const res = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newKat.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Reload kategori
      const katRes = await fetch('/api/kategori')
      const katData = await katRes.json()
      setKategori(katData.data ?? [])
      setNewKat('')
      toast.success('Kategori berhasil ditambahkan')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah kategori')
    } finally {
      setAddingKat(false)
    }
  }

  async function refreshLog() {
    try {
      const res = await fetch('/api/activity?limit=30')
      const data = await res.json()
      setLog(data.data ?? [])
      toast.success('Log diperbarui')
    } catch {
      toast.error('Gagal memuat log')
    }
  }

  function formatWaktu(ts: string) {
    const d = new Date(ts)
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">

      {/* Kategori Pengeluaran */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCE8DC] flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
            <Tag size={18} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Kategori Pengeluaran</h2>
            <p className="text-xs text-gray-500">{kategori.length} kategori terdaftar</p>
          </div>
        </div>

        <div className="p-5">
          {/* Daftar kategori */}
          <div className="flex flex-wrap gap-2 mb-5">
            {kategori.map(k => (
              <span key={k.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#1B5E20] rounded-full text-sm font-semibold border border-[#DCE8DC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
                {k.nama}
              </span>
            ))}
            {kategori.length === 0 && (
              <p className="text-gray-400 text-sm">Belum ada kategori</p>
            )}
          </div>

          {/* Form tambah */}
          <form onSubmit={handleAddKategori} className="flex gap-3">
            <input
              type="text"
              className="input flex-1"
              placeholder="Nama kategori baru..."
              value={newKat}
              onChange={e => setNewKat(e.target.value)}
            />
            <button type="submit" disabled={addingKat || !newKat.trim()}
              className="btn-primary flex items-center gap-2 flex-shrink-0">
              <Plus size={16} />
              {addingKat ? 'Menambah...' : 'Tambah'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            Kategori yang sudah digunakan tidak bisa dihapus untuk menjaga integritas data.
          </p>
        </div>
      </div>

      {/* Info Aplikasi */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCE8DC] flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
            <Database size={18} className="text-teal-600" />
          </div>
          <h2 className="font-bold text-gray-800">Informasi Sistem</h2>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nama Aplikasi', value: 'day 🌿' },
              { label: 'Versi', value: '2.1.0 Web Edition' },
              { label: 'Database', value: 'Supabase (PostgreSQL)' },
              { label: 'Framework', value: 'Next.js 14 App Router' },
              { label: 'Status Sistem', value: '✅ Online' },
              { label: 'Zona Waktu', value: 'WIB (Asia/Jakarta)' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2.5 border-b border-[#DCE8DC] last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCE8DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Log Aktivitas</h2>
              <p className="text-xs text-gray-500">30 aktivitas terakhir</p>
            </div>
          </div>
          <button onClick={refreshLog} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
            <Clock size={13} /> Refresh
          </button>
        </div>

        <div className="divide-y divide-[#DCE8DC] max-h-[500px] overflow-y-auto">
          {log.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p>Belum ada aktivitas tercatat</p>
            </div>
          ) : log.map(entry => (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#F9FBF2] transition-colors">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-gray-600">
                  {(entry.user_nama ?? '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{entry.user_nama ?? 'System'}</span>
                  <span className="text-sm text-gray-600">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                </div>
                {entry.detail && Object.keys(entry.detail).length > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {JSON.stringify(entry.detail)}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                {formatWaktu(entry.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
