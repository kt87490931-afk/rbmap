#!/bin/bash
# rbmap 배포 스크립트 (DigitalOcean Droplet 등)
set -e

echo "== rbmap 배포 시작 =="

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
# 환경변수 복사 (서버에서 .env.production 또는 .env.local 사용)
if [ -f .env.production ]; then
  cp .env.production .next/standalone/.env.production
elif [ -f .env.local ]; then
  cp .env.local .next/standalone/.env.local
fi

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

# 6. 상태 확인
echo "[5/6] PM2 상태..."
pm2 status rbmap

echo ""
echo "== 배포 완료 =="
echo "서비스: http://localhost:3000"
echo "Nginx 사용 시: http://서버IP 또는 도메인"
