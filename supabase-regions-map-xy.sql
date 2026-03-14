-- regions 테이블에 지도 좌표 컬럼 추가 (히어로 한국 네트워크 지도용)
-- SVG viewBox(0 0 340 460) 기준 map_x, map_y
-- Supabase SQL Editor에서 실행

ALTER TABLE regions
  ADD COLUMN IF NOT EXISTS map_x INTEGER,
  ADD COLUMN IF NOT EXISTS map_y INTEGER;

-- 기존 지역 초기 좌표 (index-sample_2 기준)
UPDATE regions SET map_x = 192, map_y = 118 WHERE slug = 'gangnam';
UPDATE regions SET map_x = 148, map_y = 162 WHERE slug = 'suwon';
UPDATE regions SET map_x = 162, map_y = 200 WHERE slug = 'dongtan';
UPDATE regions SET map_x = 152, map_y = 420 WHERE slug = 'jeju';
UPDATE regions SET map_x = 112, map_y = 108 WHERE slug = 'incheon';
UPDATE regions SET map_x = 248, map_y = 280 WHERE slug = 'busan';
