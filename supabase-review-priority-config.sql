-- 리뷰 주제/말투 우선순위 설정 (site_sections)
-- Supabase SQL Editor에서 실행. 첫 적용 시 자동 생성되지만, 수동으로 미리 넣어둘 때 사용.

INSERT INTO site_sections (section_key, content)
VALUES (
  'review_priority_config',
  '{"topic_1":"","topic_2":"","tone_1":"","tone_2":""}'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
