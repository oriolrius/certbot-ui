#!/bin/sh
set -e

echo "Starting Certbot UI Backend..."

# Print environment info
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-5000}"
echo "Certbot Path: ${CERTBOT_PATH:-/usr/bin/certbot}"

# Verify certbot is available
if command -v certbot > /dev/null 2>&1; then
    echo "Certbot version: $(certbot --version 2>&1 | head -n1)"
else
    echo "WARNING: Certbot not found in PATH"
fi

# Start the server
echo "Starting API server..."
exec "$@"
