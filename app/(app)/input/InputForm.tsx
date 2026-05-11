'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Truck, Sprout, Receipt, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import { todayStr, formatRupiah } from '@/lib/format'
import type { KategoriPengeluaran, FormSupir, FormPemanen, FormPengeluaran, DataHarian } from '@/types'
import clsx from 'clsx'

interface Props {
  kategoriList: KategoriPengeluaran[]
  editId?: string
  userRole: string
}

const emptySupir = (): FormSupir => ({ nama_supir: '', tonase: '' })
const emptyPemanen = (): FormPemanen => ({ nama_pemanen: '', jumlah_tandan: '' })
const emptyPengeluaran = (): FormPengeluaran => ({ kategori: '', deskripsi: '', jumlah: '' })

export default function InputForm({ kategoriList, editId, userRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editId)

  const [tanggal, setTanggal] = useState(todayStr())
  const [harga, setHarga] = useState('')
  const [catatan, setCatatan] = useState('')
  const [supirList, setSupirList] = useState<FormSupir[]>([emptySupir()])
  const [pemanenList, setPemanenList] = useState<FormPemanen[]>([])
  const [pengeluaranList, setPengeluaranList] = useState<FormPengeluaran[]>([])

  const [supirHistory, setSupirHistory] = useState<string[]>([])
  const [pemanenHistory, setPemanenHistory] = useState<string[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<string[]>(kategoriList.map(k => k.nama))

  // Load history nama
  useEffect(() => {
    fetch('/api/users?type=history')
      .then(r => r.json())
      .then(d => {
        setSupirHistory(d.supirNames ?? [])
        setPemanenHistory(d.pemanenNames ?? [])
      })
      .catch(() => {})
  }, [])

  // Load data untuk edit
  useEffect(() => {
    if (!editId) return
    setLoadingEdit(true)
    fetch(`/api/data/${editId}`)
      .then(r => r.json())
      .then(({ data }: { data: DataHarian }) => {
        setTanggal(data.tanggal)
        setHarga(String(data.harga_per_kg))
        setCatatan(data.catatan ?? '')
        setSupirList(data.supir_list?.length
          ? data.supir_list.map(s => ({ nama_supir: s.nama_supir, tonase: String(s.tonase) }))
          : [emptySupir()])
        setPemanenList(data.pemanen_list?.map(p => ({
          nama_pemanen: p.nama_pemanen,
          jumlah_tandan: String(p.jumlah_tandan)
        })) ?? [])
        setPengeluaranList(data.pengeluaran_list?.map(p => ({
          kategori: p.kategori,
          deskripsi: p.deskripsi ?? '',
          jumlah: String(p.jumlah)
        })) ?? [])
      })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoadingEdit(false))
  }, [editId])

  // Kalkulasi preview
  const totalTonase = supirList.reduce((s, x) => s + (parseFloat(x.tonase) || 0), 0)
  const hargaNum = parseFloat(harga) || 0
  const totalPemasukan = totalTonase * hargaNum
  const totalPengeluaran = pengeluaranList.reduce((s, x) => s + (parseFloat(x.jumlah) || 0), 0)
  const keuntungan = totalPemasukan - totalPengeluaran

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validSupir = supirList.filter(s => s.nama_supir.trim() && parseFloat(s.tonase) > 0)
    if (validSupir.length === 0) {
      toast.error('Minimal 1 supir dengan tonase valid')
      return
    }
    if (!harga || parseFloat(harga) <= 0) {
      toast.error('Harga per kg wajib diisi')
      return
    }

    setLoading(true)
    try {
      const body = {
        tanggal, harga_per_kg: harga, catatan,
        supir_list: validSupir,
        pemanen_list: pemanenList.filter(p => p.nama_pemanen.trim() && parseInt(p.jumlah_tandan) > 0),
        pengeluaran_list: pengeluaranList.filter(p => p.kategori && parseFloat(p.jumlah) > 0),
      }

      const url = editId ? `/api/data/${editId}` : '/api/data'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(editId ? 'Data berhasil diperbarui ✓' : 'Data berhasil disimpan ✓')
      router.push('/data')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tanggal + Harga */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="input"
              value={tanggal}
              max={todayStr()}
              onChange={e => setTanggal(e.target.value)}
              required
              disabled={!!editId} // tanggal tidak bisa diubah saat edit
            />
          </div>
          <div>
            <label className="label">Harga per kg (Rp)</label>
            <input
              type="number"
              className="input"
              placeholder="2900"
              value={harga}
              onChange={e => setHarga(e.target.value)}
              required
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Supir & Tonase */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Truck size={16} className="text-amber-600" />
            </div>
            <div>
              <div className="font-bold text-gray-800">Supir & Tonase</div>
              <div className="text-xs text-gray-400">Tiap supir bisa punya tonase berbeda</div>
            </div>
          </div>
          <button type="button" onClick={() => setSupirList(s => [...s, emptySupir()])}
            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
            <Plus size={14} /> Supir
          </button>
        </div>

        {/* Header kolom */}
        <div className="grid grid-cols-[1fr_120px_36px] gap-2 mb-2 px-1">
          <span className="text-xs font-semibold text-gray-400">NAMA SUPIR</span>
          <span className="text-xs font-semibold text-gray-400">TONASE (kg)</span>
          <span />
        </div>

        {supirList.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_36px] gap-2 mb-2">
            <AutocompleteInput
              value={s.nama_supir}
              onChange={v => setSupirList(list => list.map((x, j) => j === i ? { ...x, nama_supir: v } : x))}
              suggestions={supirHistory}
              placeholder="Nama supir"
            />
            <input
              type="number"
              className="input text-center"
              placeholder="0"
              value={s.tonase}
              onChange={e => setSupirList(list => list.map((x, j) => j === i ? { ...x, tonase: e.target.value } : x))}
              min="0"
              step="0.01"
            />
            {supirList.length > 1 && (
              <button type="button" onClick={() => setSupirList(list => list.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        {totalTonase > 0 && (
          <div className="mt-3 pt-3 border-t border-[#DCE8DC] flex justify-end">
            <span className="text-sm font-bold text-[#1B5E20]">
              Total: {formatRupiah(totalTonase).replace('Rp\u00a0','').replace(',00','')} kg
            </span>
          </div>
        )}
      </div>

      {/* Preview kalkulasi */}
      {(totalPemasukan > 0 || totalPengeluaran > 0) && (
        <div className={clsx(
          'rounded-xl p-4 border-2',
          keuntungan >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={16} className="text-gray-500" />
            <span className="font-semibold text-gray-600 text-sm">Preview Kalkulasi</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pemasukan</span>
              <span className="font-bold text-[#43A047]">{formatRupiah(totalPemasukan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pengeluaran</span>
              <span className="font-bold text-[#E53935]">{formatRupiah(totalPengeluaran)}</span>
            </div>
            <div className="border-t border-current/20 pt-1 flex justify-between">
              <span className="font-bold text-gray-700">Keuntungan</span>
              <span className={clsx('font-bold text-base', keuntungan >= 0 ? 'text-[#1B5E20]' : 'text-[#E53935]')}>
                {formatRupiah(keuntungan)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pemanen & Tandan */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Sprout size={16} className="text-green-700" />
            </div>
            <div>
              <div className="font-bold text-gray-800">Pemanen & Tandan</div>
              <div className="text-xs text-gray-400">Untuk evaluasi kinerja (opsional)</div>
            </div>
          </div>
          <button type="button" onClick={() => setPemanenList(s => [...s, emptyPemanen()])}
            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
            <Plus size={14} /> Pemanen
          </button>
        </div>

        {pemanenList.length === 0 ? (
          <button type="button" onClick={() => setPemanenList([emptyPemanen()])}
            className="w-full border-2 border-dashed border-[#DCE8DC] rounded-xl py-4 text-gray-400 text-sm hover:border-[#2E7D32] hover:text-[#2E7D32] transition-colors">
            + Tap untuk tambah pemanen
          </button>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_100px_36px] gap-2 mb-2 px-1">
              <span className="text-xs font-semibold text-gray-400">NAMA PEMANEN</span>
              <span className="text-xs font-semibold text-gray-400">TANDAN</span>
              <span />
            </div>
            {pemanenList.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_36px] gap-2 mb-2">
                <AutocompleteInput
                  value={p.nama_pemanen}
                  onChange={v => setPemanenList(list => list.map((x, j) => j === i ? { ...x, nama_pemanen: v } : x))}
                  suggestions={pemanenHistory}
                  placeholder="Nama pemanen"
                />
                <input
                  type="number"
                  className="input text-center"
                  placeholder="0"
                  value={p.jumlah_tandan}
                  onChange={e => setPemanenList(list => list.map((x, j) => j === i ? { ...x, jumlah_tandan: e.target.value } : x))}
                  min="0"
                />
                <button type="button" onClick={() => setPemanenList(list => list.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pengeluaran */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Receipt size={16} className="text-red-600" />
            </div>
            <div>
              <div className="font-bold text-gray-800">Pengeluaran</div>
              <div className="text-xs text-gray-400">Upah, transportasi, dll</div>
            </div>
          </div>
          <button type="button"
            onClick={() => setPengeluaranList(s => [...s, { ...emptyPengeluaran(), kategori: kategoriOptions[0] ?? '' }])}
            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
            <Plus size={14} /> Tambah
          </button>
        </div>

        {pengeluaranList.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-2">Belum ada pengeluaran</p>
        ) : (
          <div className="space-y-3">
            {pengeluaranList.map((p, i) => (
              <div key={i} className="bg-[#F9FBF2] rounded-xl p-3 border border-[#DCE8DC]">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">KATEGORI</label>
                    <select
                      className="input text-sm"
                      value={p.kategori}
                      onChange={e => setPengeluaranList(list => list.map((x, j) => j === i ? { ...x, kategori: e.target.value } : x))}
                    >
                      <option value="">Pilih kategori</option>
                      {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">JUMLAH (Rp)</label>
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="0"
                      value={p.jumlah}
                      onChange={e => setPengeluaranList(list => list.map((x, j) => j === i ? { ...x, jumlah: e.target.value } : x))}
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="input text-sm flex-1"
                    placeholder="Deskripsi (opsional)"
                    value={p.deskripsi}
                    onChange={e => setPengeluaranList(list => list.map((x, j) => j === i ? { ...x, deskripsi: e.target.value } : x))}
                  />
                  <button type="button" onClick={() => setPengeluaranList(list => list.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-1.5">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {totalPengeluaran > 0 && (
              <div className="flex justify-end pt-1">
                <span className="text-sm font-bold text-[#E53935]">
                  Total: {formatRupiah(totalPengeluaran)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Catatan */}
      <div className="card p-5">
        <label className="label">Catatan (opsional)</label>
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder="Catatan tambahan..."
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pb-8">
        <button type="button" onClick={() => router.back()}
          className="btn-secondary flex-1">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Menyimpan...' : editId ? 'Update Data' : 'Simpan Data'}
        </button>
      </div>
    </form>
  )
}

// Autocomplete component ringan tanpa library eksternal
function AutocompleteInput({
  value, onChange, suggestions, placeholder
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  ).slice(0, 5)

  return (
    <div className="relative">
      <input
        type="text"
        className="input"
        value={value}
        onChange={e => { onChange(e.target.value); setShow(true) }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {show && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DCE8DC] rounded-xl shadow-lg z-10 overflow-hidden">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#F1F8E9] transition-colors"
              onMouseDown={() => { onChange(s); setShow(false) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
