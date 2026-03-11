import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SECTION_LABELS: Record<string, string> = {
  hero: '0. 히어로',
  about: '1. about 룸빵여지도',
  region_guide: '2. 지역별 완전가이드',
  category_guide: '3. 업종별 완전 이해',
  partners_config: '4. 제휴업체 (노출개수)',
  feed_config: '5. 실시간 최신 업데이트',
  widgets_a: '6. 평균가격·위젯·랭킹·트랜드',
  region_preview: '7. 지역별 주요업소',
  review_config: '8. 6시간마다 최신리뷰',
  widgets_b: '9. 타임라인·지역빠른이동·공지·FAQ',
  stats: '10. 통계',
  cta: '11. 광고 및 등록 문의',
  ticker: '티커',
  header: '헤더',
  footer: '푸터',
}

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('site_sections')
    .select('section_key, content, updated_at')
    .order('section_key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (data ?? []).map((r) => ({
    key: r.section_key,
    label: SECTION_LABELS[r.section_key] ?? r.section_key,
    updated_at: r.updated_at,
    has_content: !!r.content && Object.keys(r.content).length > 0,
  }))

  return NextResponse.json(list)
}
