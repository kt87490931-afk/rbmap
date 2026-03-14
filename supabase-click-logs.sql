-- click_logs 테이블 (전화 버튼 등 클릭 트래킹)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS click_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'call',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_click_logs_created_at ON click_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_logs_path ON click_logs (path);
CREATE INDEX IF NOT EXISTS idx_click_logs_event ON click_logs (event_type);

ALTER TABLE click_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "click_logs_insert_anon" ON click_logs;
CREATE POLICY "click_logs_insert_anon" ON click_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "click_logs_select_service" ON click_logs;
CREATE POLICY "click_logs_select_service" ON click_logs
  FOR SELECT TO service_role
  USING (true);

SELECT 'click_logs 준비 완료' AS result;
