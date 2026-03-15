-- 제휴업체별 리뷰 생성 스케줄 프리셋
-- 6h_4: 6시간 간격 하루 4개, 8h_3: 8시간 간격 하루 3개, 12h_2: 12시간 간격 하루 2개, 24h_1: 24시간 간격 하루 1개
ALTER TABLE partners ADD COLUMN IF NOT EXISTS review_schedule_preset TEXT DEFAULT '8h_3';
COMMENT ON COLUMN partners.review_schedule_preset IS '리뷰 자동생성 스케줄: 6h_4, 8h_3, 12h_2, 24h_1';
