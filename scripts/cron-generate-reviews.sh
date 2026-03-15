#!/bin/bash
# 리뷰 자동생성 Cron 래퍼 (DigitalOcean rbmap 서버용)
# .env.production에서 CRON_SECRET 또는 CRON_GENERATE_REVIEWS_SECRET 로드 후 API 호출
#
# 스케줄: 20분마다 (0,20,40 * * * *) → 업체별 다음 가능 시각에 맞춰 처리 (테스트용; 운영 시 30분마다로 변경 가능)
# 설정: scripts/setup-cron-rbmap.sh 실행 또는 crontab -e 로 추가
#
LOG_DIR="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)/logs"
cd /var/www/rbmap 2>/dev/null || cd "$(dirname "$0")/.."
if [ -f .env.production ]; then
  export $(grep -E '^CRON_SECRET=|^CRON_GENERATE_REVIEWS_SECRET=' .env.production 2>/dev/null | xargs) 2>/dev/null || true
fi
# API는 CRON_SECRET 또는 CRON_GENERATE_REVIEWS_SECRET 둘 다 허용
SECRET="${CRON_SECRET:-$CRON_GENERATE_REVIEWS_SECRET}"
mkdir -p "$LOG_DIR" 2>/dev/null
echo "[$(date -Iseconds)] cron-generate-reviews start" >> "${LOG_DIR}/cron-generate-reviews.log" 2>/dev/null || true
curl -s --max-time 120 "https://rbbmap.com/api/cron/generate-reviews?cron_secret=${SECRET}" > /dev/null 2>&1
echo "[$(date -Iseconds)] cron-generate-reviews end" >> "${LOG_DIR}/cron-generate-reviews.log" 2>/dev/null || true
