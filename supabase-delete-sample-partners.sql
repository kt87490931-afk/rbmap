-- 샘플 제휴업체 삭제 (Supabase SQL Editor에서 실행)
-- https://supabase.com/dashboard → 프로젝트 → SQL Editor → 새 쿼리 → 붙여넣기 → Run

-- 1) 플레이스홀더 연락처인 업체 삭제
DELETE FROM partners
WHERE contact ~ '0[0-9]{1,2}[.\s-]*000[.\s-]*[0-9]{4}'
   OR contact = '02-000-0000'
   OR contact LIKE '%000-0000%'
   OR contact ~ '0[0-9]{1,2}[-]?000[-]?[0-9]{4}';

-- 2) 알려진 샘플 업체명 삭제
DELETE FROM partners
WHERE name IN (
  '비너스 셔츠룸', '비너스', '오로라 가라오케', '오로라',
  '달토 가라오케', '퍼펙트 가라오케', '인트로 하이퍼블릭', '구구단 쩜오',
  '다이아몬드 하이퍼블릭', '스카이라운지 퍼블릭', '아우라 가라오케',
  '마징가 가라오케', '메칸더 셔츠룸', '스타 퍼블릭', '제니스 클럽', '오션뷰 가라오케'
);
