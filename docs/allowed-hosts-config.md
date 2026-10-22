# Allowed Hosts Configuration

## The Problem

When accessing Vite dev server from a hostname other than `localhost`, you may see:

```
Blocked request. This host ("wsl.ymbihq.local") is not allowed.
To allow this host, add "wsl.ymbihq.local" to `server.allowedHosts` in vite.config.js.
```

This is a **security feature** to prevent DNS rebinding attacks.

## Current Configuration

The project is configured to **allow all hosts** in development:

```typescript
// frontend/vite.config.ts
server: {
  host: '0.0.0.0',
  port: 3000,
  allowedHosts: 'all', // ← Allows any hostname
}
```

## Configuration Options

### Option 1: Allow All Hosts (Current Setup)

**Best for:** Development environments

```typescript
server: {
  allowedHosts: 'all',
}
```

✅ **Pros:**
- No configuration needed
- Works with any hostname or IP
- Great for development

⚠️ **Cons:**
- Less secure (development only!)
- Don't use in production

---

### Option 2: Specific Hosts Array

**Best for:** Better security, known hostnames

```typescript
server: {
  allowedHosts: [
    'localhost',
    'wsl.ymbihq.local',
    '127.0.0.1',
  ],
}
```

✅ **Pros:**
- More secure
- Explicit control

⚠️ **Cons:**
- Need to add each hostname
- Can be tedious with multiple environments

---

### Option 3: Wildcard Subdomains

**Best for:** Multiple subdomains on same domain

```typescript
server: {
  allowedHosts: [
    '.ymbihq.local',  // Matches *.ymbihq.local
    '.i40sys.com',    // Matches *.i40sys.com
    'localhost',
  ],
}
```

✅ **Pros:**
- Flexible for subdomains
- More secure than 'all'

---

### Option 4: Environment-Based

**Best for:** Different settings per environment

```typescript
// vite.config.ts
server: {
  allowedHosts: process.env.NODE_ENV === 'production'
    ? ['production-domain.com']  // Strict in production
    : 'all',                      // Permissive in dev
}
```

---

### Option 5: Using .env File

**Best for:** Easy configuration without code changes

**.env.development:**
```env
VITE_ALLOWED_HOSTS=localhost,wsl.ymbihq.local,.ymbihq.local,.i40sys.com
```

**vite.config.ts:**
```typescript
server: {
  allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(',') || 'all',
}
```

---

## Common Hostnames to Allow

### WSL Environments
```typescript
allowedHosts: [
  'wsl.ymbihq.local',     // Your specific WSL hostname
  'wsl.localhost',        // Windows 11 WSL networking
  'localhost',
]
```

### Docker Environments
```typescript
allowedHosts: [
  'localhost',
  'host.docker.internal',
  '172.17.0.1',           // Docker bridge network
]
```

### Network Access
```typescript
allowedHosts: [
  'localhost',
  '192.168.1.100',        // Your LAN IP
  'dev.local',            // Custom DNS entry
  '.local',               // All .local domains
]
```

### Cloudflare Tunnel
```typescript
allowedHosts: [
  '.i40sys.com',          // All subdomains
  'certbot-api.i40sys.com',
  'dev.i40sys.com',
  'localhost',
]
```

---

## Security Considerations

### Development vs Production

| Environment | Recommended Setting | Reason |
|-------------|-------------------|--------|
| Development | `'all'` | Convenience, testing flexibility |
| Staging | Specific array | Balance security and testing |
| Production | Strict array | Maximum security |

### DNS Rebinding Attack

**What is it?**
An attacker can make your browser request malicious DNS names that resolve to localhost, potentially accessing your local development server.

**How `allowedHosts` helps:**
Vite checks the `Host` header in HTTP requests and blocks unknown hosts.

**Example attack scenario:**
1. You visit `evil.com`
2. `evil.com` contains JavaScript that makes requests to `malicious-domain.com`
3. `malicious-domain.com` DNS resolves to `127.0.0.1` (your localhost)
4. Without `allowedHosts`, the attacker can access your local dev server
5. With `allowedHosts`, Vite blocks the request

### Best Practices

1. ✅ **Use `'all'` in local development** - Convenience matters
2. ✅ **Use specific hosts in CI/CD** - Known environment
3. ✅ **Use wildcard subdomains carefully** - `.com` is too broad
4. ✅ **Document your allowed hosts** - Help team members
5. ❌ **Never use `'all'` in production** - Security risk

---

## Changing the Configuration

### Quick Change (Current File)

Edit `frontend/vite.config.ts`:

```typescript
server: {
  allowedHosts: 'all',  // ← Change this line
}
```

### Restart Required

After changing the config:
```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

Changes to `vite.config.ts` require a restart.

---

## Testing Allowed Hosts

### Test 1: Access via different hostnames

```bash
# Should work with allowedHosts: 'all'
curl http://localhost:3000
curl http://127.0.0.1:3000
curl http://wsl.ymbihq.local:3000
curl http://192.168.1.100:3000
```

### Test 2: Check blocked host

If using specific allowedHosts:

```typescript
allowedHosts: ['localhost'],
```

Then:
```bash
# Should work
curl -H "Host: localhost" http://127.0.0.1:3000

# Should be blocked
curl -H "Host: evil.com" http://127.0.0.1:3000
# Error: Invalid Host header
```

### Test 3: Browser DevTools

1. Open browser DevTools (F12)
2. Network tab
3. Check request headers
4. Look for `Host:` header
5. This is what Vite checks against allowedHosts

---

## Debugging

### See what host is being used

```bash
# Check the Host header in requests
curl -v http://wsl.ymbihq.local:3000 2>&1 | grep "Host:"
```

### Enable verbose logging

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    allowedHosts: 'all',
  },
  logLevel: 'info', // or 'warn', 'error', 'silent'
})
```

### Check Vite logs

When a host is blocked, Vite logs:
```
[vite] http proxy error: Invalid Host header
```

---

## Migration Guide

### From no allowedHosts to specific hosts

**Before:**
```typescript
server: {
  host: '0.0.0.0',
  port: 3000,
}
```

**After:**
```typescript
server: {
  host: '0.0.0.0',
  port: 3000,
  allowedHosts: [
    'localhost',
    'wsl.ymbihq.local',
  ],
}
```

### From 'all' to specific hosts

1. Note all hostnames you use for access
2. Add them to array:
   ```typescript
   allowedHosts: [
     'localhost',
     '127.0.0.1',
     'wsl.ymbihq.local',
     '.ymbihq.local',
   ]
   ```
3. Test each hostname
4. Add any missing ones

---

## Related Vite Options

### strictPort

```typescript
server: {
  port: 3000,
  strictPort: true,  // Exit if port is in use
}
```

### cors

```typescript
server: {
  cors: true,  // Enable CORS for all origins
  // or
  cors: {
    origin: ['http://localhost:3000', 'https://i40sys.com'],
  },
}
```

### headers

```typescript
server: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
}
```

---

## Summary

**Current Configuration:**
- ✅ `allowedHosts: 'all'` - Allows any hostname
- ✅ `host: '0.0.0.0'` - Listens on all interfaces
- ✅ Works with `wsl.ymbihq.local`, `localhost`, IPs, etc.

**When to Change:**
- Moving to production → Use specific hosts
- Security audit → Restrict to known hosts
- Team guidelines → Follow company policy

**Documentation:**
- Full guide: `docs/development-server-host.md`
- Quick start: `QUICK-START-DEV.md`
- This file: `docs/allowed-hosts-config.md`
