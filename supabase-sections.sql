-- rbmap 섹션 테이블 (지역, 제휴업체, Live Feed, 리뷰)
-- Supabase SQL Editor에서 실행 (members 테이블 생성 후)

-- 1. regions
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short TEXT NOT NULL,
  thumb_class TEXT NOT NULL DEFAULT 'default',
  tags TEXT[] DEFAULT '{}',
  venues INTEGER DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  badge TEXT CHECK (badge IN ('HOT', 'NEW') OR badge IS NULL),
  coming BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. partners
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  href TEXT NOT NULL,
  icon TEXT DEFAULT '🎤',
  region TEXT NOT NULL,
  type TEXT NOT NULL,
  type_class TEXT DEFAULT '',
  type_style JSONB DEFAULT '{}',
  name TEXT NOT NULL,
  stars TEXT DEFAULT '★★★★★',
  contact TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  location TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  char_count TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. feed_items (Live Feed)
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  href TEXT NOT NULL,
  pill TEXT NOT NULL,
  pill_class TEXT NOT NULL DEFAULT 'p-default',
  title TEXT NOT NULL,
  sub TEXT DEFAULT '',
  stars TEXT DEFAULT '★★★★☆',
  time TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  href TEXT NOT NULL,
  region TEXT NOT NULL,
  date TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  stars TEXT DEFAULT '★★★★☆',
  venue TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: anon 읽기 허용 (공개 컨텐츠)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions_anon_read" ON regions FOR SELECT USING (true);
CREATE POLICY "partners_anon_read" ON partners FOR SELECT USING (true);
CREATE POLICY "feed_items_anon_read" ON feed_items FOR SELECT USING (true);
CREATE POLICY "reviews_anon_read" ON reviews FOR SELECT USING (true);

-- service_role은 RLS 우회로 모든 작업 가능
-- anon은 SELECT만 가능 (INSERT/UPDATE/DELETE 불가)

-- 초기 데이터 (선택)
INSERT INTO regions (slug, name, short, thumb_class, tags, venues, reviews, badge, coming, sort_order) VALUES
  ('gangnam', '강남', 'GN', 'gangnam', ARRAY['가라오케','하이퍼블릭','쩜오'], 82, 641, 'HOT', false, 1),
  ('suwon', '수원', 'SW', 'suwon', ARRAY['인계동','셔츠룸','퍼블릭'], 61, 512, NULL, false, 2),
  ('dongtan', '동탄', 'DT', 'dongtan', ARRAY['가라오케','퍼블릭'], 34, 218, 'NEW', false, 3),
  ('jeju', '제주', 'JJ', 'jeju', ARRAY['가라오케','바'], 28, 173, NULL, false, 4),
  ('incheon', '인천', 'IC', 'incheon', ARRAY['준비중'], 0, 0, NULL, true, 5),
  ('busan', '부산', 'BS', 'busan', ARRAY['준비중'], 0, 0, NULL, true, 6)
ON CONFLICT (slug) DO NOTHING;

-- feed_items, partners, reviews는 어드민에서 추가하거나 Supabase 대시보드에서 INSERT
