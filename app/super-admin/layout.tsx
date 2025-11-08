'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  
  if (!session || session.user.role !== 'super-admin') {
    redirect('/login')
  }

  return <MainLayout userType="super-admin">{children}</MainLayout>
}
