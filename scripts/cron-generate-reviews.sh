#!/bin/bash
# 리뷰 6시간 자동생성 Cron 래퍼
# .env.production에서 CRON_SECRET 로드 후 API 호출
# crontab: 0 0,6,12,18 * * * /var/www/rbmap/scripts/cron-generate-reviews.sh

cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=' .env.production | xargs)
fi
curl -s --max-time 120 "https://rbbmap.com/api/cron/generate-reviews?cron_secret=${CRON_SECRET}" > /dev/null 2>&1
