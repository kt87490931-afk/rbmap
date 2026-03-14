-- 차단 IP 테이블 (Supabase SQL Editor에서 실행)
-- 어드민에서 "차단" 버튼 클릭 시 저장, 미들웨어에서 조회

CREATE TABLE IF NOT EXISTS blocked_ips (
  ip TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT
);

ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- anon/인증 사용자는 조회 불가. service_role만 사용 (API에서 supabaseAdmin)
DROP POLICY IF EXISTS "blocked_ips_service_only" ON blocked_ips;
CREATE POLICY "blocked_ips_service_only" ON blocked_ips
  FOR ALL USING (false);
