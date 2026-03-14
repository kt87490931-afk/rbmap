-- SEO 메타태그 업데이트 (Supabase SQL Editor에서 실행)
-- 필수 키워드: 룸싸롱, 가라오케, 셔츠룸, 쩜오, 퍼블릭, 노래방, 유흥

INSERT INTO site_sections (section_key, content) VALUES
('seo', '{
  "title": "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보",
  "description": "강남, 수원 인계동, 동탄, 제주 등 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보. 지역별 업소 평점, 가격, 리뷰를 한눈에 비교하세요.",
  "ogImage": "https://rbbmap.com/og-image.png",
  "siteUrl": "https://rbbmap.com",
  "googleVerify": "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY"
}'::jsonb)
ON CONFLICT (section_key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now();

SELECT 'SEO 메타태그 업데이트 완료' AS result;
