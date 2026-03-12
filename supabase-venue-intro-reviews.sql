-- Phase 1: 업체 리뷰 스키마 (venue_reviews 신규)
-- Supabase SQL Editor에서 실행
-- 실행 순서: supabase-sections.sql → supabase-venue-intros.sql → 본 파일

-- 업체(partner)별 AI 생성 리뷰 7종 톤 저장
-- 7종 손님 톤 리뷰 저장 (Gemini API로 생성)
-- tone: friendly, honest, pro, casual, detail, short, emotional 등

CREATE TABLE IF NOT EXISTS venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  venue_intro_id UUID REFERENCES venue_intros(id) ON DELETE SET NULL,
  tone TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  char_count TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, tone)
);

CREATE INDEX IF NOT EXISTS idx_venue_reviews_partner ON venue_reviews(partner_id);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_tone ON venue_reviews(tone);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_status ON venue_reviews(status);

ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue_reviews_service" ON venue_reviews
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "venue_reviews_anon_read_published" ON venue_reviews
  FOR SELECT USING (status = 'published');
