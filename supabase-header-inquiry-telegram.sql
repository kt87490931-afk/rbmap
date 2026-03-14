-- header 네비게이션 업데이트 (Supabase SQL Editor에서 실행)
-- 1. 문의 href → https://t.me/rbbmap
-- 2. 가이드 메뉴 제거

UPDATE site_sections
SET content = jsonb_set(
  content,
  '{nav}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'href' = '/contact' OR elem->>'label' IN ('문의', '광고문의')
        THEN jsonb_set(elem, '{href}', '"https://t.me/rbbmap"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(content->'nav') AS elem
    WHERE elem->>'label' != '가이드'
  )
)
WHERE section_key = 'header'
  AND content ? 'nav';
