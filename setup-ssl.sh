#!/bin/bash
# 一键申请 Let's Encrypt 证书并启用 HTTPS
# 用法: bash setup-ssl.sh 你的域名 邮箱@example.com
set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "用法: bash setup-ssl.sh 你的域名 邮箱@example.com"
  echo "例如: bash setup-ssl.sh music.example.com you@example.com"
  exit 1
fi

echo "==> 1/4 写入临时 HTTP 配置（用于域名验证）..."
cat > frontend/nginx.conf <<'HTTPEOF'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://backend:8080;
    }
}
HTTPEOF

docker compose up -d frontend
sleep 3

echo "==> 2/4 申请证书..."
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive

echo "==> 3/4 写入 HTTPS 配置..."
cat > frontend/nginx.conf <<HTTPSEOF
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name _;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 200m;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_request_buffering off;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /uploads/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_buffering off;
        expires 7d;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
HTTPSEOF

echo "==> 4/4 重建前端容器加载证书..."
docker compose up -d --build frontend

echo ""
echo "========================================"
echo "HTTPS 已启用！访问: https://$DOMAIN"
echo "证书到期会由 certbot 容器自动续期"
echo "========================================"
