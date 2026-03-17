#!/bin/bash
# Cloudflare 보안 이벤트 기반 봇 로그 동기화 Cron 래퍼
# 권장 crontab: */10 * * * * /var/www/rbmap/scripts/cron-cloudflare-bot-sync.sh

cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_CLOUDFLARE_BOT_SYNC_SECRET=|^CRON_SECRET=' .env.production | xargs)
fi

SECRET="${CRON_CLOUDFLARE_BOT_SYNC_SECRET:-$CRON_SECRET}"
curl -s --max-time 120 "https://rbbmap.com/api/cron/cloudflare-bot-sync?cron_secret=${SECRET}" > /dev/null 2>&1

