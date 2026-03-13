-- venue_intros "적용" 플래그 추가 (최신글 적용용)
-- Supabase SQL Editor에서 실행 (배포 전 필수)

ALTER TABLE venue_intros ADD COLUMN IF NOT EXISTS is_applied BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_venue_intros_is_applied ON venue_intros(is_applied) WHERE is_applied = true;
