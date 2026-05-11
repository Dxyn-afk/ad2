'use client'
import { useState } from 'react'
import { Plus, Edit2, Trash2, UserCheck, UserX, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/types'
import clsx from 'clsx'

interface Props {
  initialUsers: User[]
  currentUserId: string
}

export default function UsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ nama: '', password: '', keterangan: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditUser(null)
    setForm({ nama: '', password: '', keterangan: '' })
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ nama: u.nama, password: '', keterangan: u.keterangan ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editUser) {
        // Update
        const body: Record<string, string> = { keterangan: form.keterangan }
        if (form.nama !== editUser.nama) body.nama = form.nama
        if (form.password) body.password = form.password

        const res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setUsers(u => u.map(x => x.id === editUser.id ? { ...x, ...data.data } : x))
        toast.success('Petugas berhasil diperbarui')
      } else {
        // Create
        if (!form.nama || !form.password) {
          toast.error('Nama dan password wajib'); return
        }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setUsers(u => [data.data, ...u])
        toast.success('Petugas berhasil ditambahkan')
      }
      setShowForm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally { setLoading(false) }
  }

  async function handleToggleActive(u: User) {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif: !u.aktif }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(list => list.map(x => x.id === u.id ? { ...x, aktif: !u.aktif } : x))
      toast.success(u.aktif ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Hapus akun "${u.nama}"? Tindakan ini permanen.`)) return
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(list => list.filter(x => x.id !== u.id))
      toast.success('Akun berhasil dihapus')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const petugas = users.filter(u => u.role === 'petugas')
  const admins = users.filter(u => u.role === 'admin')

  return (
    <div className="space-y-5">
      {/* Header aksi */}
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Petugas
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">
              {editUser ? `Edit: ${editUser.nama}` : 'Tambah Petugas Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nama Login</label>
                <input type="text" className="input" value={form.nama}
                  onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  required autoComplete="off" />
              </div>
              <div>
                <label className="label">
                  {editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                </label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'}
                    className="input pr-10"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!editUser}
                    placeholder={editUser ? 'Biarkan kosong jika tidak diubah' : 'Min. 6 karakter'}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Keterangan (opsional)</label>
                <input type="text" className="input" value={form.keterangan}
                  onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  placeholder="Jabatan, lokasi, dll" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={loading}
                  className="btn-primary flex-1">
                  {loading ? 'Menyimpan...' : editUser ? 'Update' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Admin */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 bg-[#1B5E20] text-white">
          <h3 className="font-bold">Admin</h3>
          <p className="text-xs text-white/70 mt-0.5">Hanya 1 admin yang diizinkan</p>
        </div>
        <div className="divide-y divide-[#DCE8DC]">
          {admins.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[#1B5E20]">{u.nama.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 flex items-center gap-2">
                  {u.nama}
                  <span className="badge-admin">Admin</span>
                  {u.id === currentUserId && (
                    <span className="text-xs text-gray-400">(Anda)</span>
                  )}
                </div>
                {u.keterangan && <div className="text-xs text-gray-400">{u.keterangan}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel Petugas */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 bg-[#FF8F00] text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold">Petugas</h3>
            <p className="text-xs text-white/80 mt-0.5">{petugas.length} akun terdaftar</p>
          </div>
        </div>

        {petugas.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <p>Belum ada petugas terdaftar.</p>
            <button onClick={openAdd} className="btn-primary mt-3 mx-auto">
              + Tambah Petugas
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {petugas.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-amber-700">
                            {u.nama.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{u.nama}</span>
                      </div>
                    </td>
                    <td className="text-gray-400 text-sm">{u.keterangan || '—'}</td>
                    <td>
                      <span className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                        u.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      )}>
                        {u.aktif ? <UserCheck size={11} /> : <UserX size={11} />}
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={clsx('p-1.5 rounded-lg text-sm transition-colors',
                            u.aktif ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-500'
                          )}
                          title={u.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                          {u.aktif ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
