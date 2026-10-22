# Quick Start - Development Server

## Running the Dev Server

### Option 1: Expose on Network (Configured by default)
```bash
npm run dev
```
Access from:
- Local: `http://localhost:3000`
- Network: `http://172.25.245.23:3000` (your current WSL IP)

### Option 2: Explicit Host Flag
```bash
npm run dev:host
```

### Option 3: Command Line Override
```bash
npm run dev -- --host --port 3001
```

## Current Configuration

**vite.config.ts** is now configured with:
```typescript
server: {
  host: '0.0.0.0',       // ← Exposes on all network interfaces
  port: 3000,
  allowedHosts: 'all',   // ← Allows access from any hostname
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

**Note:** `allowedHosts: 'all'` is configured to allow access from:
- `localhost`
- `wsl.ymbihq.local` (your WSL hostname)
- Any IP address (192.168.x.x, 172.x.x.x, etc.)
- Custom domains via Cloudflare Tunnel

## Access URLs

Once running, you can access the dev server from:

| Location | URL |
|----------|-----|
| Same machine | `http://localhost:3000` |
| Other devices on LAN | `http://172.25.245.23:3000` |
| Via Cloudflare Tunnel | `https://certbot-api.i40sys.com` (if configured) |

## Find Your Current IP

```bash
# Linux/WSL
hostname -I | awk '{print $1}'

# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

## Firewall (if needed)

If you can't access from other devices:

```bash
# Linux/WSL
sudo ufw allow 3000/tcp

# Windows (PowerShell as Admin)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## Common Issues

### "Blocked request. This host is not allowed"

If you see:
```
Blocked request. This host ("wsl.ymbihq.local") is not allowed.
```

**Already Fixed!** The config now has `allowedHosts: 'all'`.

If you still see this error, restart the dev server:
```bash
# Ctrl+C to stop
npm run dev
```

See `docs/allowed-hosts-config.md` for more details.

---

### "Address already in use"
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Can't access from Windows (when running in WSL)
Use the WSL IP (172.x.x.x) shown above, not localhost.

### Can't access from mobile
1. Ensure mobile is on same WiFi network
2. Check firewall rules
3. Verify dev server shows "Network:" URLs in output

## Full Documentation

See `docs/development-server-host.md` for:
- HTTPS setup
- Docker configuration
- Cloudflare Tunnel integration
- Security considerations
- Advanced troubleshooting

## Quick Test

After running `npm run dev`, you should see:
```
  VITE v5.0.11  ready in 324 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://172.25.245.23:3000/
  ➜  press h + enter to show help
```

Open `http://172.25.245.23:3000` on any device on your network!
