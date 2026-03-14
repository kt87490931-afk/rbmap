-- SEO 메타태그 업데이트 (Supabase SQL Editor에서 실행)
-- 필수 키워드: 룸싸롱, 가라오케, 셔츠룸, 쩜오, 퍼블릭, 노래방, 유흥

INSERT INTO site_sections (section_key, content) VALUES
('seo', '{
  "title": "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보",
  "description": "믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 전국 380개 이상의 검증된 업소와 3,200건이 넘는 실제 이용 후기가 당신의 선택을 돕습니다. 6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.",
  "ogImage": "https://rbbmap.com/og-image.png",
  "siteUrl": "https://rbbmap.com",
  "googleVerify": "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY"
}'::jsonb)
ON CONFLICT (section_key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now();

SELECT 'SEO 메타태그 업데이트 완료' AS result;
