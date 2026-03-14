-- 문의 버튼을 텔레그램 링크로 변경 (Supabase SQL Editor에서 실행)
-- header 섹션의 nav에서 문의/광고문의 항목 href를 https://t.me/rbbmap 로 업데이트

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
  )
)
WHERE section_key = 'header'
  AND content ? 'nav';
