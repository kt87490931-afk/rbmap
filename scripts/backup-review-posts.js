/**
 * review_posts(및 legacy reviews) 전체 백업
 * 실행: node scripts/backup-review-posts.js
 * 출력: backups/rbmap-reviews-backup-YYYYMMDD-HHMMSS.json
 */
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const envProdPath = path.join(__dirname, '..', '.env.production')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  fs.readFileSync(filePath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

loadEnvFile(envPath)
loadEnvFile(envProdPath)

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local)')
  process.exit(1)
}

const supabase = createClient(url, key)
const PAGE = 500

async function fetchAll(table, orderCol = 'created_at') {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderCol, { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return rows
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

async function main() {
  console.log('리뷰 백업 시작...')
  const reviewPosts = await fetchAll('review_posts')
  console.log(`  review_posts: ${reviewPosts.length}건`)

  let legacyReviews = []
  try {
    legacyReviews = await fetchAll('reviews')
    console.log(`  reviews(legacy): ${legacyReviews.length}건`)
  } catch (e) {
    console.warn(`  reviews(legacy) 스킵: ${e.message}`)
  }

  const published = reviewPosts.filter((r) => r.status === 'published').length
  const draft = reviewPosts.filter((r) => r.status === 'draft').length

  const payload = {
    exported_at: new Date().toISOString(),
    source: 'rbbmap.com (룸빵여지도)',
    supabase_url: url,
    counts: {
      review_posts_total: reviewPosts.length,
      review_posts_published: published,
      review_posts_draft: draft,
      reviews_legacy: legacyReviews.length,
    },
    review_posts: reviewPosts,
    reviews_legacy: legacyReviews,
  }

  const outDir = path.join(__dirname, '..', 'backups')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `rbmap-reviews-backup-${stamp()}.json`)
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf-8')

  const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2)
  console.log(`\n백업 완료: ${outFile}`)
  console.log(`  파일 크기: ${sizeMb} MB`)
  console.log(`  게시됨 ${published} / 임시저장 ${draft} / legacy ${legacyReviews.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
