-- partners 테이블에 기간·활성화 컬럼 추가
-- Supabase SQL Editor에서 실행 (배포 전 필수)

ALTER TABLE partners ADD COLUMN IF NOT EXISTS period_days INTEGER DEFAULT 30;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMENT ON COLUMN partners.period_days IS '제휴 기간 (30/60/90일)';
COMMENT ON COLUMN partners.period_end IS '제휴 만료일 (이후 연락처 비공개)';
COMMENT ON COLUMN partners.is_active IS '활성화 여부 (비활성 시 리뷰 생성 제외)';

CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partners_period_end ON partners(period_end);
