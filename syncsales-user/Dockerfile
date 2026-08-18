# ─────────────────────────────────────────────────────────────────────────────
#  SyncSales Frontend — Dockerfile
#  Multi-stage build:
#    1. builder  → installs deps, builds the Vite bundle
#    2. production → serves the static bundle via Nginx
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first for layer caching
COPY package.json package-lock.json ./

RUN npm ci --frozen-lockfile

# Copy source (respects .dockerignore)
COPY . .

# Build the production bundle
# VITE_API_URL is intentionally left blank — Nginx routes /api to the backend
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Production (Nginx static server) ─────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for the SPA
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
