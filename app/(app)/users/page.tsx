import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUsers } from '@/lib/db'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/dashboard')

  const users = await getUsers()
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kelola Pengguna</h1>
        <p className="text-sm text-gray-500 mt-1">Tambah dan kelola akun petugas</p>
      </div>
      <UsersClient initialUsers={users} currentUserId={session!.id!} />
    </div>
  )
}
