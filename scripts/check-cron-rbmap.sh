#!/bin/bash
# 서버에서 크론 설정·실행 여부 점검 (DigitalOcean rbmap)
# 실행: bash scripts/check-cron-rbmap.sh
#
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_SCRIPT="${PROJECT_DIR}/scripts/cron-generate-reviews.sh"
LOG_FILE="${PROJECT_DIR}/logs/cron-generate-reviews.log"
BOT_SYNC_CRON_SCRIPT="${PROJECT_DIR}/scripts/cron-cloudflare-bot-sync.sh"

echo "=== rbmap 리뷰 생성 크론 점검 ==="
echo ""

echo "1) crontab 항목"
if crontab -l 2>/dev/null | grep -q "cron-generate-reviews"; then
  crontab -l 2>/dev/null | grep -E "cron-generate-reviews|rbmap 리뷰"
  if crontab -l 2>/dev/null | grep -q "0,20,40.*cron-generate-reviews"; then
    echo "   -> 20분마다(0,20,40) 설정됨."
  else
    echo "   -> 경고: 20분마다가 아님. scripts/setup-cron-rbmap.sh 또는 deploy.sh 실행 권장."
  fi
else
  echo "   -> 없음. scripts/setup-cron-rbmap.sh 또는 deploy.sh 실행 필요."
fi
echo ""

echo "2) 스크립트 경로 및 권한"
if [ -x "$CRON_SCRIPT" ]; then
  echo "   $CRON_SCRIPT (실행 가능)"
else
  echo "   $CRON_SCRIPT (없거나 실행 불가)"
fi
echo ""

echo "3) .env.production 시크릿"
cd "$PROJECT_DIR" 2>/dev/null || true
if [ -f .env.production ]; then
  if grep -qE '^CRON_SECRET=|^CRON_GENERATE_REVIEWS_SECRET=' .env.production 2>/dev/null; then
    echo "   CRON_SECRET 또는 CRON_GENERATE_REVIEWS_SECRET 설정됨."
  else
    echo "   경고: CRON_SECRET/CRON_GENERATE_REVIEWS_SECRET 없음. API 호출 시 401 발생."
  fi
else
  echo "   경고: .env.production 없음 (스크립트는 프로젝트 루트 또는 /var/www/rbmap 기준)."
fi
echo ""

echo "4) 최근 크론 실행 로그 (마지막 5줄)"
if [ -f "$LOG_FILE" ]; then
  tail -n 5 "$LOG_FILE" 2>/dev/null || echo "   (읽기 실패)"
else
  echo "   로그 파일 없음 (아직 한 번도 실행 안 됨 또는 logs 경로 다름)."
fi
echo ""

echo "5) 다음 20분 단위 실행 시각 (서버 로컬 기준)"
echo "   매시 0, 20, 40분에 실행됩니다. 현재 서버 시각: $(date '+%Y-%m-%d %H:%M:%S %Z')."
echo ""

echo "6) Cloudflare 봇 로그 동기화 크론"
if crontab -l 2>/dev/null | grep -q "cron-cloudflare-bot-sync"; then
  crontab -l 2>/dev/null | grep "cron-cloudflare-bot-sync"
  if crontab -l 2>/dev/null | grep -q "\*/10 .*cron-cloudflare-bot-sync"; then
    echo "   -> 10분마다 설정됨."
  else
    echo "   -> 경고: 10분마다가 아님."
  fi
else
  echo "   -> 없음. 배포 후 자동 등록되거나 수동 추가 필요."
fi
if [ -x "$BOT_SYNC_CRON_SCRIPT" ]; then
  echo "   $BOT_SYNC_CRON_SCRIPT (실행 가능)"
else
  echo "   $BOT_SYNC_CRON_SCRIPT (없거나 실행 불가)"
fi
echo ""

echo "점검 완료."
