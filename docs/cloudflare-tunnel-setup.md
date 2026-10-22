# Cloudflare Tunnel Setup Guide

This guide explains how Cloudflare Tunnels are integrated with the Certbot UI project and how to set them up.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Overview

The Certbot UI project uses Cloudflare Tunnels to expose local services (backend API and frontend web UI) to the internet securely without opening firewall ports or exposing public IP addresses. The tunnel runs as a Docker container integrated with the project's docker-compose setup.

### Benefits

- **No exposed ports**: Services remain in private network
- **Automatic HTTPS**: Cloudflare handles SSL/TLS termination
- **DDoS protection**: Traffic routes through Cloudflare's network
- **Project-integrated**: Tunnel starts/stops with your Docker services
- **Portable**: All configuration lives in the project directory

## How It Works

```
Internet → Cloudflare Edge → Tunnel (cloudflared) → Docker Network → Services
```

1. **DNS Resolution**: Domain names (certbot.example.com, certbot-api.example.com) resolve to Cloudflare's edge servers
2. **Cloudflare Edge**: Handles SSL/TLS, DDoS protection, and CDN caching
3. **Tunnel Connection**: Persistent outbound connection from cloudflared container to Cloudflare
4. **Service Routing**: Tunnel routes requests to appropriate Docker services on the internal network

### Key Components

- **cloudflared**: Official Cloudflare tunnel client running in Docker
- **Tunnel Credentials**: Unique authentication tokens for your tunnel
- **DNS Records**: CNAME records pointing domains to the tunnel
- **Ingress Rules**: Configuration mapping hostnames to internal services

## Architecture

### Docker Compose Integration

The tunnel is an optional service in `docker/docker-compose.yml`, enabled with the
`cloudflare` profile:

```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  container_name: certbot-ui-cloudflared
  restart: unless-stopped
  command: tunnel --config /etc/cloudflared/config.yml run
  volumes:
    - ${CLOUDFLARED_CONFIG_DIR:-./.cloudflared}:/etc/cloudflared:ro
  depends_on:
    - backend
    - frontend
  networks:
    - certbot-ui-network
  profiles:
    - cloudflare
```

### Network Flow

```
certbot.example.com (HTTPS) → Cloudflare → Tunnel → frontend:8080
certbot-api.example.com (HTTPS) → Cloudflare → Tunnel → backend:5000
```

### File Structure

```
certbot-ui/
├── docker/
│   ├── .cloudflared/                 # Not committed (gitignored)
│   │   ├── config.yml                # Tunnel configuration
│   │   └── <tunnel-id>.json          # Credentials
│   └── docker-compose.yml            # cloudflared service (profile: cloudflare)
└── docs/
    └── cloudflare-tunnel-setup.md    # This document
```

## Initial Setup

### Prerequisites

- Cloudflare account with a domain configured
- Domain nameservers pointing to Cloudflare
- Docker and Docker Compose installed
- `cloudflared` CLI installed on host (for initial setup only)

### Step 1: Install cloudflared CLI

On Ubuntu/Debian:

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb
```

Verify installation:

```bash
cloudflared --version
```

### Step 2: Authenticate with Cloudflare

Run the login command which will open a browser window:

```bash
cloudflared tunnel login
```

- Select your domain when prompted
- Authorize the application
- Credentials will be saved to `~/.cloudflared/cert.pem`

### Step 3: Create the Tunnel

Create a named tunnel:

```bash
cloudflared tunnel create <tunnel-name>
```

Example:
```bash
cloudflared tunnel create certbot-ui
```

This creates:
- A tunnel with a unique ID
- Credentials file: `~/.cloudflared/<tunnel-id>.json`

**Important**: Save the tunnel ID displayed in the output.

### Step 4: Configure DNS Records

Create DNS records pointing your domains to the tunnel:

```bash
cloudflared tunnel route dns <tunnel-name> <hostname>
```

For this project:

```bash
cloudflared tunnel route dns certbot-ui certbot.example.com
cloudflared tunnel route dns certbot-ui certbot-api.example.com
```

This creates CNAME records in your Cloudflare DNS pointing to the tunnel.

### Step 5: Move Credentials to Project

Copy the tunnel credentials next to `docker/docker-compose.yml` (or set
`CLOUDFLARED_CONFIG_DIR` to another directory):

```bash
cd docker
mkdir -p .cloudflared
cp ~/.cloudflared/<tunnel-id>.json .cloudflared/
chmod 644 .cloudflared/<tunnel-id>.json
```

### Step 6: Create Configuration File

Create `docker/.cloudflared/config.yml` (a template is in `docker/cloudflared.example.yml`):

```yaml
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/<tunnel-id>.json

ingress:
  # Frontend - Certbot UI
  - hostname: certbot.example.com
    service: http://frontend:8080

  # Backend API - Certbot API
  - hostname: certbot-api.example.com
    service: http://backend:5000

  # Catch-all rule (required)
  - service: http_status:404
```

**Note**: Service names (`frontend`, `backend`) must match the Docker Compose service names.

### Step 7: Update .gitignore

`.cloudflared/` is already in `.gitignore`, so neither the configuration nor the
credentials are committed.

### Step 8: Add to Docker Compose

The cloudflared service is already defined in `docker/docker-compose.yml`. No changes needed.

### Step 9: Start Services

```bash
cd docker
docker compose --profile cloudflare up -d
```

Verify the tunnel is running:

```bash
docker logs certbot-ui-cloudflared
```

You should see messages like:
```
Registered tunnel connection connIndex=0 ... location=<colo> protocol=quic
```

## Configuration

### Tunnel Configuration File

Location: `.cloudflared/config.yml`

#### Basic Structure

```yaml
tunnel: <tunnel-id>                    # Your tunnel UUID
credentials-file: /etc/cloudflared/<tunnel-id>.json

ingress:
  - hostname: <public-domain>
    service: http://<docker-service>:<port>

  - service: http_status:404           # Required catch-all
```

#### Ingress Rules

Ingress rules are evaluated in order. First match wins.

**HTTP Service**:
```yaml
- hostname: app.example.com
  service: http://app:8080
```

**HTTPS Service** (for services with their own SSL):
```yaml
- hostname: secure.example.com
  service: https://secure-app:443
  originServerName: secure.example.com
```

**WebSocket Support**:
```yaml
- hostname: ws.example.com
  service: http://websocket-service:3000
```

**Path-based Routing**:
```yaml
- hostname: api.example.com
  path: /v1/*
  service: http://api-v1:8080

- hostname: api.example.com
  path: /v2/*
  service: http://api-v2:8080
```

#### Advanced Options

**Custom Origin Request Timeout**:
```yaml
- hostname: slow.example.com
  service: http://slow-service:8080
  originRequest:
    connectTimeout: 30s
    noHappyEyeballs: true
```

**Disable Chunked Encoding**:
```yaml
- hostname: api.example.com
  service: http://api:5000
  originRequest:
    disableChunkedEncoding: true
```

### Credentials Security

The credentials file (`.cloudflared/<tunnel-id>.json`) contains sensitive authentication tokens:

- **Do not commit** to version control (add to `.gitignore`)
- Set appropriate permissions: `chmod 644 <tunnel-id>.json`
- Store securely if backing up
- Regenerate if compromised by deleting and recreating the tunnel

## Usage

### Starting the Tunnel

The tunnel starts with the other services when the `cloudflare` profile is enabled:

```bash
docker compose --profile cloudflare up -d
```

Start only the tunnel:

```bash
docker compose --profile cloudflare up -d cloudflared
```

### Stopping the Tunnel

Stop all services:

```bash
docker compose down
```

Stop only the tunnel:

```bash
docker compose stop cloudflared
```

### Viewing Logs

Real-time logs:

```bash
docker logs -f certbot-ui-cloudflared
```

Last 50 lines:

```bash
docker logs --tail 50 certbot-ui-cloudflared
```

### Restarting the Tunnel

```bash
docker restart certbot-ui-cloudflared
```

### Validating Configuration

Before starting, validate the configuration:

```bash
cloudflared tunnel ingress validate --config .cloudflared/config.yml
```

Test which service a hostname routes to:

```bash
cloudflared tunnel ingress rule https://certbot.example.com --config .cloudflared/config.yml
```

### Managing the Tunnel (CLI)

List tunnels:

```bash
cloudflared tunnel list
```

Get tunnel info:

```bash
cloudflared tunnel info <tunnel-name>
```

Delete a tunnel (caution!):

```bash
cloudflared tunnel delete <tunnel-name>
```

## Troubleshooting

### Tunnel Container Won't Start

**Check logs**:
```bash
docker logs certbot-ui-cloudflared
```

**Common issues**:

1. **Permission denied on credentials file**:
   ```bash
   chmod 644 .cloudflared/<tunnel-id>.json
   ```

2. **Config file not found**:
   - Verify `.cloudflared/config.yml` exists
   - Check volume mount in docker-compose.yml

3. **Invalid configuration**:
   ```bash
   cloudflared tunnel ingress validate --config .cloudflared/config.yml
   ```

### Tunnel Connected but Services Unreachable

**Verify services are running**:
```bash
docker compose ps
```

**Check service names** in config match docker-compose service names:
- Frontend: `frontend` (not `certbot-ui-frontend`)
- Backend: `backend` (not `certbot-ui-backend`)

**Test internal connectivity**:
```bash
docker exec certbot-ui-cloudflared wget -O- http://frontend:8080
docker exec certbot-ui-cloudflared wget -O- http://backend:5000/api/health
```

### DNS Not Resolving

**Verify DNS records**:
```bash
dig certbot.example.com
dig certbot-api.example.com
```

Both should show CNAME records pointing to `<tunnel-id>.cfargotunnel.com`

**Check Cloudflare dashboard**:
- Go to DNS settings
- Verify CNAME records exist
- Ensure proxy status is enabled (orange cloud)

### Connection Timeout or 502 Errors

**Check backend service health**:
```bash
docker compose ps
curl http://localhost:5000/api/health
curl http://localhost:9000
```

**Verify network connectivity**:
```bash
docker network inspect certbot-ui_certbot-network
```

Ensure all services are on the same network.

**Check tunnel connections**:
```bash
docker logs certbot-ui-cloudflared | grep "Registered tunnel connection"
```

Should show 4 active connections.

### High Latency

**Check tunnel location**:
```bash
docker logs certbot-ui-cloudflared | grep location
```

Connections should route to nearby datacenters (e.g., `bcn01`, `mad03` for Spain).

**Consider using Argo Smart Routing** (paid Cloudflare feature) for optimized routing.

### Updating the Configuration

1. Edit `.cloudflared/config.yml`
2. Validate: `cloudflared tunnel ingress validate --config .cloudflared/config.yml`
3. Restart: `docker restart certbot-ui-cloudflared`

### Credentials Lost or Corrupted

If credentials are lost:

1. Delete the tunnel:
   ```bash
   cloudflared tunnel delete <tunnel-name>
   ```

2. Remove DNS records from Cloudflare dashboard

3. Follow [Initial Setup](#initial-setup) steps again

## Security Considerations

### Best Practices

1. **Restrict Credentials Access**
   - Set file permissions to 644 or more restrictive
   - Never commit credentials to version control
   - Use environment-specific tunnels (dev, staging, prod)

2. **Monitor Tunnel Activity**
   - Review logs regularly: `docker logs certbot-ui-cloudflared`
   - Set up alerts for tunnel disconnections
   - Monitor Cloudflare Analytics for unusual traffic

3. **Implement Rate Limiting**
   - Backend already implements rate limiting (100 req/15min)
   - Consider Cloudflare Rate Limiting rules for additional protection

4. **Keep Updated**
   - Pull latest cloudflared image regularly: `docker pull cloudflare/cloudflared:latest`
   - Rebuild services: `docker compose up -d --pull always`

5. **Use Access Policies** (Cloudflare Zero Trust)
   - Add authentication requirements for sensitive endpoints
   - Restrict access by IP, country, or email domain
   - Configure via Cloudflare Zero Trust dashboard

### Network Isolation

The tunnel runs in the same Docker network as services but:
- Only exposes configured ingress rules
- All other ports remain private
- Container filesystem is read-only (`:ro` mount)

### Firewall Considerations

No inbound ports need to be opened. The tunnel makes outbound connections only:
- Destination: Cloudflare edge (ports 443, 7844)
- Protocol: QUIC (preferred) or HTTP/2

Ensure firewall allows outbound HTTPS connections.

## Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [cloudflared GitHub Repository](https://github.com/cloudflare/cloudflared)
- [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For project-specific issues, refer to the main project README or open an issue.

For Cloudflare Tunnel issues, consult:
- [Cloudflare Community Forums](https://community.cloudflare.com/)
- [Cloudflare Support](https://support.cloudflare.com/)
