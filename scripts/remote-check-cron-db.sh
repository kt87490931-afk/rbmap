#!/bin/bash
set -euo pipefail
cd /var/www/rbmap
set -a
# shellcheck source=/dev/null
[ -f .env.production ] && . ./.env.production
set +a
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "ERROR: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi
URL="${NEXT_PUBLIC_SUPABASE_URL%/}"
KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "=== 1) cron_health (generate-reviews) 최근 6건 ==="
curl -sS "${URL}/rest/v1/cron_health?select=started_at,ended_at,ok,msg,processed,success_count,duration_ms&job_name=eq.generate-reviews&order=started_at.desc&limit=6" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Accept: application/json" | python3 -m json.tool

echo ""
echo "=== 2) 최근 1건 results 요약 (ok인 name/msg) ==="
LAST_JSON=$(curl -sS "${URL}/rest/v1/cron_health?select=started_at,ok,msg,success_count,results&job_name=eq.generate-reviews&order=started_at.desc&limit=1" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Accept: application/json")
echo "$LAST_JSON" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if not d:
    print('(없음)')
    sys.exit(0)
r = d[0]
print('started_at:', r.get('started_at'))
print('ok:', r.get('ok'))
print('msg:', (r.get('msg') or '')[:300])
print('success_count:', r.get('success_count'))
res = r.get('results') or []
if isinstance(res, list):
    ok = [x for x in res if isinstance(x, dict) and x.get('ok')]
    print('ok_entries:', len(ok))
    for x in ok[:20]:
        print('  -', x.get('name', '?'), ':', (x.get('msg') or '')[:80])
else:
    print('results:', type(res))
"

echo ""
echo "=== 3) 오늘(KST) published 리뷰 — venue별 건수 (2건 이상만) ==="
read -r START END <<< "$(python3 << 'PY'
from datetime import datetime, timedelta, timezone
kst = timezone(timedelta(hours=9))
now = datetime.now(kst)
start = datetime(now.year, now.month, now.day, tzinfo=kst)
end = start + timedelta(days=1)
print(start.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'), end.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'))
PY
)"
echo "KST 오늘 UTC 구간: $START ~ $END"
# PostgREST filter
QS="published_at=gte.${START}&published_at=lt.${END}"
BODY=$(curl -sS "${URL}/rest/v1/review_posts?select=region,type,venue_slug,partner_id,published_at&${QS}&order=published_at.desc" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Accept: application/json")
echo "$BODY" | python3 -c "
import json, sys
from collections import Counter
raw = sys.stdin.read()
if not raw.strip():
    print('(본문 없음)')
    sys.exit(0)
data = json.loads(raw)
if not isinstance(data, list):
    print(data)
    sys.exit(0)
key = lambda r: (r.get('region'), r.get('type'), r.get('venue_slug'))
c = Counter(key(r) for r in data)
dups = [(k, n) for k, n in c.items() if n >= 2]
dups.sort(key=lambda x: -x[1])
print('오늘 총 리뷰 건수:', len(data))
print('동일 업소(region+type+venue_slug) 2건 이상:', len(dups))
for k, n in dups[:40]:
    print(f'  {n}건  {k}')
"
