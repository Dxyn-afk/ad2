import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getKategori, getActivityLog } from '@/lib/db'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/dashboard')

  const [kategori, activityLog] = await Promise.all([
    getKategori(),
    getActivityLog(30),
  ])

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi aplikasi & log aktivitas</p>
      </div>
      <AdminClient kategoriList={kategori} activityLog={activityLog} />
    </div>
  )
}
