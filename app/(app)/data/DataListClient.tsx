'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, Edit2, Trash2, ChevronDown,
  ChevronUp, Eye, PlusCircle, Truck, Sprout, Receipt
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatRupiah, formatAngka, formatTanggal, getHari } from '@/lib/format'
import type { DataHarian } from '@/types'
import clsx from 'clsx'

interface Props {
  initialData: DataHarian[]
  userRole: string
  defaultFrom: string
  defaultTo: string
}

export default function DataListClient({ initialData, userRole, defaultFrom, defaultTo }: Props) {
  const router = useRouter()
  const [data, setData] = useState<DataHarian[]>(initialData)
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAdmin = userRole === 'admin'
  const canInput = userRole === 'admin' || userRole === 'petugas'

  const fetchData = useCallback(async (f: string, t: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data?from=${f}&to=${t}&limit=200`)
      const json = await res.json()
      setData(json.data ?? [])
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [])

  function handleFilter() { fetchData(from, to) }

  const filtered = data.filter(dh =>
    search === '' ||
    formatTanggal(dh.tanggal).toLowerCase().includes(search.toLowerCase()) ||
    getHari(dh.tanggal).toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string, tanggal: string) {
    if (!confirm(`Hapus data tanggal ${formatTanggal(tanggal)}? Tindakan tidak bisa dibatalkan.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/data/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(d => d.filter(x => x.id !== id))
      toast.success('Data berhasil dihapus')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally { setDeletingId(null) }
  }

  async function loadDetail(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    // Cek apakah sudah ada detail
    const existing = data.find(d => d.id === id)
    if (existing?.supir_list) return // sudah ada

    try {
      const res = await fetch(`/api/data/${id}`)
      const json = await res.json()
      setData(d => d.map(x => x.id === id ? { ...x, ...json.data } : x))
    } catch { toast.error('Gagal memuat detail') }
  }

  // Hitung total
  const totalPemasukan = filtered.reduce((s, d) => s + Number(d.total_pemasukan), 0)
  const totalPengeluaran = filtered.reduce((s, d) => s + Number(d.total_pengeluaran), 0)
  const totalKeuntungan = filtered.reduce((s, d) => s + Number(d.keuntungan), 0)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div>
            <label className="label text-xs">Dari Tanggal</label>
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Sampai Tanggal</label>
            <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button onClick={handleFilter} disabled={loading}
            className="btn-primary flex items-center gap-2">
            <Filter size={15} />
            {loading ? 'Memuat...' : 'Filter'}
          </button>
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Cari tanggal / hari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {canInput && (
            <Link href="/input">
              <button className="btn-primary flex items-center gap-2">
                <PlusCircle size={15} /> Tambah
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Pemasukan', value: formatRupiah(totalPemasukan), color: 'text-[#43A047]' },
            { label: 'Total Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-[#E53935]' },
            { label: 'Total Keuntungan', value: formatRupiah(totalKeuntungan), color: totalKeuntungan >= 0 ? 'text-[#1B5E20]' : 'text-[#E53935]' },
          ].map(item => (
            <div key={item.label} className="card p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">{item.label}</div>
              <div className={clsx('font-bold text-sm', item.color)}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data list */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">Tidak ada data untuk periode ini</p>
          {canInput && (
            <Link href="/input">
              <button className="btn-primary mt-4 mx-auto">+ Input Data Baru</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(dh => {
            const expanded = expandedId === dh.id
            const isDeleting = deletingId === dh.id

            return (
              <div key={dh.id} className="card overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F9FBF2] transition-colors"
                  onClick={() => loadDetail(dh.id)}
                >
                  {/* Tanggal badge */}
                  <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-[#1B5E20] leading-none">
                      {new Date(dh.tanggal + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[9px] text-[#5A6A5A]">
                      {formatTanggal(dh.tanggal).split(' ')[1]}
                    </span>
                  </div>

                  {/* Info utama */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800">
                      {getHari(dh.tanggal)}, {formatTanggal(dh.tanggal)}
                    </div>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-0.5">
                      <span>🚛 {formatAngka(Number(dh.total_tonase))} kg</span>
                      <span>•</span>
                      <span>Rp {formatAngka(Number(dh.harga_per_kg))}/kg</span>
                      {dh.created_by_nama && (
                        <>
                          <span>•</span>
                          <span>oleh {dh.created_by_nama}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Finansial */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="font-bold text-sm text-[#43A047]">
                      {formatRupiah(Number(dh.total_pemasukan))}
                    </div>
                    <div className={clsx('text-xs font-semibold',
                      Number(dh.keuntungan) >= 0 ? 'text-[#1B5E20]' : 'text-[#E53935]'
                    )}>
                      {formatRupiah(Number(dh.keuntungan))}
                    </div>
                  </div>

                  {/* Aksi */}
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {isAdmin && (
                      <>
                        <Link href={`/input?edit=${dh.id}`}>
                          <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit">
                            <Edit2 size={15} />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(dh.id, dh.tanggal)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Mobile financial */}
                <div className="sm:hidden px-4 pb-3 flex gap-4">
                  <span className="text-sm font-bold text-[#43A047]">
                    {formatRupiah(Number(dh.total_pemasukan))}
                  </span>
                  <span className={clsx('text-sm font-semibold',
                    Number(dh.keuntungan) >= 0 ? 'text-[#1B5E20]' : 'text-[#E53935]'
                  )}>
                    {formatRupiah(Number(dh.keuntungan))}
                  </span>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-[#DCE8DC] p-4 bg-[#F9FBF2] space-y-4">
                    {/* Supir */}
                    {dh.supir_list && dh.supir_list.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Truck size={14} className="text-amber-600" />
                          <span className="text-xs font-bold text-gray-500 uppercase">Supir & Tonase</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dh.supir_list.map((s, i) => (
                            <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-sm">
                              <span className="font-semibold text-amber-800">{s.nama_supir}</span>
                              <span className="text-amber-600 ml-2">{formatAngka(s.tonase)} kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pemanen */}
                    {dh.pemanen_list && dh.pemanen_list.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sprout size={14} className="text-green-600" />
                          <span className="text-xs font-bold text-gray-500 uppercase">Pemanen & Tandan</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dh.pemanen_list.map((p, i) => (
                            <div key={i} className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-sm">
                              <span className="font-semibold text-green-800">{p.nama_pemanen}</span>
                              <span className="text-green-600 ml-2">{p.jumlah_tandan} tandan</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pengeluaran */}
                    {dh.pengeluaran_list && dh.pengeluaran_list.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt size={14} className="text-red-500" />
                          <span className="text-xs font-bold text-gray-500 uppercase">Pengeluaran</span>
                        </div>
                        <div className="space-y-1">
                          {dh.pengeluaran_list.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b border-[#DCE8DC] last:border-0">
                              <span className="text-gray-600">
                                {p.kategori}
                                {p.deskripsi && <span className="text-gray-400 ml-1">({p.deskripsi})</span>}
                              </span>
                              <span className="font-semibold text-[#E53935]">{formatRupiah(p.jumlah)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm pt-1 font-bold">
                            <span>Total Pengeluaran</span>
                            <span className="text-[#E53935]">{formatRupiah(Number(dh.total_pengeluaran))}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Catatan */}
                    {dh.catatan && (
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-600 border border-[#DCE8DC]">
                        📝 {dh.catatan}
                      </div>
                    )}

                    {/* Info audit */}
                    <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                      {dh.created_by_nama && <span>Dibuat oleh: <strong>{dh.created_by_nama}</strong></span>}
                      {dh.updated_by_nama && <span>Diedit oleh: <strong>{dh.updated_by_nama}</strong></span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
