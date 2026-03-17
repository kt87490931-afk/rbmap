import { supabaseAdmin } from '@/lib/supabase-server'

type CloudflareEvent = {
  datetime?: string
  action?: string
  service?: string
  clientIP?: string
  ip?: string
  userAgent?: string
  clientRequestUserAgent?: string
  user_agent?: string
  clientRequestPath?: string
  path?: string
  country?: string
  rayName?: string
  ray_id?: string
}

type CloudflareEventsResponse = {
  success?: boolean
  errors?: Array<{ message?: string }>
  result?: CloudflareEvent[]
  result_info?: {
    count?: number
    page?: number
    per_page?: number
    total_pages?: number
  }
}

type SyncResult = {
  fetched: number
  botEvents: number
  inserted: number
  skippedDuplicates: number
  pages: number
  cursorSince: string
  cursorUntil: string
  sampleBots: Array<{ ip: string; path: string; ua: string; action: string; service: string }>
}

const CLOUDFLARE_JOB_NAME = 'cloudflare-bot-sync'
const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|googlebot|bingbot|yandex|duckduckbot|baidu|facebookexternalhit|facebot|twitterbot|kakaotalk|oai-searchbot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider/i

function getCloudflareConfig() {
  const token = (process.env.CLOUDFLARE_API_TOKEN || '').trim()
  const zoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim()
  if (!token || !zoneId) {
    throw new Error('CLOUDFLARE_API_TOKEN 또는 CLOUDFLARE_ZONE_ID가 없습니다.')
  }
  return { token, zoneId }
}

function toISO(s: string | undefined): string | null {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function normalizePath(p: string | undefined): string {
  const raw = (p || '/').trim() || '/'
  return raw.length > 500 ? raw.slice(0, 500) : raw
}

function normalizeUA(ua: string | undefined): string {
  const raw = (ua || '').trim()
  return raw.length > 500 ? raw.slice(0, 500) : raw
}

function normalizeIP(ip: string | undefined): string {
  const raw = (ip || 'unknown').trim()
  return raw.length > 120 ? raw.slice(0, 120) : raw
}

function isLikelyBot(e: CloudflareEvent): boolean {
  const ua = (e.userAgent || e.clientRequestUserAgent || e.user_agent || '').toLowerCase()
  const service = (e.service || '').toLowerCase()
  const action = (e.action || '').toLowerCase()
  if (BOT_UA_PATTERN.test(ua)) return true
  if (service.includes('bot')) return true
  if (action.includes('challenge') && service.includes('fight')) return true
  return false
}

async function getCursorSinceISO(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('cron_health')
    .select('ended_at')
    .eq('job_name', CLOUDFLARE_JOB_NAME)
    .eq('ok', true)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(1)
  const latest = data?.[0]?.ended_at
  if (!latest) {
    return new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
  // 5분 오버랩으로 누락 방지
  return new Date(new Date(latest).getTime() - 5 * 60 * 1000).toISOString()
}

async function fetchCloudflareEvents(
  token: string,
  zoneId: string,
  sinceISO: string,
  untilISO: string,
  page: number,
  perPage = 100
): Promise<CloudflareEventsResponse> {
  const qs = new URLSearchParams({
    since: sinceISO,
    until: untilISO,
    page: String(page),
    per_page: String(perPage),
    direction: 'desc',
  })
  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/security/events?${qs.toString()}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as CloudflareEventsResponse
  if (!res.ok || json.success === false) {
    const msg = json?.errors?.map((e) => e.message).filter(Boolean).join(', ') || `HTTP ${res.status}`
    throw new Error(`Cloudflare 이벤트 조회 실패: ${msg}`)
  }
  return json
}

export async function syncCloudflareBotEvents(): Promise<SyncResult> {
  const { token, zoneId } = getCloudflareConfig()
  const cursorSince = await getCursorSinceISO()
  const cursorUntil = new Date().toISOString()

  const allEvents: CloudflareEvent[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages && page <= 10) {
    const res = await fetchCloudflareEvents(token, zoneId, cursorSince, cursorUntil, page)
    const events = res.result ?? []
    allEvents.push(...events)
    totalPages = res.result_info?.total_pages ?? 1
    page += 1
  }

  const botEvents = allEvents.filter(isLikelyBot)
  if (botEvents.length === 0) {
    return {
      fetched: allEvents.length,
      botEvents: 0,
      inserted: 0,
      skippedDuplicates: 0,
      pages: Math.min(totalPages, 10),
      cursorSince,
      cursorUntil,
      sampleBots: [],
    }
  }

  const prepared = botEvents
    .map((e) => {
      const createdAt =
        toISO(e.datetime) ||
        new Date().toISOString()
      const ip = normalizeIP(e.clientIP || e.ip)
      const ua = normalizeUA(e.userAgent || e.clientRequestUserAgent || e.user_agent)
      const path = normalizePath(e.clientRequestPath || e.path)
      const action = (e.action || '-').toLowerCase().slice(0, 50)
      const service = (e.service || '-').toLowerCase().slice(0, 80)
      const country = (e.country || '-').slice(0, 8)
      const ray = (e.rayName || e.ray_id || '-').slice(0, 64)
      const ref = `cf_event:action=${action};service=${service};country=${country};ray=${ray}`.slice(0, 2000)
      const dedupeKey = `${createdAt}|${ip}|${path}|${ua}|${ref}`
      return {
        created_at: createdAt,
        ip,
        user_agent: ua,
        path,
        visitor_type: 'bot',
        referrer: ref,
        dedupeKey,
        action,
        service,
      }
    })
    .filter((r) => r.user_agent || r.path)

  const minCreated = prepared.reduce((m, r) => (r.created_at < m ? r.created_at : m), prepared[0]?.created_at || cursorSince)
  const maxCreated = prepared.reduce((m, r) => (r.created_at > m ? r.created_at : m), prepared[0]?.created_at || cursorUntil)

  const { data: existingRows } = await supabaseAdmin
    .from('visit_logs')
    .select('created_at, ip, path, user_agent, referrer')
    .eq('visitor_type', 'bot')
    .gte('created_at', minCreated)
    .lte('created_at', maxCreated)
    .ilike('referrer', 'cf_event:%')

  const existing = new Set(
    (existingRows ?? []).map((r) => {
      const createdAt = toISO(r.created_at as string | undefined) || ''
      const ip = normalizeIP(r.ip as string | undefined)
      const path = normalizePath(r.path as string | undefined)
      const ua = normalizeUA(r.user_agent as string | undefined)
      const ref = ((r.referrer as string | undefined) || '').slice(0, 2000)
      return `${createdAt}|${ip}|${path}|${ua}|${ref}`
    })
  )

  const rowsToInsert = prepared
    .filter((r) => !existing.has(r.dedupeKey))
    .map(({ dedupeKey, action, service, ...row }) => row)

  if (rowsToInsert.length > 0) {
    const { error } = await supabaseAdmin.from('visit_logs').insert(rowsToInsert)
    if (error) {
      throw new Error(`visit_logs 저장 실패: ${error.message}`)
    }
  }

  const sampleBots = prepared.slice(0, 5).map((r) => ({
    ip: r.ip,
    path: r.path,
    ua: r.user_agent.slice(0, 120),
    action: r.action,
    service: r.service,
  }))

  return {
    fetched: allEvents.length,
    botEvents: prepared.length,
    inserted: rowsToInsert.length,
    skippedDuplicates: prepared.length - rowsToInsert.length,
    pages: Math.min(totalPages, 10),
    cursorSince,
    cursorUntil,
    sampleBots,
  }
}

