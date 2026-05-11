import { getSession } from '@/lib/auth'
import { getDataHarianList } from '@/lib/db'
import { thisMonthRange } from '@/lib/format'
import DataListClient from './DataListClient'

export const dynamic = 'force-dynamic'

export default async function DataPage() {
  const session = await getSession()
  const month = thisMonthRange()
  const data = await getDataHarianList({ from: month.from, to: month.to, limit: 100 })

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Data</h1>
        <p className="text-sm text-gray-500 mt-1">Semua catatan operasional harian</p>
      </div>
      <DataListClient
        initialData={data}
        userRole={session!.role}
        defaultFrom={month.from}
        defaultTo={month.to}
      />
    </div>
  )
}
