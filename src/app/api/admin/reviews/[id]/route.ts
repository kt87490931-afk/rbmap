import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** 단일 리뷰 조회 (수정용) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

/** review_posts 수정 (제목, 섹션 내용, 별점, published_at 등) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const body = await request.json()

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('review_posts')
    .select('id, status, slug, region, type, venue_slug, venue')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 발행된 글은 URL에 영향을 주는 식별 필드(slug·지역·업종·업소) 변경 금지
  if (existing.status === 'published') {
    const locked = ['slug', 'region', 'type', 'venue_slug', 'venue'] as const
    const attempted = locked.filter((k) => body[k] !== undefined && body[k] !== existing[k])
    if (attempted.length > 0) {
      return NextResponse.json(
        { error: `발행된 후기는 ${attempted.join(', ')} 변경이 불가합니다. URL 색인 보호를 위해 슬러그는 불변입니다.` },
        { status: 400 }
      )
    }
  }

  const update: Record<string, unknown> = {}
  const keys = [
    'title', 'star', 'status', 'published_at', 'visit_date',
    'sec_overview', 'sec_lineup', 'sec_price', 'sec_facility', 'sec_summary',
    'good_tags', 'bad_tags', 'meta_description', 'meta_keywords',
    'summary_rating', 'summary_price', 'summary_lineup', 'summary_price_type',
    'venue_page_url', 'sort_order',
  ]
  for (const k of keys) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

/** review_posts (생성된 리뷰) 삭제 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const { error } = await supabaseAdmin.from('review_posts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
