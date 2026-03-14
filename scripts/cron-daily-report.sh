#!/bin/bash
# 일일 리포트 Cron 래퍼 (매일 00시 KST)
# .env.production에서 CRON_SECRET 로드 후 API 호출
# crontab: 0 0 * * * /var/www/rbmap/scripts/cron-daily-report.sh

cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=' .env.production | xargs)
fi
curl -s --max-time 90 "https://rbbmap.com/api/cron/daily-report?cron_secret=${CRON_SECRET}" > /dev/null 2>&1
