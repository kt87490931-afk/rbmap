/**
 * Supabase 클라이언트 (서버용)
 * API·OTP·인증 등 서버 로직에서 사용. 서비스 롤 키로 members 테이블 읽기/쓰기 가능.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.')
  }
  _client = createClient(url, key)
  return _client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
