-- 업소 상세 페이지 편집 데이터 저장 (편집 모달 저장용)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS venue_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_slug TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  venue_slug TEXT NOT NULL,
  edits_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(region_slug, category_slug, venue_slug)
);

CREATE INDEX IF NOT EXISTS idx_venue_edits_lookup ON venue_edits(region_slug, category_slug, venue_slug);

ALTER TABLE venue_edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue_edits_service" ON venue_edits
  FOR ALL USING (auth.role() = 'service_role');
