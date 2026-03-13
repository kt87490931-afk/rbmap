-- review_posts에 시나리오 이력 저장 (중복 조합 방지용)
-- Supabase SQL Editor에서 실행

ALTER TABLE review_posts ADD COLUMN IF NOT EXISTS scenario_used JSONB DEFAULT '{}';
ALTER TABLE review_posts ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN review_posts.scenario_used IS '생성 시 사용된 시나리오 조합 (people, time, why, event 등)';
COMMENT ON COLUMN review_posts.partner_id IS '제휴업체 FK (AI 리뷰 생성 시)';
