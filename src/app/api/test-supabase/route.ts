import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Supabase 연결 테스트: auth.getSession() 호출
    const { data, error } = await supabase.auth.getSession()
    return NextResponse.json({
      ok: !error,
      message: error ? '연결 실패' : 'Supabase 연결 성공',
      error: error?.message ?? null,
      session: data?.session ? '세션 조회 가능' : 'anon (세션 없음)',
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      message: '연결 실패',
      error: String(e),
    }, { status: 500 })
  }
}
