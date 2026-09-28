# ── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN pnpm --filter @german-app/shared build

# NEXT_PUBLIC_API_URL is baked into the Next.js bundle at build time.
# /api is a relative path — Caddy routes /api/* to the API container.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @german-app/web build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Standalone output is self-contained — no full node_modules needed
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
