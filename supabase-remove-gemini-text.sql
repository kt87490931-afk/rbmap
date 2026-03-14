-- site_sections에 저장된 "Gemini AI" 텍스트를 "AI"로 치환
-- Supabase SQL Editor에서 실행 (DB에 Gemini가 있는 경우)

UPDATE site_sections
SET content = replace(content::text, 'Gemini AI', 'AI')::jsonb
WHERE content::text LIKE '%Gemini AI%';

SELECT 'Gemini 텍스트 제거 완료' AS result;
