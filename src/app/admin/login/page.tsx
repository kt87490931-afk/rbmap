import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { isAdminPasswordEnabled } from '@/lib/admin-password-config'
import { hasAdminPasswordSession } from '@/lib/admin-password'
import { AdminPasswordForm } from './AdminPasswordForm'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  if (!isAdminPasswordEnabled()) {
    redirect('/api/auth/signin?callbackUrl=/admin')
  }
  if (await hasAdminPasswordSession()) {
    redirect('/admin')
  }

  return (
    <div className="admin-section" style={{ maxWidth: 480, margin: '48px auto', padding: '32px 24px' }}>
      <Suspense fallback={<p style={{ textAlign: 'center', color: 'var(--muted)' }}>로딩 중…</p>}>
        <AdminPasswordForm />
      </Suspense>
    </div>
  )
}
