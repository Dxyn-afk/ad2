import { getSession } from '@/lib/auth'
import { getRingkasan, getTrendData, getPengeluaranByKategori, getDataHarianList } from '@/lib/db'
import { todayStr, thisWeekRange, thisMonthRange, formatRupiah, formatAngka, formatTanggal, getHari } from '@/lib/format'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const session = await getSession()
  const today = todayStr()
  const week = thisWeekRange()
  const month = thisMonthRange()

  const [
    ringkasanHarian,
    ringkasanMingguan,
    ringkasanBulanan,
    trendBulanan,
    pengeluaranKat,
    recentData,
  ] = await Promise.all([
    getRingkasan(today, today),
    getRingkasan(week.from, week.to),
    getRingkasan(month.from, month.to),
    getTrendData(month.from, month.to),
    getPengeluaranByKategori(month.from, month.to),
    getDataHarianList({ limit: 5 }),
  ])

  return (
    <DashboardClient
      user={session!}
      ringkasanHarian={ringkasanHarian}
      ringkasanMingguan={ringkasanMingguan}
      ringkasanBulanan={ringkasanBulanan}
      trendBulanan={trendBulanan}
      pengeluaranKat={pengeluaranKat}
      recentData={recentData}
    />
  )
}
