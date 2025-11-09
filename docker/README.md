# Certbot UI - Docker Deployment

This directory contains production-ready Docker configurations for deploying Certbot UI.

## 🚀 Quick Start

### Using Pre-built Images (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings (especially JWT_SECRET!)
nano .env

# Start the services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

### Building Locally

If you want to build the images locally instead of using the pre-built ones:

```bash
# Build backend image
docker build -f Dockerfile --target backend -t certbot-ui-backend:local ..

# Build frontend image
docker build -f Dockerfile --target frontend -t certbot-ui-frontend:local ..

# Run with local images
docker-compose -f docker-compose.local.yml up -d
```

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- At least 2GB of available disk space
- Access to Let's Encrypt directories on the host (for certificate management)

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize the following:

#### Required Settings

- `JWT_SECRET`: **MUST** be changed in production! Generate with:
  ```bash
  openssl rand -base64 32
  ```

#### Optional Settings

- `IMAGE_TAG`: Docker image tag to use (default: `latest`)
- `BACKEND_EXTERNAL_PORT`: Backend API port (default: `5000`)
- `FRONTEND_EXTERNAL_PORT`: Frontend UI port (default: `8080`)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

### Volume Mounts

The backend container requires access to Let's Encrypt directories:

- `/etc/letsencrypt`: Certificate storage (read-write)
- `/var/lib/letsencrypt`: Working directory (read-write)
- `/var/log/letsencrypt`: Certbot logs (read-write)

**Important**: Ensure these directories exist on the host and have appropriate permissions.

## 🏗️ Architecture

### Multi-stage Build

The `Dockerfile` uses a multi-stage build process:

1. **Base**: Common Node.js foundation
2. **Dependencies**: Production dependencies
3. **Build Backend**: TypeScript compilation
4. **Build Frontend**: Vite build
5. **Backend**: Production backend with Python/Certbot
6. **Frontend**: Production frontend with Nginx

### Security Features

- ✅ Non-root user execution
- ✅ Read-only filesystem for frontend
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Health checks
- ✅ Rate limiting
- ✅ Signal handling with dumb-init
- ✅ No new privileges flag

### Images

Pre-built images are available on GitHub Container Registry:

- `ghcr.io/oriolrius/certbot-ui/backend:latest`
- `ghcr.io/oriolrius/certbot-ui/frontend:latest`

Tagged versions are also available (e.g., `v1.0.0`).

## 🔍 Health Checks

Both services include health checks:

- **Backend**: `GET http://localhost:5000/api/health`
- **Frontend**: `GET http://localhost:8080/health`

Check status with:
```bash
docker-compose ps
```

## 📊 Monitoring

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

## 🌐 Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name certbot.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/certbot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/certbot.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Cloudflare Tunnel (Optional)

Enable Cloudflare Tunnel with:

```bash
# Start with cloudflare profile
docker-compose --profile cloudflare up -d
```

Ensure `.cloudflared/config.yml` is properly configured.

## 🔒 Security Best Practices

1. **Change JWT_SECRET**: Never use the default value in production
2. **Configure CORS**: Set `ALLOWED_ORIGINS` to only trusted domains
3. **Use HTTPS**: Always deploy behind HTTPS (nginx/cloudflare)
4. **Regular Updates**: Keep Docker images up to date
5. **Backup Certificates**: Regularly backup `/etc/letsencrypt`
6. **Monitor Logs**: Check logs for suspicious activity

## 🐛 Troubleshooting

### Backend won't start

Check certbot installation:
```bash
docker-compose exec backend certbot --version
```

Check permissions on Let's Encrypt directories:
```bash
ls -la /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt
```

### Frontend shows "API connection failed"

Verify backend is running:
```bash
docker-compose ps backend
curl http://localhost:5000/api/health
```

Check CORS configuration in `.env`

### Permission errors

The containers run as user ID 1001. Ensure directories have appropriate permissions:
```bash
sudo chown -R 1001:1001 /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt
```

### WebSocket connection issues

Ensure your reverse proxy is configured to handle WebSocket upgrades (see Nginx example above).

## 📚 Additional Resources

- [Main Documentation](../docs/)
- [GitHub Repository](https://github.com/oriolrius/certbot-ui)
- [Docker Hub](https://ghcr.io/oriolrius/certbot-ui)

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review logs: `docker-compose logs`
