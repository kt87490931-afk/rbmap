import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { createHostingFolder, listHostingFolders } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const folders = await listHostingFolders()
  return NextResponse.json({ folders })
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  let name = ''
  try {
    const body = await request.json()
    name = String(body?.name ?? '')
  } catch {
    return NextResponse.json({ error: '폴더 이름을 입력해 주세요.' }, { status: 400 })
  }

  try {
    const folder = await createHostingFolder(name)
    const folders = await listHostingFolders()
    return NextResponse.json({ folder, folders }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '폴더 생성 실패'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
