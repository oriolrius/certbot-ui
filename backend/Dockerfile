FROM node:20-alpine

WORKDIR /app

# Install Python, pip, and dependencies needed for Certbot
# Also install openssl (CLI tool) and openjdk11 for certificate format conversions
# openjdk11 includes keytool which is needed for JKS format support
RUN apk add --no-cache python3 py3-pip python3-dev gcc musl-dev libffi-dev openssl-dev cargo openssl openjdk11 openjdk11-jre-headless

# Install the latest version of Certbot using pip
# Using --break-system-packages is safe in a container environment
RUN pip3 install --no-cache-dir --break-system-packages --upgrade certbot

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]
