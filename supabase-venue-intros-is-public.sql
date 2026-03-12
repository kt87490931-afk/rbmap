-- venue_intros 공개/비공개 컬럼 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE venue_intros ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_venue_intros_is_public ON venue_intros(is_public);
