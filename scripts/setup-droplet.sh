#!/bin/bash
# 룸빵여지도 DigitalOcean Droplet 초기 설정 스크립트
# 실행: bash setup-droplet.sh (root 권한 권장)

set -e

echo "=== 1. 시스템 업데이트 ==="
apt-get update && apt-get upgrade -y

echo "=== 2. Node.js 20 (LTS) 설치 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

echo "=== 3. Git 설치 ==="
apt-get install -y git
git --version

echo "=== 4. PM2 설치 (전역) ==="
npm install -g pm2

echo "=== 5. Nginx 설치 ==="
apt-get install -y nginx

echo "=== 6. 앱 디렉토리 생성 ==="
mkdir -p /var/www/rbmap
chown -R $USER:$USER /var/www/rbmap

echo "=== 7. UFW 방화벽 설정 ==="
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

echo "=== 8. Nginx 리버스 프록시 설정 ==="
cat > /etc/nginx/sites-available/rbmap << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/rbmap /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== 9. PM2 시스템 서비스 등록 (재부팅 시 자동 시작) ==="
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "=== 설정 완료 ==="
echo "- Node.js: $(node -v)"
echo "- 앱 디렉토리: /var/www/rbmap"
echo "- Nginx: 80 → 3000 리버스 프록시"
echo ""
echo "다음 단계: GitHub Actions 배포 워크플로우 설정 후 push"
