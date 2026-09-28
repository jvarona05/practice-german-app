# ── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Build tools needed for argon2 native bindings
RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter @german-app/shared build
RUN pnpm --filter @german-app/api build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only what's needed at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
