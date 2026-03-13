-- ============================================================
-- Supabase SQL Editor에서 전체 복사 후 실행
-- partners, review_posts 테이블이 있어야 함 (supabase-sections.sql 선행)
-- ============================================================

-- === 1. partners 기간·활성화 ===
ALTER TABLE partners ADD COLUMN IF NOT EXISTS period_days INTEGER DEFAULT 30;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partners_period_end ON partners(period_end);

-- === 2. review_posts 테이블 (없으면 생성) ===
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
DROP POLICY IF EXISTS "review_posts_anon_read_published" ON review_posts;
CREATE POLICY "review_posts_anon_read_published" ON review_posts FOR SELECT USING (status = 'published');

-- === 3. review_posts 시나리오·파트너 컬럼 ===
ALTER TABLE review_posts ADD COLUMN IF NOT EXISTS scenario_used JSONB DEFAULT '{}';
ALTER TABLE review_posts ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- === 4. cron_health (크론헬스 페이지용) ===
CREATE TABLE IF NOT EXISTS cron_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL DEFAULT 'generate-reviews',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ok BOOLEAN NOT NULL DEFAULT false,
  msg TEXT,
  processed INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cron_health_job_started ON cron_health(job_name, started_at DESC);
