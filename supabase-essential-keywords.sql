-- 필수단어(업체소개글 AI 생성 시 반드시 포함) 테이블
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS essential_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_essential_keywords_sort ON essential_keywords(sort_order);
ALTER TABLE essential_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "essential_keywords_service" ON essential_keywords;
CREATE POLICY "essential_keywords_service" ON essential_keywords FOR ALL USING (auth.role() = 'service_role');

-- 초기 데이터 (룸빵여지도 필수 키워드)
INSERT INTO essential_keywords (keyword, sort_order) VALUES
  ('가라오케', 1),
  ('룸싸롱', 2),
  ('퍼블릭', 3),
  ('노래방', 4)
ON CONFLICT (keyword) DO NOTHING;
