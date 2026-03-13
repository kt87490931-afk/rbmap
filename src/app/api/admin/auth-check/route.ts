import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * 어드민 API 인증 상태 확인 (디버깅/배너용)
 * GET /api/admin/auth-check → 200 { ok: true } | 403 { error, code }
 */
export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr
  return NextResponse.json({ ok: true })
}
