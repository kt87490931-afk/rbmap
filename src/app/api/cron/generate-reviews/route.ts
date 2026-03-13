/**
 * 리뷰 자동 생성 Cron API
 * 6시간마다 호출: 활성 제휴업체 중 is_applied된 소개글이 있는 곳에 1건씩 리뷰 생성
 * GET ?cron_secret=xxx 또는 Authorization: Bearer xxx
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { generateReview } from '@/lib/gemini/review-api'
import {
  pickScenarioCombo,
  pickTone,
  type ScenarioCombo,
  type ReviewTone,
} from '@/lib/review-scenarios'
import { REGION_SLUG_TO_NAME, SLUG_TO_TYPE } from '@/lib/data/venues'
import { parseUrlSuffixFromHref } from '@/lib/partner-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function parseHref(href: string): { regionSlug: string; typeSlug: string; venueSlug: string } {
  const parts = (href || '').replace(/\/$/, '').split('/').filter(Boolean)
  return {
    regionSlug: parts[0] ?? 'dongtan',
    typeSlug: parts[1] ?? 'karaoke',
    venueSlug: parts[2] ?? (parseUrlSuffixFromHref(href) || 'venue'),
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'review'
}

function extractIntroText(introJson: unknown): string {
  if (!introJson || typeof introJson !== 'object') return ''
  const v = introJson as {
    content?: string
    v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } }
  }
  if (typeof v.content === 'string' && v.content.trim()) return v.content.trim()
  if (v.v2?.intro) {
    const i = v.v2.intro
    const parts = [i.lead, i.quote, ...(i.body_paragraphs ?? [])].filter(Boolean)
    return parts.join('\n\n')
  }
  return ''
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secret = url.searchParams.get('cron_secret') || authHeader?.replace(/^Bearer\s+/i, '')
  const envSecret = process.env.CRON_SECRET || process.env.CRON_GENERATE_REVIEWS_SECRET
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startAt = Date.now()
  const results: { partnerId: string; name: string; ok: boolean; msg: string }[] = []
  let healthId: string | null = null

  try {
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({ job_name: 'generate-reviews', started_at: new Date().toISOString(), ok: false })
        .select('id')
        .single()
      healthId = healthRow?.id ?? null
    } catch { /* cron_health 테이블 없으면 무시 */ }
    // 1. 활성 제휴업체 + 적용된 소개글
    const { data: partners, error: partnersErr } = await supabaseAdmin
      .from('partners')
      .select('id, name, href, region, type')
      .eq('is_active', true)

    if (partnersErr) {
      return NextResponse.json(
        { error: partnersErr.message, results },
        { status: 500 }
      )
    }

    const activePartners = partners ?? []

    for (const partner of activePartners) {
      // 적용된 소개글 조회
      const { data: intros } = await supabaseAdmin
        .from('venue_intros')
        .select('id, intro_ai_json')
        .eq('partner_id', partner.id)
        .eq('is_applied', true)
        .limit(1)

      const intro = intros?.[0]
      if (!intro) {
        results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '적용된 소개글 없음' })
        continue
      }

      const introText = extractIntroText(intro.intro_ai_json)
      if (!introText.trim()) {
        results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '소개글 내용 없음' })
        continue
      }

      const { regionSlug, typeSlug, venueSlug } = parseHref(partner.href)

      // 시나리오/톤 선택 (최근 이력 기반)
      const { data: historyRows } = await supabaseAdmin
        .from('review_posts')
        .select('scenario_used')
        .eq('region', regionSlug)
        .eq('type', typeSlug)
        .eq('venue_slug', venueSlug)
        .order('created_at', { ascending: false })
        .limit(10)

      const recentCombos: ScenarioCombo[] = (historyRows ?? [])
        .map((r) => r.scenario_used as ScenarioCombo | null)
        .filter((c): c is ScenarioCombo => c != null && typeof c === 'object')
      const recentTones: ReviewTone[] = (historyRows ?? [])
        .map((r) => (r.scenario_used as { tone?: string })?.tone)
        .filter((t): t is ReviewTone => typeof t === 'string')

      const scenario = pickScenarioCombo(recentCombos)
      const tone = pickTone(recentTones)

      const regionName = REGION_SLUG_TO_NAME[regionSlug] ?? partner.region ?? regionSlug
      const typeName = SLUG_TO_TYPE[typeSlug] ?? partner.type ?? typeSlug

      const genResult = await generateReview({
        venueName: partner.name,
        regionName,
        typeName,
        introText,
        scenario,
        tone,
      })

      if (!genResult.success) {
        results.push({
          partnerId: partner.id,
          name: partner.name,
          ok: false,
          msg: genResult.message,
        })
        continue
      }

      const reviewSlug = `${slugify(partner.name)}-${Date.now().toString(36)}`
      const insertRow = {
        region: regionSlug,
        type: typeSlug,
        venue: partner.name,
        venue_slug: venueSlug,
        slug: reviewSlug,
        title: genResult.title,
        star: 5,
        visit_date: new Date().toISOString().slice(0, 10),
        status: 'published',
        published_at: new Date().toISOString(),
        sec_overview: genResult.content,
        sec_lineup: '',
        sec_price: '',
        sec_facility: '',
        sec_summary: genResult.content.slice(0, 200),
        good_tags: [],
        bad_tags: [],
        meta_description: genResult.content.slice(0, 150),
        meta_keywords: '',
        is_ai_written: true,
        summary_rating: '5.0',
        summary_price: '',
        summary_lineup: '',
        summary_price_type: '',
        venue_page_url: partner.href?.startsWith('/') ? partner.href : `/${regionSlug}/${typeSlug}/${venueSlug}`,
        sort_order: 0,
        partner_id: partner.id,
        scenario_used: { ...scenario, tone },
      }

      const { error: insertErr } = await supabaseAdmin
        .from('review_posts')
        .insert(insertRow)

      if (insertErr) {
        results.push({
          partnerId: partner.id,
          name: partner.name,
          ok: false,
          msg: insertErr.message,
        })
      } else {
        results.push({
          partnerId: partner.id,
          name: partner.name,
          ok: true,
          msg: '리뷰 생성 완료',
        })
      }
    }

    const duration = Date.now() - startAt
    const successCount = results.filter((r) => r.ok).length
    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: true,
            msg: `완료: ${successCount}/${results.length}건`,
            processed: results.length,
            success_count: successCount,
            results,
            duration_ms: duration,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }
    return NextResponse.json({
      ok: true,
      duration_ms: duration,
      processed: results.length,
      success: successCount,
      results,
    })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    const duration = Date.now() - startAt
    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: false,
            msg: errMsg,
          processed: results.length,
          success_count: results.filter((r) => r.ok).length,
          results,
          duration_ms: duration,
        })
        .eq('id', healthId)
      } catch { /* ignore */ }
    }
    return NextResponse.json(
      { error: errMsg, results, duration_ms: duration },
      { status: 500 }
    )
  }
}
