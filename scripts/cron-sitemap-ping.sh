#!/bin/bash
# 구글 사이트맵 Ping Cron 래퍼 (매일 06시 KST = UTC 21:00)
# .env.production에서 CRON_SECRET 로드 후 API 호출
# crontab: 0 21 * * * /var/www/rbmap/scripts/cron-sitemap-ping.sh

cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=' .env.production | xargs)
fi
LOG_DIR="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)/logs"
mkdir -p "$LOG_DIR" 2>/dev/null
echo "[$(date '+%Y-%m-%d %H:%M:%S')] cron-sitemap-ping start" >> "${LOG_DIR}/cron-sitemap-ping.log" 2>/dev/null || true
curl -s --max-time 30 "https://rbbmap.com/api/cron/sitemap-ping?cron_secret=${CRON_SECRET}" > /dev/null 2>&1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] cron-sitemap-ping end" >> "${LOG_DIR}/cron-sitemap-ping.log" 2>/dev/null || true
