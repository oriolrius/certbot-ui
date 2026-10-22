# Running Vite Dev Server with Network Access

## Quick Start

Now that the configuration is updated, you can run the dev server in multiple ways:

### Method 1: Use the new npm script (Recommended)
```bash
npm run dev:host
```

### Method 2: Use the default (now configured for host)
```bash
npm run dev
```
Since we've added `host: '0.0.0.0'` to `vite.config.ts`, the default `npm run dev` will now expose the server on all network interfaces.

### Method 3: Command line override
```bash
npm run dev -- --host 0.0.0.0 --port 3001
```

## Configuration Options

### Current Setup (vite.config.ts)

```typescript
server: {
  host: '0.0.0.0',  // Expose on all network interfaces
  port: 3000,
  allowedHosts: 'all', // Allow all hosts (development mode)
  // Or use specific hosts for better security:
  // allowedHosts: [
  //   'wsl.ymbihq.local',
  //   '.ymbihq.local',  // All subdomains
  //   '.i40sys.com',
  //   'localhost',
  // ],
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

### Available Host Options

1. **`0.0.0.0`** - Listen on all network interfaces (recommended for development)
   - Accessible via localhost, LAN IP, and external IP

2. **`localhost`** - Only accessible from the same machine
   - Default behavior without `--host`

3. **`true`** - Same as `0.0.0.0`
   ```bash
   npm run dev -- --host true
   ```

4. **Specific IP** - Bind to a specific network interface
   ```bash
   npm run dev -- --host 192.168.1.100
   ```

## Accessing the Dev Server

Once running with `--host`, you'll see output like:

```
  VITE v5.0.11  ready in 324 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
  ➜  Network: http://10.0.0.5:3000/
  ➜  press h + enter to show help
```

### Access from:

1. **Same machine**: `http://localhost:3000`
2. **Other devices on LAN**: `http://192.168.1.100:3000` (use your actual IP)
3. **Mobile devices**: `http://192.168.1.100:3000`
4. **WSL to Windows**: Use the Network IP shown in the output

## Finding Your IP Address

### Linux/WSL
```bash
# Get all IPs
ip addr show

# Get main LAN IP
hostname -I | awk '{print $1}'

# Or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### macOS
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Docker Setup

If running in Docker, you need to expose the port and set the host:

### docker-compose.yml
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_HOST=0.0.0.0
    command: npm run dev:host
```

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev:host"]
```

## Cloudflare Tunnel Setup

If using Cloudflare Tunnel (like in this project), you can expose the dev server:

### .cloudflared/config.yml
```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  # Development server
  - hostname: dev.i40sys.com
    service: http://localhost:3000

  # Production API
  - hostname: certbot-api.i40sys.com
    service: http://backend:5000

  - service: http_status:404
```

Then access via: `https://dev.i40sys.com`

## Security Considerations

⚠️ **Important Security Notes:**

1. **Firewall**: The dev server is now accessible from your network
   - Only use on trusted networks
   - Don't expose on public networks (coffee shops, etc.)

2. **HTTPS**: Dev server uses HTTP by default
   - Add HTTPS for sensitive data
   - Use Cloudflare Tunnel for public access

3. **Environment Variables**: Don't commit sensitive data
   - Use `.env.local` for secrets
   - Add to `.gitignore`

## HTTPS in Development

If you need HTTPS for testing:

### Option 1: Use Vite's built-in HTTPS
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: true, // Enable HTTPS
  },
})
```

Install the plugin:
```bash
npm install --save-dev @vitejs/plugin-basic-ssl
```

### Option 2: Use mkcert for trusted certificates
```bash
# Install mkcert
brew install mkcert  # macOS
# or
sudo apt install mkcert  # Linux

# Create local CA
mkcert -install

# Generate certificate
mkcert localhost 192.168.1.100 ::1
```

Update `vite.config.ts`:
```typescript
server: {
  host: '0.0.0.0',
  port: 3000,
  https: {
    key: './localhost-key.pem',
    cert: './localhost.pem',
  },
}
```

### Option 3: Use Cloudflare Tunnel (Recommended)
Already configured in this project! Access via:
- `https://certbot-api.i40sys.com` (production)
- Configure another hostname for dev

## Troubleshooting

### Issue: "Blocked request. This host is not allowed"

**Error message:**
```
Blocked request. This host ("wsl.ymbihq.local") is not allowed.
To allow this host, add "wsl.ymbihq.local" to `server.allowedHosts` in vite.config.js.
```

**Solution 1: Allow all hosts (easiest for development)**
```typescript
// vite.config.ts
server: {
  allowedHosts: 'all',
}
```

**Solution 2: Add specific hosts**
```typescript
// vite.config.ts
server: {
  allowedHosts: [
    'wsl.ymbihq.local',
    '.ymbihq.local',  // Wildcard for all subdomains
    'localhost',
  ],
}
```

**Solution 3: Add via environment variable**
```bash
# .env.development
VITE_ALLOWED_HOSTS=wsl.ymbihq.local,.ymbihq.local,localhost
```

Then in vite.config.ts:
```typescript
server: {
  allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(',') || 'all',
}
```

### Issue: "Address already in use"
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep :3000

# Kill the process
kill -9 <PID>
```

### Issue: Can't access from other devices
1. Check firewall settings
   ```bash
   # Linux/WSL: Allow port 3000
   sudo ufw allow 3000/tcp

   # Windows: Add inbound rule in Windows Firewall
   ```

2. Verify server is listening on 0.0.0.0
   ```bash
   netstat -tulpn | grep :3000
   ```
   Should show: `0.0.0.0:3000` not `127.0.0.1:3000`

3. Check network connectivity
   ```bash
   # From other device, ping your dev machine
   ping 192.168.1.100
   ```

### Issue: WSL2 networking issues

WSL2 uses a virtual network adapter. Get the WSL IP:
```bash
# In WSL
ip addr show eth0 | grep inet
```

Access from Windows using that IP:
```
http://172.x.x.x:3000
```

Or use Windows localhost with port forwarding:
```powershell
# In Windows PowerShell (Admin)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.x.x.x
```

## Performance Tips

1. **HMR (Hot Module Replacement)** works over network
2. **Slower on network** - expect slightly longer reload times
3. **Use local for development** - only use network when testing on other devices

## Environment-Specific Configuration

### .env.development
```env
VITE_API_URL=http://localhost:5000
VITE_HOST=0.0.0.0
```

### .env.production
```env
VITE_API_URL=https://certbot-api.i40sys.com
```

## npm Scripts Summary

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Start dev server (now with host=0.0.0.0) |
| `npm run dev:host` | `vite --host` | Explicitly expose on network |
| `npm run build` | `tsc && vite build` | Production build |
| `npm run preview` | `vite preview` | Preview production build |

## Testing on Mobile Devices

1. **Same WiFi Network**
   ```
   http://YOUR_IP:3000
   ```

2. **QR Code Access**
   - Generate QR code for the network URL
   - Scan with mobile device

   ```bash
   # Install qrcode-terminal
   npm install -g qrcode-terminal

   # Generate QR code
   qrcode-terminal "http://192.168.1.100:3000"
   ```

3. **Use Cloudflare Tunnel**
   ```
   https://dev.i40sys.com
   ```
   Accessible from anywhere!

## Best Practices

1. ✅ **Development**: Use `npm run dev:host` when testing on other devices
2. ✅ **Security**: Only use on trusted networks
3. ✅ **Performance**: Use `localhost` for regular development
4. ✅ **Production**: Always build and deploy properly
5. ✅ **HTTPS**: Use Cloudflare Tunnel or mkcert for HTTPS testing

## Related Documentation

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Cloudflare Tunnel Setup](./cloudflare-tunnel-setup.md)
- [Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
