-- visit_logs에 유입 경로(referrer) 컬럼 추가
-- 접속지 로그에서 "어떤 검색어로 들어왔는지" 표시용 (referrer URL에서 검색어 파싱)

ALTER TABLE visit_logs ADD COLUMN IF NOT EXISTS referrer TEXT;

SELECT 'visit_logs.referrer 컬럼 추가 완료' AS result;
