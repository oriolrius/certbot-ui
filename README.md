# Certbot UI

A modern, secure web interface for managing Certbot SSL/TLS certificates.

## Features

- 🔐 Secure certificate management
- 🔄 Automatic and manual certificate renewal
- 📊 Real-time dashboard with certificate status
- 🎨 Modern, responsive UI with dark mode
- 🔍 Comprehensive logging and monitoring
- 🚀 Easy deployment with Docker

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- WebSocket for real-time updates
- JWT authentication
- Comprehensive security middleware

### Frontend
- React 18 + TypeScript
- Vite for fast builds
- TanStack Query for data management
- Tailwind CSS + shadcn/ui components
- Lucide icons

## Quick Start

### 🐳 Production Deployment (Docker - Recommended)

The easiest way to deploy Certbot UI is using Docker:

```bash
# Navigate to docker directory
cd docker

# Copy and configure environment
cp .env.example .env
nano .env  # Edit JWT_SECRET and other settings

# Start with pre-built images from GitHub Container Registry
docker-compose up -d

# Or build locally
docker-compose -f docker-compose.local.yml up -d
```

Access at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

For detailed deployment instructions, see [Docker Documentation](docker/README.md).

### 💻 Development Setup

#### Prerequisites

- Node.js >= 18
- npm >= 9
- Certbot installed on the system

#### Running Locally

```bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5000`.

### Building

```bash
# Build both frontend and backend
npm run build

# Or build individually
npm run build:backend
npm run build:frontend
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage --workspaces
```

## Project Structure

```
certbot-ui/
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   ├── types/     # TypeScript types
│   │   └── utils/     # Utility functions
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/    # Page components
│   │   ├── hooks/    # Custom React hooks
│   │   ├── services/ # API services
│   │   ├── store/    # State management
│   │   └── types/    # TypeScript types
│   └── package.json
└── package.json       # Root package (workspaces)
```

## Configuration

Copy `.env.example` to `.env` in the backend directory and configure:

- `JWT_SECRET`: Secure random string for JWT signing
- `CERTBOT_PATH`: Path to certbot binary
- `CERTBOT_CONFIG_DIR`: Certbot configuration directory
- Other settings as needed

## Security

⚠️ **Important Security Notes:**

- This application runs Certbot commands with elevated privileges
- Always use HTTPS in production
- Change the default JWT secret
- Implement proper authentication
- Use rate limiting and input validation
- Review the security documentation before deployment

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Installation Guide](docs/INSTALLATION.md)** - Detailed installation and setup instructions
- **[Quick Start Guide](docs/QUICKSTART.md)** - Get up and running quickly
- **[Usage Guide](docs/USAGE.md)** - How to use the application
- **[Cloudflare Tunnel Setup](docs/cloudflare-tunnel-setup.md)** - Expose services securely to the internet
- **[Development Guide](docs/DEVELOPMENT.md)** - Dev servers, allowed hosts, tests and lint
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute to the project

## Docker Deployment

Pre-built images are published to GHCR. Use the compose file in `docker/`:

```bash
cd docker
cp .env.example .env   # set JWT_SECRET, ADMIN_PASSWORD, ALLOWED_ORIGINS...
docker compose up -d

# Optional: also start a Cloudflare Tunnel
docker compose --profile cloudflare up -d

# View logs / stop
docker compose logs -f
docker compose down
```

See the [Cloudflare Tunnel Setup Guide](docs/cloudflare-tunnel-setup.md) for details on exposing your services to the internet.

## License

MIT

## Contributing

Contributions are welcome! Please read the [Contributing Guide](docs/CONTRIBUTING.md) first.
