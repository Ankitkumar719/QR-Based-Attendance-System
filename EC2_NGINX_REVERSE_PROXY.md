# EC2 Nginx Reverse Proxy (attendsmart.in → Node :5000)

Goal: avoid mixed-content by serving frontend over HTTPS and proxying API + Socket.IO on the same origin:

- Browser calls `https://attendsmart.in/api/...`
- Nginx proxies to `http://127.0.0.1:5000/api/...`

## Nginx site config (copy/paste)

Create/edit:

`/etc/nginx/sites-available/attendsmart.in`

```nginx
server {
    listen 80;
    server_name attendsmart.in www.attendsmart.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name attendsmart.in www.attendsmart.in;

    ssl_certificate     /etc/letsencrypt/live/attendsmart.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/attendsmart.in/privkey.pem;

    # If frontend files are on this EC2 instance (optional)
    # root /var/www/attendsmart/frontend;
    # index index.html;
    # location / { try_files $uri $uri/ /index.html; }

    # API → Node
    location /api/ {
        proxy_pass http://127.0.0.1:5000;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # Socket.IO → Node (WebSocket upgrade)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Enable + reload:

```bash
sudo ln -sf /etc/nginx/sites-available/attendsmart.in /etc/nginx/sites-enabled/attendsmart.in
sudo nginx -t
sudo systemctl reload nginx
```

## PM2 commands

```bash
pm2 status
pm2 restart all
pm2 logs --lines 200
```

## Verify

```bash
curl -i http://127.0.0.1:5000/api/health
curl -i https://attendsmart.in/api/health
```

