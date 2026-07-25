#!/bin/bash
# 리뷰 일일 자동 공개 Cron (매일 00:00 KST, draft 중 랜덤 5건 published)
# crontab: 0 0 * * * /var/www/rbmap/scripts/cron-publish-reviews.sh

LOG_DIR="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)/logs"
cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=|^CRON_PUBLISH_REVIEWS_SECRET=' .env.production 2>/dev/null | xargs) 2>/dev/null || true
fi
SECRET="${CRON_SECRET:-$CRON_PUBLISH_REVIEWS_SECRET}"
mkdir -p "$LOG_DIR" 2>/dev/null
LOG_FILE="${LOG_DIR}/cron-publish-reviews.log"
TS=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TS] cron-publish-reviews start" >> "$LOG_FILE" 2>/dev/null || true
if [ -z "$SECRET" ]; then
  echo "[$TS] ERROR: CRON_SECRET/CRON_PUBLISH_REVIEWS_SECRET not set in .env.production" >> "$LOG_FILE" 2>/dev/null || true
  exit 1
fi
RESP=$(curl -s -w "\n%{http_code}" --max-time 120 "https://rbbmap.com/api/cron/publish-reviews?cron_secret=${SECRET}" 2>/dev/null) || true
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "[$TS] cron-publish-reviews end http=$HTTP_CODE body=$BODY" >> "$LOG_FILE" 2>/dev/null || true
if [ "$HTTP_CODE" != "200" ]; then
  echo "[$TS] response: ${BODY:0:200}" >> "$LOG_FILE" 2>/dev/null || true
  exit 1
fi
