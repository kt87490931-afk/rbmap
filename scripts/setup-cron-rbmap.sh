#!/bin/bash
# DigitalOcean rbmap 서버에서 리뷰 생성 크론 등록 스크립트
# 실행: bash scripts/setup-cron-rbmap.sh (서버에서 프로젝트 루트 또는 scripts 디렉터리에서 실행)
#
# 동작: 기존 crontab에 "30분마다 cron-generate-reviews.sh 실행" 항목을 추가합니다.
#       이미 동일 항목이 있으면 추가하지 않습니다.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_SCRIPT="${PROJECT_DIR}/scripts/cron-generate-reviews.sh"
CRON_LINE="0,30 * * * * ${CRON_SCRIPT}"

if [ ! -f "$CRON_SCRIPT" ]; then
  echo "오류: $CRON_SCRIPT 를 찾을 수 없습니다."
  exit 1
fi

chmod +x "$CRON_SCRIPT"
mkdir -p "${PROJECT_DIR}/logs"

# 기존 crontab 백업
crontab -l 2>/dev/null > /tmp/crontab.rbmap.bak || true

# 이미 동일한 스크립트가 등록돼 있는지 확인
if crontab -l 2>/dev/null | grep -q "cron-generate-reviews.sh"; then
  echo "이미 crontab에 cron-generate-reviews.sh 항목이 있습니다. 변경하지 않습니다."
  echo "현재 crontab:"
  crontab -l 2>/dev/null || true
  exit 0
fi

# 새 항목 추가 (기존 crontab + 새 줄)
( crontab -l 2>/dev/null; echo "# rbmap 리뷰 자동생성 (30분마다)"; echo "$CRON_LINE" ) | crontab -

echo "crontab에 리뷰 생성 크론을 등록했습니다 (30분마다 실행)."
echo ""
echo "등록된 내용:"
crontab -l
echo ""
echo "서버에 .env.production 에 CRON_SECRET= 또는 CRON_GENERATE_REVIEWS_SECRET= 값이 있어야 합니다."
echo "수동 테스트: $CRON_SCRIPT"
