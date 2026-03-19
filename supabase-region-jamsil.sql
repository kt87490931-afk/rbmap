-- 잠실 지역 추가
-- Supabase SQL Editor에서 실행
-- 지역 관리(Admin)에서 추가해도 동일하게 동작함 (DB 기반)

INSERT INTO regions (slug, name, short, thumb_class, tags, venues, reviews, badge, coming, sort_order, map_x, map_y) VALUES
  ('jamsil', '잠실', 'JS', 'default', ARRAY['룸싸롱','노래방','가라오케'], 0, 0, NULL, false, 7, 208, 125)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short = EXCLUDED.short,
  thumb_class = EXCLUDED.thumb_class,
  tags = EXCLUDED.tags,
  coming = EXCLUDED.coming,
  map_x = EXCLUDED.map_x,
  map_y = EXCLUDED.map_y,
  updated_at = now();
