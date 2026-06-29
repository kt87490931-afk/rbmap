import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { clearVideoSlot } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: Request,
  { params }: { params: { slot: string } }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const slot = Number(params.slot)
  if (!Number.isInteger(slot) || slot < 1 || slot > 4) {
    return NextResponse.json({ error: '슬롯은 1~4 사이여야 합니다.' }, { status: 400 })
  }

  const ok = await clearVideoSlot(slot)
  if (!ok) return NextResponse.json({ error: '비어 있는 슬롯입니다.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
