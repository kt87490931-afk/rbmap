import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SECTION_LABELS: Record<string, string> = {
  hero: '히어로',
  ticker: '티커',
  header: '헤더',
  seo: 'SEO/지역가이드',
  widgets_a: '위젯 A (가격/랭킹/업종)',
  widgets_b: '위젯 B (타임라인/지도/공지/FAQ)',
  stats: '통계',
  cta: 'CTA',
  footer: '푸터',
  region_preview: '지역별 업소 미리보기',
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
