#!/bin/bash
# DigitalOcean rbmap 서버에서 리뷰 생성 크론 등록 스크립트
# 실행: bash scripts/setup-cron-rbmap.sh (서버에서 프로젝트 루트 또는 scripts 디렉터리에서 실행)
#
# 동작: 기존 crontab에 "20분마다 cron-generate-reviews.sh 실행" 항목을 추가/갱신합니다.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_SCRIPT="${PROJECT_DIR}/scripts/cron-generate-reviews.sh"
CRON_LINE="0,20,40 * * * * ${CRON_SCRIPT}"

if [ ! -f "$CRON_SCRIPT" ]; then
  echo "오류: $CRON_SCRIPT 를 찾을 수 없습니다."
  exit 1
fi

chmod +x "$CRON_SCRIPT"
mkdir -p "${PROJECT_DIR}/logs"

# 기존 crontab 백업
crontab -l 2>/dev/null > /tmp/crontab.rbmap.bak || true

# 기존 cron-generate-reviews.sh 항목 제거 후 새 스케줄(20분마다)로 추가
CURRENT=$(crontab -l 2>/dev/null || true)
if echo "$CURRENT" | grep -q "cron-generate-reviews.sh"; then
  echo "기존 cron-generate-reviews.sh 항목을 20분마다 실행으로 교체합니다."
  CURRENT=$(echo "$CURRENT" | grep -v "cron-generate-reviews.sh" | grep -v "^# rbmap 리뷰 자동생성" || true)
fi

# 새 항목 추가 (기존 crontab + 새 줄)
( echo "$CURRENT"; echo "# rbmap 리뷰 자동생성 (20분마다)"; echo "$CRON_LINE" ) | crontab -

echo "crontab에 리뷰 생성 크론을 등록/갱신했습니다 (20분마다 실행)."
echo ""
echo "등록된 내용:"
crontab -l
echo ""
echo "서버에 .env.production 에 CRON_SECRET= 또는 CRON_GENERATE_REVIEWS_SECRET= 값이 있어야 합니다."
echo "수동 테스트: $CRON_SCRIPT"
