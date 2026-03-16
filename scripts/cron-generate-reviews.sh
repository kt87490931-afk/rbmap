#!/bin/bash
# 리뷰 자동생성 Cron 래퍼 (DigitalOcean rbmap 서버용)
# .env.production에서 CRON_SECRET 또는 CRON_GENERATE_REVIEWS_SECRET 로드 후 API 호출
#
# 스케줄: 20분마다 (0,20,40 * * * *) → 업체별 다음 가능 시각에 맞춰 처리
# 설정: scripts/setup-cron-rbmap.sh 또는 deploy.sh 실행
#
LOG_DIR="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)/logs"
cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=|^CRON_GENERATE_REVIEWS_SECRET=' .env.production 2>/dev/null | xargs) 2>/dev/null || true
fi
SECRET="${CRON_SECRET:-$CRON_GENERATE_REVIEWS_SECRET}"
mkdir -p "$LOG_DIR" 2>/dev/null
LOG_FILE="${LOG_DIR}/cron-generate-reviews.log"
TS="$(date -Iseconds)"

echo "[$TS] cron-generate-reviews start" >> "$LOG_FILE" 2>/dev/null || true
if [ -z "$SECRET" ]; then
  echo "[$TS] ERROR: CRON_SECRET/CRON_GENERATE_REVIEWS_SECRET not set in .env.production" >> "$LOG_FILE" 2>/dev/null || true
  exit 1
fi
RESP=$(curl -s -w "\n%{http_code}" --max-time 120 "https://rbbmap.com/api/cron/generate-reviews?cron_secret=${SECRET}" 2>/dev/null) || true
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "[$TS] cron-generate-reviews end http=$HTTP_CODE" >> "$LOG_FILE" 2>/dev/null || true
if [ "$HTTP_CODE" != "200" ]; then
  echo "[$TS] response: ${BODY:0:200}" >> "$LOG_FILE" 2>/dev/null || true
fi
