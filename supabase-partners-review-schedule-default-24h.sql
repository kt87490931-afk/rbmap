-- 활성 제휴업체 리뷰 스케줄을 모두 24시간 간격·하루 1개(24h_1)로 통일
-- Supabase SQL Editor에서 한 번 실행

UPDATE partners
SET review_schedule_preset = '24h_1'
WHERE is_active = true;
