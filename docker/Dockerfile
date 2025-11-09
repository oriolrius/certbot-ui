# syntax=docker/dockerfile:1

################################################################################
# Base Stage - Common dependencies
################################################################################
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

################################################################################
# Dependencies Stage - Install production dependencies
################################################################################
FROM base AS dependencies

# Copy package files from monorepo root
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install production dependencies using npm workspaces from root
RUN npm ci --omit=dev --workspaces

################################################################################
# Build Backend
################################################################################
FROM base AS build-backend

# Copy package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --workspace=backend

# Copy backend source files
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

# Build backend TypeScript
RUN npm run build --workspace=backend

################################################################################
# Build Frontend
################################################################################
FROM base AS build-frontend

# Accept build arguments for frontend configuration
ARG VITE_API_URL=/api

# Copy package files
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --workspace=frontend

# Copy frontend source files
COPY frontend/src ./frontend/src
COPY frontend/index.html ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/tsconfig.node.json ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/.eslintrc.cjs ./frontend/

# Set environment variable for Vite build
# Vite will use this during build process - no .env file needed
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
RUN npm run build --workspace=frontend

################################################################################
# Production Backend Stage
################################################################################
FROM node:20-alpine AS backend

# Install Python, pip, and dependencies needed for Certbot
# Also install openssl (CLI tool), openjdk11 for certificate format conversions, and dumb-init
# openjdk11 includes keytool which is needed for JKS format support
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    openssl \
    openjdk11 \
    openjdk11-jre-headless \
    dumb-init \
    wget

# Install the latest version of Certbot and DNS plugins using pip
# Using --break-system-packages is safe in a container environment
RUN pip3 install --no-cache-dir --break-system-packages --upgrade \
    certbot \
    certbot-dns-cloudflare \
    certbot-dns-route53 \
    certbot-dns-google

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies (workspaces install to root node_modules)
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=dependencies --chown=nodejs:nodejs /app/backend/package.json ./backend/package.json

# Copy built backend
COPY --from=build-backend --chown=nodejs:nodejs /app/backend/dist ./backend/dist

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Copy entrypoint script
COPY --chown=nodejs:nodejs docker/docker-entrypoint-backend.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Set environment variables with production defaults
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]

# Start the application
CMD ["node", "backend/dist/index.js"]

################################################################################
# Production Frontend Stage
################################################################################
FROM nginx:alpine AS frontend

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001

# Copy built frontend from build stage
COPY --from=build-frontend --chown=nginx-user:nginx-user /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
