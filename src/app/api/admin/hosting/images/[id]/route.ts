import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { deleteHostingImage } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const ok = await deleteHostingImage(params.id)
  if (!ok) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
