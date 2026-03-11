-- 리뷰 포스트 테이블 (후기 작성/읽기/목록 페이지용)
-- 기존 reviews 테이블과 별도. 상세 후기 아티클 저장
-- Supabase SQL Editor에서 실행

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

CREATE INDEX IF NOT EXISTS idx_review_posts_status ON review_posts(status);
CREATE INDEX IF NOT EXISTS idx_review_posts_region_type ON review_posts(region, "type");
CREATE INDEX IF NOT EXISTS idx_review_posts_published ON review_posts(published_at DESC) WHERE status = 'published';

ALTER TABLE review_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_posts_anon_read_published" ON review_posts
  FOR SELECT USING (status = 'published');
-- service_role로 INSERT/UPDATE/DELETE (어드민 API 사용)
