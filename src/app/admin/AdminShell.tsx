'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebar } from './AdminSidebar'

/** OTP 설정·인증 화면은 사이드바 없이 전체 폭 사용 */
export function AdminShell({
  children,
  disabled,
  setupMode,
  bare,
  passwordMode,
}: {
  children: React.ReactNode
  disabled?: boolean
  setupMode?: boolean
  bare?: boolean
  passwordMode?: boolean
}) {
  const pathname = usePathname()
  const isOtpFlow =
    bare ||
    pathname?.includes('/verify-otp') ||
    pathname?.includes('/setup-otp') ||
    pathname?.includes('/admin/login')

  if (isOtpFlow) {
    return <div className="admin-otp-shell">{children}</div>
  }

  return (
    <div className="admin-layout">
      <AdminSidebar disabled={disabled} setupMode={setupMode} passwordMode={passwordMode} />
      <div className="admin-content">{children}</div>
    </div>
  )
}
