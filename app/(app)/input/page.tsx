import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canInput } from '@/lib/auth'
import { getKategori } from '@/lib/db'
import InputForm from './InputForm'

export const dynamic = 'force-dynamic'

export default async function InputPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const session = await getSession()
  if (!canInput(session?.role)) redirect('/dashboard')

  const kategori = await getKategori()
  const editId = searchParams.edit

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {editId ? 'Edit Data Harian' : 'Input Data Harian'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {editId ? 'Perubahan data dicatat dengan nama Anda' : 'Data akan dicatat atas nama Anda'}
        </p>
      </div>
      <InputForm
        kategoriList={kategori}
        editId={editId}
        userRole={session!.role}
      />
    </div>
  )
}
