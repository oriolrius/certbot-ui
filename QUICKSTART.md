# Quick Start Guide

Get your Certbot UI up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Certbot installed on your system
- Port 3000 and 5000 available

## Installation

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd certbot-ui

# Set up environment variables
cp .env.example .env

# IMPORTANT: Edit .env and set a secure JWT_SECRET
nano .env  # or use your preferred editor
```

**Required change in `.env`:**
```bash
JWT_SECRET=your-very-secure-random-string-at-least-32-characters-long
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install
```

### Step 3: Start the Application

#### Option A: Docker (Recommended)

```bash
# Build and start services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

#### Option B: Development Mode

```bash
# Start both frontend and backend
npm run dev
```

This starts:
- Backend API at `http://localhost:5000`
- Frontend at `http://localhost:3000`

### Step 4: Access the Application

1. Open your browser to `http://localhost:3000`
2. Log in with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

3. **⚠️ IMPORTANT**: Change your password immediately!
   - Go to Settings
   - Click "Change Password"

## First Certificate

### Method 1: Using the Wizard

1. Click **"New Certificate"** on the dashboard
2. Enter your domain (e.g., `example.com`)
3. Select a validation method:
   - **Standalone**: If port 80/443 is free
   - **Webroot**: If you have a web server running
4. Enter your email address
5. Agree to the Terms of Service
6. Review and confirm
7. Wait for certificate acquisition (30-60 seconds)

### Method 2: Test with Staging

To avoid rate limits while testing:

1. Follow the wizard as above
2. ✅ Check "Use staging environment"
3. Complete the process

**Note**: Staging certificates are not trusted by browsers but are perfect for testing!

## Common Commands

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build
```

### Development

```bash
# Start development servers
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## Troubleshooting

### "Permission denied" when accessing Certbot

**Solution**: The backend needs sudo privileges to run Certbot commands.

```bash
# Option 1: Run backend with sudo (development only)
sudo npm run dev:backend

# Option 2: Configure sudoers (production)
# Add to /etc/sudoers.d/certbot-ui
your-user ALL=(ALL) NOPASSWD: /usr/bin/certbot
```

### Ports already in use

**Solution**: Change ports in `docker-compose.yml` or environment variables.

```yaml
# In docker-compose.yml
services:
  backend:
    ports:
      - "5001:5000"  # Change 5001 to your preferred port
  frontend:
    ports:
      - "3001:80"    # Change 3001 to your preferred port
```

### Certbot not found

**Solution**: Ensure Certbot is installed and update the path.

```bash
# Find Certbot
which certbot

# Update in backend/.env
CERTBOT_PATH=/usr/local/bin/certbot  # or your path
```

## Next Steps

1. ✅ Change default password
2. ✅ Obtain your first certificate
3. ✅ Set up automatic renewal
4. 📖 Read the [Usage Guide](./USAGE.md) for more features
5. 🔒 Review [Security Best Practices](./INSTALLATION.md#security)

## Need Help?

- 📚 **Full Documentation**: See [INSTALLATION.md](./INSTALLATION.md) and [USAGE.md](./USAGE.md)
- 🐛 **Issues**: Check the troubleshooting section in USAGE.md
- 💬 **Questions**: Open an issue on GitHub

## What's Next?

Explore these features:
- **Dashboard**: Monitor all your certificates
- **Renewal**: Manual and automatic renewal options
- **Logs**: View detailed Certbot operation logs
- **Settings**: Configure defaults and notifications

---

**Enjoy your new Certbot UI!** 🎉

For production deployment, see the [Installation Guide](./INSTALLATION.md) for security hardening and SSL setup.
