# German App

Learn German from your real class conversations.

## Quick start

**Prerequisites:** Node.js 18+, pnpm, Docker Desktop

```bash
# 1. Install dependencies
pnpm install

# 2. Start MongoDB
docker compose up -d

# 3. Copy and fill in API env vars
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and add your OPENAI_API_KEY

# 4. Copy web env
cp apps/web/.env.local.example apps/web/.env.local

# 5. Run everything
pnpm dev
```

- Frontend: http://localhost:3000
- API:      http://localhost:3001/api

## Structure

```
apps/
  web/   — Next.js frontend (PWA)
  api/   — NestJS backend
packages/
  shared/ — TypeScript types shared between apps
```

## Swapping the AI model

Edit `apps/api/.env`:
```
AI_MODEL=gpt-4o-mini        # any OpenAI model
OPENAI_API_KEY=your-key
```

No code changes needed.
