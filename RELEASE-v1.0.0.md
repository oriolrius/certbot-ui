# Certbot UI v1.0.0 - Production Release

## 🚀 Overview

This is the first production release of Certbot UI, featuring enterprise-grade Docker containers and automated CI/CD workflows inspired by best practices from modern cloud-native applications.

## ✨ What's New

### Production-Ready Docker Images

We've completely redesigned our Docker deployment with security and performance in mind:

#### 🏗️ Multi-Stage Build Architecture
- **Optimized Build Process**: Separate stages for dependencies, building, and production
- **Smaller Images**: Frontend is only ~50MB, Backend ~1.6GB (includes Python/Certbot)
- **Layer Caching**: Efficient builds with Docker BuildKit

#### 🔒 Security First
- ✅ **Non-root Execution**: Both containers run as user ID 1001
- ✅ **Read-only Filesystem**: Frontend runs with read-only root filesystem
- ✅ **No New Privileges**: Containers cannot gain additional privileges
- ✅ **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options
- ✅ **Signal Handling**: Proper shutdown with dumb-init
- ✅ **Health Checks**: Built-in health monitoring for both services

#### 🌐 Production Features
- **Nginx Reverse Proxy**: Optimized frontend serving with gzip compression
- **WebSocket Support**: Real-time certificate updates
- **Rate Limiting**: Configurable API rate limiting
- **CORS Configuration**: Flexible origin control
- **Cloudflare Tunnel**: Optional integration (use `--profile cloudflare`)

### 📦 GitHub Container Registry (GHCR)

Pre-built images are now available on GHCR:

```bash
# Backend
docker pull ghcr.io/oriolrius/certbot-ui/backend:latest
docker pull ghcr.io/oriolrius/certbot-ui/backend:v1.0.0

# Frontend
docker pull ghcr.io/oriolrius/certbot-ui/frontend:latest
docker pull ghcr.io/oriolrius/certbot-ui/frontend:v1.0.0
```

### 🤖 Automated CI/CD

#### Docker Build Workflow
- Triggered on: push to main, tags, pull requests
- **Multi-platform**: Built for linux/amd64
- **Caching**: GitHub Actions cache for faster builds
- **Security Scanning**: Trivy vulnerability scanner
- **Attestations**: Build provenance for supply chain security
- **Automatic Tagging**: Semantic versioning support

#### Release Workflow
- Manual trigger via GitHub Actions
- **Version Bumping**: Automatic patch/minor/major versioning
- **Changelog Generation**: Auto-generated release notes
- **Git Tagging**: Automatic tag creation and push
- **GitHub Releases**: Creates release with installation instructions

## 📁 New File Structure

```
certbot-ui/
├── docker/                          # Production Docker configuration
│   ├── Dockerfile                   # Multi-stage unified Dockerfile
│   ├── docker-compose.yml           # Production compose (GHCR images)
│   ├── docker-compose.local.yml     # Local build compose
│   ├── docker-entrypoint-backend.sh # Backend startup script
│   ├── nginx.conf                   # Nginx configuration
│   ├── .env.example                 # Environment template
│   └── README.md                    # Deployment documentation
├── .github/workflows/
│   ├── docker-build.yml             # Automated Docker builds
│   └── release.yml                  # Release automation
└── VERSION                          # Version file
```

## 🚀 Quick Start

### Production Deployment

```bash
cd docker
cp .env.example .env
# Edit .env - IMPORTANT: Change JWT_SECRET!
docker-compose up -d
```

### Local Development

```bash
npm install
npm run dev
```

## 📚 Documentation

Comprehensive documentation is now available:

- **[Docker Deployment Guide](docker/README.md)**: Complete production deployment instructions
- **[Main README](README.md)**: Updated with Docker-first approach
- **[Environment Configuration](docker/.env.example)**: All configuration options explained

## 🔐 Security Improvements

1. **JWT Secret**: Now properly configurable via environment variables
2. **CORS**: Flexible origin configuration
3. **Rate Limiting**: Configurable per environment
4. **Non-root Containers**: Enhanced security posture
5. **Read-only Filesystem**: Frontend runs on immutable filesystem
6. **Security Headers**: Comprehensive HTTP security headers

## 🎯 Migration from Previous Setup

If you're upgrading from the old Docker setup:

### Old Setup (docker-compose.yml in root)
```bash
# Old way
docker-compose up -d
```

### New Setup (docker/ directory)
```bash
# New way - production
cd docker
cp .env.example .env
docker-compose up -d

# Or for local builds
docker-compose -f docker-compose.local.yml up -d
```

### Key Changes

1. **Images**: Now pulled from GHCR instead of building locally
2. **Configuration**: Centralized in `docker/.env`
3. **Port**: Frontend now on 8080 (was 9000)
4. **Security**: Enhanced with non-root users and read-only FS
5. **Nginx**: Custom optimized configuration

## 🐛 Known Issues

None at this time.

## 📊 Technical Details

### Backend Image
- **Base**: node:20-alpine
- **Size**: ~1.6GB (includes Python, Certbot, OpenJDK)
- **User**: nodejs (UID 1001)
- **Port**: 5000
- **Health Check**: GET /api/health

### Frontend Image
- **Base**: nginx:alpine
- **Size**: ~50MB
- **User**: nginx-user (UID 1001)
- **Port**: 8080
- **Health Check**: GET /health

### Build Time
- Backend: ~3-5 minutes (first build, cached: ~1 minute)
- Frontend: ~2-3 minutes (first build, cached: ~30 seconds)

## 🙏 Acknowledgments

This release was inspired by production-ready patterns from:
- kafka-basics project Docker architecture
- Docker best practices for Node.js
- OWASP security guidelines

## 📞 Support

For issues or questions:
- 📝 [GitHub Issues](https://github.com/oriolrius/certbot-ui/issues)
- 📖 [Documentation](docker/README.md)
- 🐳 [Docker Hub](https://ghcr.io/oriolrius/certbot-ui)

## 🔄 Next Steps

After deploying v1.0.0:

1. **Security**: Review and change `JWT_SECRET` in production
2. **CORS**: Configure `ALLOWED_ORIGINS` for your domain
3. **Monitoring**: Set up log monitoring with `docker-compose logs -f`
4. **Backups**: Ensure `/etc/letsencrypt` is backed up regularly
5. **Updates**: Watch for security updates and new releases

---

**Full Changelog**: Initial production release

**Docker Images**:
- `ghcr.io/oriolrius/certbot-ui/backend:v1.0.0`
- `ghcr.io/oriolrius/certbot-ui/frontend:v1.0.0`
