import { getSession } from '@/lib/auth'
import LaporanClient from './LaporanClient'

export const dynamic = 'force-dynamic'

export default async function LaporanPage() {
  const session = await getSession()
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan & Analisis</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap data dengan filter periode</p>
      </div>
      <LaporanClient userRole={session!.role} />
    </div>
  )
}
