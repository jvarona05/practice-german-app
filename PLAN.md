# German App — Project Plan

A Progressive Web App for learning German from **your real class conversations**, by turning them into reusable, sentence-based vocabulary cards with AI, then reviewing them in a fast, game-like, mobile-friendly session.

> **Guiding principle:** This is a *sentence-based* learning app, not a vocabulary dump. The enemy is card bloat. Every design choice favors **selective extraction** and **short, pleasant review sessions** over volume.

---

## 1. Decisions locked

| Topic | Decision |
|---|---|
| **AI model** | Default `gpt-4o-mini`, **swappable via env** behind an `AiProvider` interface (vendor + model both configurable). |
| **Rating scale** | 3 buttons: **Again / Good / Easy**. |
| **Deployment** | Local-only first (Docker Compose, one dev command). Cloud later. |
| **Translation language** | AI chooses EN or ES per card; **defaults to Spanish** when ambiguous. Stored per card. |
| **Raw lesson text** | **Never persisted.** Only saved cards + lightweight lesson metadata are stored. |

---

## 2. Tech stack & repo shape

- **Monorepo** with **pnpm workspaces** + **Turborepo** (for the single `dev` command and caching).
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS. PWA-ready.
- **Backend:** NestJS + TypeScript.
- **Database:** MongoDB (via Mongoose), run in Docker locally.
- **Shared package:** `packages/shared` holding TypeScript types/DTOs used by both apps (e.g. `Card`, `RatingAction`, AI response shapes) — single source of truth, no type drift.

```
german-app/
├─ apps/
│  ├─ web/                 # Next.js frontend (PWA)
│  └─ api/                 # NestJS backend
├─ packages/
│  └─ shared/              # shared TS types & DTOs
├─ docker-compose.yml      # mongodb (+ optional mongo-express)
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json            # root scripts: dev / build / lint
└─ PLAN.md
```

**One command to run everything:**
```bash
pnpm install
docker compose up -d        # starts MongoDB
pnpm dev                    # turbo runs web + api together
```
(We'll wrap this so `pnpm dev` also ensures Mongo is up.)

---

## 3. Data model (MongoDB collections)

### `users`
```ts
{ _id, email (unique), passwordHash, name, settings: { autoPlayAudio: boolean }, createdAt }
```

### `cards`  ← the core entity
```ts
{
  _id,
  userId,                 // ownership — every query is scoped to this
  german: string,
  translation: string,
  translationLang: 'es' | 'en',
  type?: string,          // 'reflexive-verb' | 'connector' | 'expression' | ...
  strength: number,       // 0–5
  dueDate: Date,          // when it next appears in review
  lastReviewedAt?: Date,
  reviewCount: number,
  createdAt: Date
}
```

### `lessons`  ← metadata only, **no raw text**
```ts
{ _id, userId, title?, cardCount: number, createdAt }
```

### `reviewLogs` (optional, Phase 4 — powers stats)
```ts
{ _id, userId, cardId, action: 'again'|'good'|'easy', strengthBefore, strengthAfter, reviewedAt }
```

**Indexes:** `cards { userId, dueDate }` (the hot path for "due today"), `users { email } unique`.

---

## 4. AI extraction design

### Provider abstraction (the "easy to swap model" requirement)
```ts
interface AiProvider {
  extractCards(text: string): Promise<SuggestedCard[]>;
}
```
- Concrete `OpenAiProvider` reads `AI_MODEL` and `OPENAI_API_KEY` from env.
- A future `ClaudeProvider` (or any other) implements the same interface — swap by changing one env/DI binding. No controller/service changes.
- `.env`: `AI_VENDOR=openai`, `AI_MODEL=gpt-4o-mini`, `OPENAI_API_KEY=...`

### How extraction works
1. Backend receives pasted text (not stored).
2. Calls the model with a **system prompt** encoding your prefer/avoid rules.
3. Requests **structured JSON output** so the backend never parses prose.
4. Returns 10–15 cards max (hard cap ≤ 20) to enforce selectivity.

**Prefer:** reusable real-life sentences, conversation patterns, common verbs/expressions, reflexive verbs, separable verbs, prepositions, connectors, natural-speech phrasing, strong vocabulary.
**Avoid:** trivial sentences (unless genuinely useful), overly long sentences, hyper-specific/non-reusable lines, noise.

**Per-card output shape:**
```ts
type SuggestedCard = {
  german: string;
  translation: string;
  translationLang: 'es' | 'en';   // AI chooses; Spanish when unsure
  type?: string;                   // grammar/category tag
};
```

---

## 5. Review / game mode + scheduling

### Session flow
1. "Start review" → pick up to **20 due cards** (`dueDate <= now`, oldest/weakest first; new cards weighted in).
2. Show **German only** → **TTS auto-plays** the German (if enabled).
3. Tap to **reveal translation**.
4. Rate: **Again / Good / Easy**.
5. Next card → after 20, **completion screen** → "Another round" or stop.

### Strength → interval ladder (0–5)
| Strength | Next review |
|---|---|
| 0 | today |
| 1 | +1 day |
| 2 | +3 days |
| 3 | ~1 week |
| 4 | ~2 weeks |
| 5 | ~1 month |

### Rating → strength transitions
- **Again** → strength stays **0** (`dueDate = today`), and the card is **sent to the back of the current session's queue**. You finish the rest of the cards first; since it's still strength 0, it reappears at the end of the same session. Simple "move to the back of the line" — no complex re-injection logic.
- **Good** → strength + 1 (capped at 5).
- **Easy** → strength + 2 (capped at 5).
- **Decay:** when a card is reviewed and was heavily overdue, drop strength by 1 so forgotten cards resurface. (Simplified SM-2 — predictable, no heavy math.)

> **Session queue rule:** the session holds an in-memory ordered list of cards. "Again" pushes the card to the tail; "Good"/"Easy" remove it from the session. The session ends when the queue is empty (or you stop). This keeps the "repeat it, but after the others" behavior without any scheduler complexity.

New cards start at strength 0 → appear immediately/often, exactly as you wanted.

> The exact transition function is intentionally small and isolated (one pure function) so it's trivial to tune or A/B later.

---

## 6. Audio

- **Phase 1 of audio:** browser **Web Speech API** (`SpeechSynthesis`) with a German (`de-DE`) voice. Zero cost, zero backend.
- Manual **replay** button + **auto-play setting** (stored on `user.settings.autoPlayAudio`).
- **Later:** swap in AI-generated voices behind a similar abstraction if browser TTS quality isn't enough.

---

## 7. Dashboard

Simple, motivating, glanceable:
- Cards **due today** (the call-to-action number)
- **Total** saved cards
- **New** cards (strength 0)
- **Learned** cards (strength 5)
- Cards **needing reinforcement** (low strength / overdue)
- **Lessons added** count
- Primary buttons: **Add lesson** · **Start review**

---

## 8. Authentication

- Email + password, **JWT** (access token; refresh later if needed).
- Passwords hashed with **bcrypt/argon2**.
- NestJS **auth guard** on all data routes; every card/lesson query is scoped by `userId` so users only ever see their own data.
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.

---

## 9. API surface (first cut)

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | create account |
| POST | `/auth/login` | get JWT |
| POST | `/auth/logout` | invalidate client session |
| GET | `/auth/me` | current user |
| POST | `/lessons/analyze` | send pasted text → returns suggested cards (nothing saved) |
| POST | `/cards/bulk` | save selected/edited cards + create lesson metadata |
| GET | `/cards` | list user's cards |
| GET | `/review/session` | get ~20 due cards |
| POST | `/review/:cardId/rate` | submit Again/Good/Easy → update strength + dueDate |
| GET | `/stats` | dashboard numbers |

---

## 10. Development plan — phases

### Phase 0 — Foundation
- pnpm workspaces + Turborepo, `apps/web`, `apps/api`, `packages/shared`.
- Docker Compose for MongoDB. One `pnpm dev` command. Lint/format/TS configs.
- **Done when:** both apps boot together and the API connects to Mongo.

### Phase 1 — Auth
- Register/login/logout, JWT, password hashing, auth guard, per-user scoping.
- Minimal protected page in the frontend.
- **Done when:** two separate accounts cannot see each other's data.

### Phase 2 — Add Lesson + AI extraction + review-before-save ⭐ core value
- `AiProvider` abstraction + `OpenAiProvider` (`gpt-4o-mini`, env-driven).
- "Add lesson" page: paste → Analyze → **list** of suggestions, all selected by default, inline edit, select/deselect → Save selected.
- Raw text discarded; lesson metadata + chosen cards saved.
- **Done when:** a pasted conversation becomes saved cards you curated.

### Phase 3 — Review / game mode + scheduler ⭐ daily habit
- Session of 20, German-first, tap-to-reveal, 3-button rating, completion screen, "another round".
- Strength/interval engine (pure function) + due-card selection.
- Mobile-first, one-handed layout.
- **Done when:** you can run real daily review sessions on your phone.

### Phase 4 — Dashboard + stats
- Aggregations for the dashboard numbers; `reviewLogs` for history.

### Phase 5 — Audio + PWA polish
- Browser TTS + auto-play setting.
- PWA manifest, installable, offline shell, performance polish.

---

## 11. Build first vs. later

- **Build first (MVP):** Phases 0 → 1 → 2 → 3. That alone is a genuinely useful product: add a class, curate cards, review on mobile.
- **Can wait:** Dashboard stats (Phase 4), audio + PWA/offline (Phase 5), AI-generated voices, refresh tokens, multi-language UI, tag-based filtering, import/export.

---

## 12. Open questions for later (not blocking)
- Cap total new cards introduced per day to avoid overload? (Possible future setting.)
- Do you want a "leech" flag for cards you keep failing, to surface them for editing?
