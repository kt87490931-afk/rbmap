#!/bin/bash
# 리뷰 8시간 자동생성 Cron 래퍼
# .env.production에서 CRON_SECRET 로드 후 API 호출
#
# 스케줄 (서버 UTC 기준): 0 7,15,23 * * *  → KST 16:00, 00:00, 08:00 (8시간 간격 3회)
# 서버가 Asia/Seoul 이면: 0 0,8,16 * * *
#
LOG_DIR="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)/logs"
cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=' .env.production | xargs)
fi
mkdir -p "$LOG_DIR" 2>/dev/null
echo "[$(date -Iseconds)] cron-generate-reviews start" >> "${LOG_DIR}/cron-generate-reviews.log" 2>/dev/null || true
curl -s --max-time 120 "https://rbbmap.com/api/cron/generate-reviews?cron_secret=${CRON_SECRET}" > /dev/null 2>&1
echo "[$(date -Iseconds)] cron-generate-reviews end" >> "${LOG_DIR}/cron-generate-reviews.log" 2>/dev/null || true
