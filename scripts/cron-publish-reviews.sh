#!/bin/bash
# 리뷰 일일 자동 공개 Cron (매일 00:00 KST, draft 중 랜덤 5건 published)
# crontab: 0 0 * * * /var/www/rbmap/scripts/cron-publish-reviews.sh

cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
LOG_DIR="${PWD}/logs"
LOG_FILE="${LOG_DIR}/cron-publish-reviews.log"
TS=$(date '+%Y-%m-%d %H:%M:%S')
mkdir -p "$LOG_DIR"

if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=' .env.production | xargs)
fi

echo "[$TS] cron-publish-reviews start" >> "$LOG_FILE" 2>/dev/null || true
RESP=$(curl -s -w "\n%{http_code}" --max-time 120 "https://rbbmap.com/api/cron/publish-reviews?cron_secret=${CRON_SECRET}" 2>/dev/null) || true
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "[$TS] cron-publish-reviews end http=$HTTP_CODE body=$BODY" >> "$LOG_FILE" 2>/dev/null || true
