/**
 * members 테이블에서 지정 이메일을 admin으로 설정
 * 실행: node scripts/set-admin.js
 */
const fs = require('fs')
const path = require('path')

// .env.local 로드
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요')
  process.exit(1)
}

const email = process.argv[2] || 'rankingmarket88@gmail.com'
const supabase = createClient(url, key)

async function main() {
  const { data, error } = await supabase
    .from('members')
    .upsert(
      { email, role: 'admin', display_name: 'Admin', updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    .select('id, email, role')

  if (error) {
    console.error('실패:', error.message)
    process.exit(1)
  }
  console.log('admin 설정 완료:', data)
}

main()
