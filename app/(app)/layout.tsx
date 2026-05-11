import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { adminExists } from '@/lib/auth'
import Layout from '@/components/Layout'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cek apakah admin sudah ada, kalau belum redirect ke register
  const exists = await adminExists()
  if (!exists) redirect('/register-admin')

  const session = await getSession()
  if (!session) redirect('/login')

  return <Layout user={session}>{children}</Layout>
}
