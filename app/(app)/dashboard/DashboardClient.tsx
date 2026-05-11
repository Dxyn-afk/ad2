'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Scale, Leaf, Calendar,
  Users, PlusCircle, BarChart3, ArrowRight
} from 'lucide-react'
import { formatRupiah, formatAngka, formatTanggal, getHari } from '@/lib/format'
import type { SessionUser, Ringkasan, DataHarian } from '@/types'
import clsx from 'clsx'

const PIE_COLORS = ['#1B5E20','#E53935','#FF8F00','#00695C','#6A1B9A','#1565C0','#795548']

interface Props {
  user: SessionUser
  ringkasanHarian: Ringkasan
  ringkasanMingguan: Ringkasan
  ringkasanBulanan: Ringkasan
  trendBulanan: Array<{ tanggal: string; total_pemasukan: number; total_pengeluaran: number; keuntungan: number; total_tonase: number }>
  pengeluaranKat: Array<{ kategori: string; total: number }>
  recentData: DataHarian[]
}

const TABS = ['Hari Ini','Minggu Ini','Bulan Ini'] as const
type Tab = typeof TABS[number]

export default function DashboardClient({
  user, ringkasanHarian, ringkasanMingguan, ringkasanBulanan,
  trendBulanan, pengeluaranKat, recentData
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Bulan Ini')

  const ringkasan = activeTab === 'Hari Ini' ? ringkasanHarian
    : activeTab === 'Minggu Ini' ? ringkasanMingguan
    : ringkasanBulanan

  const chartData = trendBulanan.map(d => ({
    tanggal: formatTanggal(d.tanggal).slice(0, 5),
    Pemasukan: Number(d.total_pemasukan),
    Pengeluaran: Number(d.total_pengeluaran),
    Tonase: Number(d.total_tonase),
  }))

  const formatTooltipValue = (v: number) => formatRupiah(v)

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang, <span className="font-semibold text-[#1B5E20]">{user.nama}</span>
          </p>
        </div>
        {(user.role === 'admin' || user.role === 'petugas') && (
          <Link href="/input">
            <button className="btn-primary flex items-center gap-2">
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Input Data</span>
            </button>
          </Link>
        )}
      </div>

      {/* Tab period selector */}
      <div className="flex gap-1 bg-white border border-[#DCE8DC] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab
                ? 'bg-[#1B5E20] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Hero keuntungan */}
      <div className={clsx(
        'rounded-2xl p-6 text-white shadow-lg',
        ringkasan.keuntungan >= 0
          ? 'bg-gradient-to-br from-[#1B5E20] to-[#2E7D32]'
          : 'bg-gradient-to-br from-[#B71C1C] to-[#E53935]'
      )}>
        <p className="text-white/70 text-sm font-medium mb-1">Keuntungan Bersih</p>
        <p className="text-4xl font-bold mb-4">{formatRupiah(ringkasan.keuntungan)}</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Tonase', value: `${formatAngka(ringkasan.total_tonase)} kg`, icon: <Scale size={14} /> },
            { label: 'Tandan', value: `${ringkasan.total_tandan}`, icon: <Leaf size={14} /> },
            { label: 'Hari Kerja', value: `${ringkasan.jumlah_hari_kerja}`, icon: <Calendar size={14} /> },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center gap-1 text-white/60 text-xs mb-0.5">
                {item.icon} {item.label}
              </div>
              <div className="font-bold text-sm">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-[#43A047]">
            <TrendingUp size={18} />
            <span className="text-sm font-semibold text-gray-500">Pemasukan</span>
          </div>
          <div className="text-xl font-bold text-[#43A047]">
            {formatRupiah(ringkasan.total_pemasukan)}
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-[#E53935]">
            <TrendingDown size={18} />
            <span className="text-sm font-semibold text-gray-500">Pengeluaran</span>
          </div>
          <div className="text-xl font-bold text-[#E53935]">
            {formatRupiah(ringkasan.total_pengeluaran)}
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        {chartData.length > 1 && (
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-bold text-gray-700 mb-4">Tren Bulan Ini</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE8DC" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="Pemasukan" stroke="#43A047" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pengeluaran" stroke="#E53935" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar chart tonase */}
        {chartData.length > 1 && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 mb-4">Tonase per Hari</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE8DC" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={35} />
                <Tooltip />
                <Bar dataKey="Tonase" fill="#1B5E20" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pengeluaran pie / bar */}
        {pengeluaranKat.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 mb-4">Rincian Pengeluaran</h3>
            <div className="space-y-2">
              {pengeluaranKat.slice(0, 6).map((item, i) => {
                const total = pengeluaranKat.reduce((s, x) => s + x.total, 0)
                const pct = total > 0 ? (item.total / total) * 100 : 0
                return (
                  <div key={item.kategori}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 truncate max-w-[160px]">{item.kategori}</span>
                      <span className="font-semibold text-gray-700 ml-2">
                        {formatRupiah(item.total)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {recentData.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE8DC]">
            <h3 className="font-bold text-gray-700">Aktivitas Terbaru</h3>
            <Link href="/data" className="text-[#1B5E20] text-sm font-semibold flex items-center gap-1 hover:underline">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[#DCE8DC]">
            {recentData.map(dh => (
              <div key={dh.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#F1F8E9] transition-colors">
                <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-[#1B5E20] leading-none">
                    {new Date(dh.tanggal).getDate()}
                  </span>
                  <span className="text-[10px] text-[#5A6A5A]">{formatTanggal(dh.tanggal).split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800">{getHari(dh.tanggal)}, {formatTanggal(dh.tanggal)}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {formatAngka(Number(dh.total_tonase))} kg • {dh.jumlah_supir} supir
                    {dh.created_by_nama && ` • oleh ${dh.created_by_nama}`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-[#43A047]">
                    {formatRupiah(Number(dh.total_pemasukan))}
                  </div>
                  <div className={clsx(
                    'text-xs font-semibold',
                    Number(dh.keuntungan) >= 0 ? 'text-[#43A047]' : 'text-[#E53935]'
                  )}>
                    {formatRupiah(Number(dh.keuntungan))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
