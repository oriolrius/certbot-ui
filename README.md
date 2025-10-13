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

### Prerequisites

- Node.js >= 18
- npm >= 9
- Certbot installed on the system

### Development

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

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guide first.
