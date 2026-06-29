import { NextRequest, NextResponse } from 'next/server'
import { isAdminPasswordEnabled, verifyAdminPassword, setAdminPasswordSessionCookie } from '@/lib/admin-password'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isAdminPasswordEnabled()) {
    return NextResponse.json({ error: '비밀번호 로그인이 비활성화되어 있습니다.' }, { status: 400 })
  }

  let password = ''
  try {
    const body = await request.json()
    password = String(body?.password ?? '')
  } catch {
    return NextResponse.json({ error: '비밀번호를 입력해 주세요.' }, { status: 400 })
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  await setAdminPasswordSessionCookie()
  return NextResponse.json({ ok: true })
}
