'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FileText, Download, Printer, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatRupiah, formatAngka, formatTanggal, getHari, monthRange } from '@/lib/format'
import type { Ringkasan, DataHarian } from '@/types'
import clsx from 'clsx'

type TabPeriod = 'minggu' | 'bulan' | 'custom'

interface StatsData {
  ringkasan: Ringkasan
  trend: Array<{ tanggal: string; total_pemasukan: number; total_pengeluaran: number; total_tonase: number }>
  pengeluaranKat: Array<{ kategori: string; total: number }>
  dateFrom: string
  dateTo: string
}

const CAT_COLORS = ['#1B5E20','#E53935','#FF8F00','#00695C','#6A1B9A','#1565C0','#795548','#37474F']

export default function LaporanClient({ userRole }: { userRole: string }) {
  const [tab, setTab] = useState<TabPeriod>('bulan')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [dataList, setDataList] = useState<DataHarian[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const canExport = userRole === 'admin' || userRole === 'petugas'

  const getRange = useCallback(() => {
    if (tab === 'minggu') {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      const mon = new Date(now); mon.setDate(now.getDate() - diff)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return {
        from: mon.toISOString().slice(0, 10),
        to: sun.toISOString().slice(0, 10),
      }
    }
    if (tab === 'custom') return { from: customFrom, to: customTo }
    const r = monthRange(year, month)
    return { from: r.from, to: r.to }
  }, [tab, year, month, customFrom, customTo])

  const load = useCallback(async () => {
    const { from, to } = getRange()
    if (!from || !to) return
    setLoading(true)
    try {
      const [statsRes, dataRes] = await Promise.all([
        fetch(`/api/stats?from=${from}&to=${to}`),
        fetch(`/api/data?from=${from}&to=${to}&limit=200`),
      ])
      const [statsJson, dataJson] = await Promise.all([statsRes.json(), dataRes.json()])
      setStats(statsJson)
      setDataList(dataJson.data ?? [])
    } catch { toast.error('Gagal memuat laporan') }
    finally { setLoading(false) }
  }, [getRange])

  useEffect(() => { load() }, [load])

  const periodeLabel = () => {
    if (!stats) return ''
    return `${formatTanggal(stats.dateFrom)} – ${formatTanggal(stats.dateTo)}`
  }

  async function handleExportPDF() {
    if (!stats || dataList.length === 0) { toast.error('Tidak ada data'); return }
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // Header
      doc.setFillColor(27, 94, 32)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18); doc.setFont('helvetica', 'bold')
      doc.text('day 🌿 — Laporan Operasional Kebun Sawit', 14, 12)
      doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      doc.text(periodeLabel(), 14, 20)

      // Ringkasan
      doc.setTextColor(27, 94, 32)
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('RINGKASAN', 14, 36)

      const r = stats.ringkasan
      autoTable(doc, {
        startY: 40,
        head: [['Metrik', 'Nilai']],
        body: [
          ['Total Pemasukan', formatRupiah(r.total_pemasukan)],
          ['Total Pengeluaran', formatRupiah(r.total_pengeluaran)],
          ['Keuntungan Bersih', formatRupiah(r.keuntungan)],
          ['Total Tonase', `${formatAngka(r.total_tonase)} kg`],
          ['Total Tandan', `${r.total_tandan}`],
          ['Hari Kerja', `${r.jumlah_hari_kerja} hari`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [27, 94, 32], textColor: 255 },
        alternateRowStyles: { fillColor: [232, 245, 233] },
        margin: { left: 14, right: 14 },
        tableWidth: 182,
      })

      // Detail harian
      doc.addPage()
      doc.setTextColor(27, 94, 32)
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('DETAIL DATA HARIAN', 14, 16)

      autoTable(doc, {
        startY: 20,
        head: [['Tanggal', 'Hari', 'Tonase (kg)', 'Harga/kg', 'Pemasukan', 'Pengeluaran', 'Keuntungan']],
        body: dataList.map(d => [
          formatTanggal(d.tanggal),
          getHari(d.tanggal),
          formatAngka(Number(d.total_tonase)),
          formatRupiah(Number(d.harga_per_kg)),
          formatRupiah(Number(d.total_pemasukan)),
          formatRupiah(Number(d.total_pengeluaran)),
          formatRupiah(Number(d.keuntungan)),
        ]),
        foot: [[
          'TOTAL', '', formatAngka(r.total_tonase), '',
          formatRupiah(r.total_pemasukan),
          formatRupiah(r.total_pengeluaran),
          formatRupiah(r.keuntungan),
        ]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 94, 32], textColor: 255 },
        footStyles: { fillColor: [200, 230, 201], textColor: [27, 94, 32], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [232, 245, 233] },
        margin: { left: 14, right: 14 },
      })

      // Pengeluaran per kategori
      if (stats.pengeluaranKat.length > 0) {
        doc.addPage()
        doc.setTextColor(27, 94, 32)
        doc.setFontSize(12); doc.setFont('helvetica', 'bold')
        doc.text('RINCIAN PENGELUARAN', 14, 16)
        const totalPen = stats.pengeluaranKat.reduce((s, x) => s + x.total, 0)
        autoTable(doc, {
          startY: 20,
          head: [['Kategori', 'Total (Rp)', '%']],
          body: stats.pengeluaranKat.map(x => [
            x.kategori,
            formatRupiah(x.total),
            `${((x.total / totalPen) * 100).toFixed(1)}%`,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [183, 28, 28], textColor: 255 },
          alternateRowStyles: { fillColor: [255, 235, 238] },
          margin: { left: 14, right: 14 },
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8); doc.setTextColor(150)
        doc.text(`day App — ${periodeLabel()} | Hal ${i}/${pageCount}`, 14, 290)
      }

      doc.save(`laporan-sawit-${stats.dateFrom}-${stats.dateTo}.pdf`)
      toast.success('PDF berhasil diunduh!')
    } catch (err) {
      toast.error('Gagal membuat PDF')
      console.error(err)
    } finally { setExporting(false) }
  }

  async function handleExportExcel() {
    if (!stats || dataList.length === 0) { toast.error('Tidak ada data'); return }
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const r = stats.ringkasan

      // Sheet Ringkasan
      const ws1 = XLSX.utils.aoa_to_sheet([
        ['day 🌿 — Laporan Operasional Kebun Sawit'],
        [periodeLabel()],
        [],
        ['RINGKASAN'],
        ['Total Pemasukan', r.total_pemasukan],
        ['Total Pengeluaran', r.total_pengeluaran],
        ['Keuntungan Bersih', r.keuntungan],
        ['Total Tonase (kg)', r.total_tonase],
        ['Total Tandan', r.total_tandan],
        ['Hari Kerja', r.jumlah_hari_kerja],
      ])
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan')

      // Sheet Detail Harian
      const ws2 = XLSX.utils.aoa_to_sheet([
        ['Tanggal', 'Hari', 'Tonase (kg)', 'Harga/kg', 'Pemasukan', 'Pengeluaran', 'Keuntungan', 'Oleh'],
        ...dataList.map(d => [
          d.tanggal,
          getHari(d.tanggal),
          Number(d.total_tonase),
          Number(d.harga_per_kg),
          Number(d.total_pemasukan),
          Number(d.total_pengeluaran),
          Number(d.keuntungan),
          d.created_by_nama ?? '',
        ]),
        [],
        ['TOTAL', '', r.total_tonase, '', r.total_pemasukan, r.total_pengeluaran, r.keuntungan],
      ])
      XLSX.utils.book_append_sheet(wb, ws2, 'Detail Harian')

      // Sheet Pengeluaran
      if (stats.pengeluaranKat.length > 0) {
        const totalPen = stats.pengeluaranKat.reduce((s, x) => s + x.total, 0)
        const ws3 = XLSX.utils.aoa_to_sheet([
          ['Kategori', 'Total (Rp)', 'Persentase'],
          ...stats.pengeluaranKat.map(x => [x.kategori, x.total, `${((x.total / totalPen) * 100).toFixed(1)}%`]),
        ])
        XLSX.utils.book_append_sheet(wb, ws3, 'Pengeluaran')
      }

      XLSX.writeFile(wb, `laporan-sawit-${stats.dateFrom}-${stats.dateTo}.xlsx`)
      toast.success('Excel berhasil diunduh!')
    } catch (err) {
      toast.error('Gagal membuat Excel')
      console.error(err)
    } finally { setExporting(false) }
  }

  function handlePrint() {
    window.print()
  }

  const chartData = (stats?.trend ?? []).map(d => ({
    tgl: formatTanggal(d.tanggal).slice(0, 5),
    Pemasukan: Number(d.total_pemasukan),
    Pengeluaran: Number(d.total_pengeluaran),
    Tonase: Number(d.total_tonase),
  }))

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Tab */}
          <div className="flex gap-1 bg-[#F1F8E9] rounded-xl p-1">
            {(['minggu', 'bulan', 'custom'] as TabPeriod[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all',
                  tab === t ? 'bg-[#1B5E20] text-white' : 'text-gray-500 hover:text-gray-700'
                )}>
                {t === 'minggu' ? 'Mingguan' : t === 'bulan' ? 'Bulanan' : 'Custom'}
              </button>
            ))}
          </div>

          {/* Bulan navigator */}
          {tab === 'bulan' && (
            <div className="flex items-center gap-2">
              <select className="input py-2" value={month} onChange={e => setMonth(+e.target.value)}>
                {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select className="input py-2" value={year} onChange={e => setYear(+e.target.value)}>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom range */}
          {tab === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" className="input py-2" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              <span className="text-gray-400">–</span>
              <input type="date" className="input py-2" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          )}

          <button onClick={load} disabled={loading}
            className="btn-primary flex items-center gap-2">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>

          {/* Export buttons — hanya admin & petugas */}
          {canExport && stats && dataList.length > 0 && (
            <div className="flex gap-2 ml-auto">
              <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
                <Printer size={15} /> Print
              </button>
              <button onClick={handleExportExcel} disabled={exporting}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Download size={15} /> Excel
              </button>
              <button onClick={handleExportPDF} disabled={exporting}
                className="btn-primary flex items-center gap-2 text-sm">
                <FileText size={15} />
                {exporting ? 'Membuat...' : 'PDF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan */}
      {stats && (
        <>
          <div className={clsx(
            'rounded-2xl p-6 text-white',
            stats.ringkasan.keuntungan >= 0
              ? 'bg-gradient-to-br from-[#1B5E20] to-[#2E7D32]'
              : 'bg-gradient-to-br from-[#B71C1C] to-[#E53935]'
          )}>
            <p className="text-white/70 text-sm mb-1">Keuntungan Bersih — {periodeLabel()}</p>
            <p className="text-4xl font-bold mb-5">{formatRupiah(stats.ringkasan.keuntungan)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Pemasukan', value: formatRupiah(stats.ringkasan.total_pemasukan) },
                { label: 'Pengeluaran', value: formatRupiah(stats.ringkasan.total_pengeluaran) },
                { label: 'Total Tonase', value: `${formatAngka(stats.ringkasan.total_tonase)} kg` },
                { label: 'Hari Kerja', value: `${stats.ringkasan.jumlah_hari_kerja} hari` },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-white/60 text-xs mb-0.5">{item.label}</div>
                  <div className="font-bold text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-5 lg:col-span-2">
                <h3 className="font-bold text-gray-700 mb-4">Tren Pemasukan vs Pengeluaran</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCE8DC" />
                    <XAxis dataKey="tgl" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `${(v / 1e6).toFixed(0)}jt`} tick={{ fontSize: 10 }} width={38} />
                    <Tooltip formatter={(v: number) => formatRupiah(v)} />
                    <Legend iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="Pemasukan" stroke="#43A047" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Pengeluaran" stroke="#E53935" strokeWidth={2} dot={false} strokeDasharray="5 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-gray-700 mb-4">Tonase per Hari</h3>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCE8DC" />
                    <XAxis dataKey="tgl" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} width={35} />
                    <Tooltip />
                    <Bar dataKey="Tonase" fill="#1B5E20" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {stats.pengeluaranKat.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-700 mb-4">Rincian Pengeluaran</h3>
                  {(() => {
                    const total = stats.pengeluaranKat.reduce((s, x) => s + x.total, 0)
                    return (
                      <div className="space-y-2.5">
                        {stats.pengeluaranKat.slice(0, 7).map((item, i) => (
                          <div key={item.kategori}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 truncate max-w-[150px]">{item.kategori}</span>
                              <span className="font-semibold ml-2">
                                {formatRupiah(item.total)} ({((item.total / total) * 100).toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{
                                width: `${(item.total / total) * 100}%`,
                                background: CAT_COLORS[i % CAT_COLORS.length]
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Tabel detail */}
          <div className="card overflow-hidden print:shadow-none">
            <div className="px-5 py-4 border-b border-[#DCE8DC] flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Tabel Detail Harian</h3>
              <span className="text-sm text-gray-400">{dataList.length} hari</span>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Hari</th>
                    <th className="text-right">Tonase</th>
                    <th className="text-right">Harga/kg</th>
                    <th className="text-right">Pemasukan</th>
                    <th className="text-right">Pengeluaran</th>
                    <th className="text-right">Keuntungan</th>
                    <th>Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {dataList.map(d => (
                    <tr key={d.id}>
                      <td className="font-medium">{formatTanggal(d.tanggal)}</td>
                      <td className="text-gray-500">{getHari(d.tanggal)}</td>
                      <td className="text-right">{formatAngka(Number(d.total_tonase))} kg</td>
                      <td className="text-right">{formatRupiah(Number(d.harga_per_kg))}</td>
                      <td className="text-right text-[#43A047] font-semibold">{formatRupiah(Number(d.total_pemasukan))}</td>
                      <td className="text-right text-[#E53935] font-semibold">{formatRupiah(Number(d.total_pengeluaran))}</td>
                      <td className={clsx('text-right font-bold',
                        Number(d.keuntungan) >= 0 ? 'text-[#1B5E20]' : 'text-[#E53935]'
                      )}>
                        {formatRupiah(Number(d.keuntungan))}
                      </td>
                      <td className="text-gray-400 text-xs">{d.created_by_nama ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E8F5E9] font-bold text-[#1B5E20]">
                    <td colSpan={2} className="px-4 py-3">TOTAL ({dataList.length} hari)</td>
                    <td className="text-right px-4">{formatAngka(stats.ringkasan.total_tonase)} kg</td>
                    <td />
                    <td className="text-right px-4 text-[#43A047]">{formatRupiah(stats.ringkasan.total_pemasukan)}</td>
                    <td className="text-right px-4 text-[#E53935]">{formatRupiah(stats.ringkasan.total_pengeluaran)}</td>
                    <td className={clsx('text-right px-4',
                      stats.ringkasan.keuntungan >= 0 ? 'text-[#1B5E20]' : 'text-[#E53935]'
                    )}>
                      {formatRupiah(stats.ringkasan.keuntungan)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
