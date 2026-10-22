# Development

## Running the dev servers

```bash
npm install
npm run dev            # backend (port 5000) + frontend (port 3000)
npm run dev:backend    # backend only
npm run dev:frontend   # frontend only
```

- The frontend dev server (Vite) listens on `0.0.0.0:3000` and proxies `/api` to
  the backend on `localhost:5000`.
- The backend listens on `HOST` (default `0.0.0.0`) and `PORT` (default `5000`).
  Binding to IPv4 matters on WSL2: Windows only forwards `localhost` to IPv4 listeners.
- Copy `backend/.env.example` to `backend/.env` to configure the backend. Users are
  stored in `USERS_FILE` (default `backend/data/users.json`, created on first start
  with the `admin` user and `ADMIN_PASSWORD`).

## Accessing the dev server from other hostnames

Vite 5.4.12+ blocks requests whose `Host` header is not explicitly allowed
(`Blocked request. This host ("…") is not allowed.`). `localhost` and `127.0.0.1`
are always allowed. To add more, put a comma-separated list in
`frontend/.env.development.local` (gitignored); a leading dot allows all subdomains:

```bash
VITE_ALLOWED_HOSTS=myhost.local,.example.com
```

Restart the dev server after changing it. The same list applies to `vite preview`.

## Tests, lint and build

```bash
npm test        # vitest in both workspaces (watch mode unless CI=true)
npm run lint
npm run build
```

CI (`.github/workflows/ci.yml`) runs the three on every push and pull request.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for the commit convention and the release flow.
