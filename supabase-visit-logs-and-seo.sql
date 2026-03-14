-- visit_logs 테이블 생성 (Supabase SQL Editor에서 실행)
-- 접속자 로그 및 위험 감지용

CREATE TABLE IF NOT EXISTS visit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT,
  user_agent TEXT,
  path TEXT DEFAULT '/',
  visitor_type TEXT DEFAULT 'visitor',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at ON visit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_logs_visitor_type ON visit_logs (visitor_type);
CREATE INDEX IF NOT EXISTS idx_visit_logs_ip ON visit_logs (ip);

ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visit_logs_insert_anon" ON visit_logs;
CREATE POLICY "visit_logs_insert_anon" ON visit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "visit_logs_select_service" ON visit_logs;
CREATE POLICY "visit_logs_select_service" ON visit_logs
  FOR SELECT TO service_role
  USING (true);

-- site_sections에 seo 섹션 초기 데이터 (없으면 삽입)
INSERT INTO site_sections (section_key, content) VALUES
('seo', '{
  "title": "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보",
  "description": "강남, 수원 인계동, 동탄, 제주 등 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보. 지역별 업소 평점, 가격, 리뷰를 한눈에 비교하세요.",
  "ogImage": "https://rbbmap.com/og-image.png",
  "siteUrl": "https://rbbmap.com",
  "googleVerify": "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY"
}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

SELECT 'visit_logs 및 seo 준비 완료' AS result;
