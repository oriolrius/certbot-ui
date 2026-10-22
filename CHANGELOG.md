## v1.1.1 (2026-10-22)

### Fix

- **server**: honor HOST and bind to 0.0.0.0 by default
- **dns**: make Route53 and DigitalOcean work and keep credentials for renewals
- **auth**: require authentication to create users

## v1.1.0 (2026-10-22)

### Feat

- **logs**: add log viewer with level filtering and highlighting
- **dns**: pass provider credentials to certbot DNS plugins

### Fix

- **settings**: make the Change Password button work
- **auth**: persist users and require a session to change password

## v1.0.0 (2025-11-09)

- Initial release: certificate management UI and API, Docker images on GHCR
