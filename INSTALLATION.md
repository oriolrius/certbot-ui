# Installation Guide

## Prerequisites

- Docker and Docker Compose (recommended) OR Node.js >= 18 and npm >= 9
- Certbot installed on the host system
- Root or sudo access (required for Certbot operations)

## Method 1: Docker (Recommended)

### 1. Clone the repository

```bash
git clone <repository-url>
cd certbot-ui
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and set a secure JWT_SECRET
```

### 3. Build and start services

```bash
docker-compose up -d
```

### 4. Access the application

Open your browser and navigate to `http://localhost:3000`

Default credentials:
- Username: `admin`
- Password: `admin123`

### 5. Verify services are running

```bash
docker-compose ps
docker-compose logs -f
```

## Method 2: Manual Installation

### 1. Install Certbot

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install certbot
```

**CentOS/RHEL:**
```bash
sudo yum install certbot
```

**macOS:**
```bash
brew install certbot
```

### 2. Clone and install dependencies

```bash
git clone <repository-url>
cd certbot-ui

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure backend

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start services

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 5. Access the application

Open your browser and navigate to `http://localhost:3000`

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```bash
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-random-string
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=http://localhost:3000
CERTBOT_PATH=/usr/bin/certbot
CERTBOT_CONFIG_DIR=/etc/letsencrypt
CERTBOT_WORK_DIR=/var/lib/letsencrypt
CERTBOT_LOGS_DIR=/var/log/letsencrypt
```

### Frontend Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
```

## Post-Installation

### 1. Change default password

Log in with default credentials and immediately change the password in Settings.

### 2. Configure Certbot paths

If your Certbot directories are in non-standard locations, update the environment variables accordingly.

### 3. Set up SSL (Production)

For production deployments, configure SSL certificates for the web interface itself.

## Troubleshooting

### Permission denied errors

Certbot requires root privileges. Ensure the backend process has sufficient permissions to execute Certbot commands.

### Port conflicts

If ports 3000 or 5000 are already in use, modify the port numbers in:
- `docker-compose.yml` (for Docker)
- Environment variables (for manual installation)

### Certbot not found

Verify Certbot installation:
```bash
which certbot
certbot --version
```

Update `CERTBOT_PATH` in environment variables if needed.

## Next Steps

- Read the [Usage Guide](./USAGE.md)
- Review [Security Best Practices](./SECURITY.md)
- Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
