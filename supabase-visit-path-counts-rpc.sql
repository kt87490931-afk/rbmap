-- visit_logs path별 전체 누적 방문수 조회 RPC
-- 인기순 정렬 등에 사용 (Supabase SQL Editor에서 실행)

CREATE OR REPLACE FUNCTION get_visit_log_path_counts()
RETURNS TABLE(path_key text, cnt bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    path_key,
    count(*)::bigint AS cnt
  FROM (
    SELECT trim(both '/' from coalesce(path, '')) AS path_key
    FROM visit_logs
    WHERE path IS NOT NULL AND trim(both '/' from coalesce(path, '')) != ''
  ) t
  GROUP BY path_key;
$$;

-- service_role에서 호출 (supabaseAdmin)
GRANT EXECUTE ON FUNCTION get_visit_log_path_counts() TO service_role;

SELECT 'get_visit_log_path_counts RPC 준비 완료' AS result;
