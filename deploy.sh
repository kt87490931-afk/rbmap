#!/bin/bash
# rbmap 배포 스크립트 (DigitalOcean Droplet 등)
set -e

echo "== rbmap 배포 시작 =="

# 0. 최신 코드 가져오기
if [ -d .git ]; then
  echo "[0/6] git pull..."
  git fetch origin
  git reset --hard origin/main
else
  echo "[0/6] .git 없음, git pull 스킵"
fi

# 1. 의존성 설치
echo "[1/6] npm install..."
npm ci

# 2. 빌드
echo "[2/6] npm run build..."
npm run build

# 3. standalone 정리
echo "[3/6] standalone 정리..."
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
if [ -d public ]; then
  cp -r public .next/standalone/public 2>/dev/null || true
fi
# 환경변수 복사 — PM2 dotenv는 .env.production만 로드하므로 반드시 .env.production으로 복사
if [ -f .env.production ]; then
  cp .env.production .next/standalone/.env.production
elif [ -f .env.local ]; then
  cp .env.local .next/standalone/.env.production
fi
# Gemini API 키 파일 fallback (이브알바 패턴)
[ -f gemini_api_key.env ] && cp gemini_api_key.env .next/standalone/gemini_api_key.env

# 4. 로그 디렉터리
mkdir -p logs

# 5. PM2 재시작
echo "[4/6] PM2 재시작..."
if pm2 describe rbmap > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs
  echo "PM2 reload 완료"
else
  pm2 start ecosystem.config.cjs
  pm2 save
  pm2 startup 2>/dev/null || true
  echo "PM2 최초 시작 완료"
fi

# 6. Cron 설정 (리뷰 6시간 자동생성)
echo "[5/6] Cron 확인..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_SCRIPT="${SCRIPT_DIR}/scripts/cron-generate-reviews.sh"
if [ -f "$CRON_SCRIPT" ]; then
  chmod +x "$CRON_SCRIPT"
  if ! crontab -l 2>/dev/null | grep -q "cron-generate-reviews"; then
    (crontab -l 2>/dev/null; echo "0 0,6,12,18 * * * $CRON_SCRIPT") | crontab -
    echo "Cron 추가됨: 0,6,12,18시 리뷰 생성"
  fi
fi

# 7. 상태 확인
echo "[6/6] PM2 상태..."
pm2 status rbmap

echo ""
echo "== 배포 완료 =="
echo "서비스: http://localhost:3000"
echo "Nginx 사용 시: http://서버IP 또는 도메인"
