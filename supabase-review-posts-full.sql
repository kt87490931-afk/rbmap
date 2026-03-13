-- review_posts 테이블 전체 (테이블 없으면 생성 + scenario/partner 컬럼)
-- Supabase SQL Editor에서 실행
-- 실행 순서: supabase-sections.sql → supabase-partners-period-active.sql → (이 파일)

-- 1. 테이블 생성 (없을 경우)
CREATE TABLE IF NOT EXISTS review_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  "type" TEXT NOT NULL,
  venue TEXT NOT NULL,
  venue_slug TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  star INTEGER NOT NULL CHECK (star >= 1 AND star <= 5),
  visit_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  sec_overview TEXT DEFAULT '',
  sec_lineup TEXT DEFAULT '',
  sec_price TEXT DEFAULT '',
  sec_facility TEXT DEFAULT '',
  sec_summary TEXT DEFAULT '',
  good_tags JSONB DEFAULT '[]',
  bad_tags JSONB DEFAULT '[]',
  meta_description TEXT DEFAULT '',
  meta_keywords TEXT DEFAULT '',
  is_ai_written BOOLEAN DEFAULT false,
  summary_rating TEXT DEFAULT '',
  summary_price TEXT DEFAULT '',
  summary_lineup TEXT DEFAULT '',
  summary_price_type TEXT DEFAULT '',
  venue_page_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_review_posts_status ON review_posts(status);
CREATE INDEX IF NOT EXISTS idx_review_posts_region_type ON review_posts(region, "type");
CREATE INDEX IF NOT EXISTS idx_review_posts_published ON review_posts(published_at DESC) WHERE status = 'published';

-- 3. RLS
ALTER TABLE review_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_posts_anon_read_published" ON review_posts;
CREATE POLICY "review_posts_anon_read_published" ON review_posts
  FOR SELECT USING (status = 'published');

-- 4. 시나리오·파트너 컬럼 추가
ALTER TABLE review_posts ADD COLUMN IF NOT EXISTS scenario_used JSONB DEFAULT '{}';
ALTER TABLE review_posts ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN review_posts.scenario_used IS '생성 시 사용된 시나리오 조합 (people, time, why, event 등)';
COMMENT ON COLUMN review_posts.partner_id IS '제휴업체 FK (AI 리뷰 생성 시)';
