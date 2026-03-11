-- rbmap members 테이블 (NextAuth + OTP용)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '사용자',
  picture TEXT DEFAULT '',
  google_id TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  otp_secret TEXT,
  otp_fail_count INTEGER DEFAULT 0,
  otp_locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책: 서버(service_role)만 접근, anon은 불가
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 서비스 롤은 RLS 우회 가능 (기본 동작)
-- anon 사용자 차단
CREATE POLICY "members_service_only" ON members
  FOR ALL
  USING (auth.role() = 'service_role');

-- 관리자로 지정하려면 members 테이블에서 해당 이메일의 role을 'admin'으로 업데이트
-- 예: UPDATE members SET role = 'admin' WHERE email = 'your-admin@gmail.com';
