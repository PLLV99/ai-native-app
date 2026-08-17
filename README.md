# AI Native App

A full-stack Next.js 16 application with authentication, role-based access control, and a
retrieval-augmented chatbot that answers from documents you upload.

**Live demo → https://ai-native-app-pllv99.vercel.app**

Sign up with email and password, or sign in with Google, GitHub or LINE. There is no shared
demo account on purpose — the chat endpoint costs money per request, so access is tied to an
account and rate limited.

---

## What it does

| Area | What's there |
|---|---|
| **Auth** | Email + password, email verification, password reset, TOTP two-factor, and social login (Google, GitHub, LINE, Facebook) |
| **Authorization** | Three roles — `user`, `manager`, `admin` — with per-action permissions, not just a role string check |
| **Admin** | User management (create, edit, ban, impersonate, change role), knowledge base, LINE group config |
| **RAG chatbot** | Upload PDF/CSV/text → chunked → embedded → answers are grounded in the retrieved chunks, which come back with the response as `sources`. Streaming replies. |
| **Lead capture** | A form that stores to the database and pushes a LINE notification |
| **Contact form** | Forwards to an n8n workflow (Google Sheets → LINE → Gmail) |

## How it fits together

```
Browser
  │
  ├── /auth/*          Better Auth pages (sign in, 2FA, reset)
  ├── /chat            streaming chat UI
  ├── /admin/*         admin-only, guarded per route handler
  └── /management/*    manager and above
        │
        ▼
  Next.js route handlers  ── every handler checks the session itself
        │                    (layouts do not protect route handlers)
        │
        ├── rate limit  ─────► PostgreSQL   counter survives restarts and
        │                                   is shared across instances
        ├── Zod validation
        │
        ├── Prisma ──────────► Neon PostgreSQL + pgvector
        │                        users, sessions, chat history,
        │                        documents, 1536-dim embeddings
        │
        ├── OpenAI ──────────► text-embedding-3-small  (indexing + query)
        │                      gpt-4o-mini             (answers)
        │
        ├── LINE Messaging API ──► push notification on new lead
        └── n8n webhook ─────────► Sheets → LINE → Gmail
```

**RAG flow:** upload → `lib/document-loader.ts` extracts text → `lib/text-splitter.ts` chunks it
→ `lib/openai.ts` embeds each chunk → stored as `vector(1536)` in Postgres. At query time the
question is embedded and matched by cosine similarity in `lib/vector-search.ts`, and the top
matches become the context for the answer.

## Stack, and why

| Choice | Reason |
|---|---|
| **Next.js 16** (App Router) | Route handlers and server components in one codebase |
| **Better Auth** | Email, social, 2FA, and RBAC without stitching together separate libraries. Owns its own tables, so auth data is visible in the same database. |
| **Prisma 7 + Neon** | Typed queries; Neon's serverless Postgres suits Vercel's request model |
| **pgvector** | Embeddings live next to the relational data — no separate vector database to keep in sync for a corpus this size |
| **Zod** | One schema validates the request and types the handler |
| **Tailwind 4 + shadcn/ui** | Consistent components without hand-rolling a design system |

## Running it locally

Built and tested against Node 22 and pnpm 11 (pinned in `packageManager`). Needs a PostgreSQL
database with the `vector` extension — on Neon, `CREATE EXTENSION vector`.

```bash
pnpm install
```

Create `.env`:

```bash
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."          # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."

# optional — features degrade cleanly without them
GOOGLE_CLIENT_ID=""        GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""        GITHUB_CLIENT_SECRET=""
LINE_CLIENT_ID=""          LINE_CLIENT_SECRET=""        # LINE Login channel
LINE_CHANNEL_ACCESS_TOKEN="" LINE_CHANNEL_SECRET=""     # Messaging API channel — a different channel
LINE_GROUP_IDS=""
N8N_WEBHOOK_URL=""
SMTP_HOST="" SMTP_PORT="" GMAIL_USER="" GMAIL_APP_PASSWORD=""
```

```bash
pnpm exec prisma db push
pnpm dev
```

Then add `http://localhost:3000/api/auth/callback/<provider>` to each provider's console for
the social logins you want.

### Container

```bash
docker compose up -d
```

A four-stage build; `entrypoint.sh` syncs the Prisma schema before the server starts. The app
is served on port 8810. Podman works too — `docker-compose.yml` notes the two places its
behaviour differs.

## Layout

```
app/
  (auth)/        sign in, sign up, 2FA, verify, reset
  (landing)/     public page with lead and contact forms
  (main)/        authenticated app — chat, dashboard, admin, management
  api/           route handlers
lib/
  auth.ts            Better Auth config: providers, 2FA, RBAC, rate limit
  permissions.ts     role and action definitions
  rate-limit.ts      database-backed limiter for app endpoints
  validations.ts     Zod schemas
  rag-service.ts     retrieval and answer generation
  vector-search.ts   cosine similarity over pgvector
  ingestion.ts       chunk and embed pipeline
prisma/schema.prisma
scripts/
  ingest.ts          CLI to load documents/ into the knowledge base
  manual/            scripts that exercise one RAG stage each — not a test suite
```

## Security

The threat model and the decisions behind it are written up in [SECURITY.md](SECURITY.md).
Short version:

- **Route handlers check the session themselves.** Layouts do not run for route handlers, and
  the Next.js docs say proxy/middleware should not be the authorization boundary.
- **Rate limits live in PostgreSQL, not memory.** On serverless, an in-memory counter resets
  on every cold start and is not shared between instances, so it is not a limit at all.
  Public forms are limited per IP; endpoints that spend OpenAI credits are limited per user.
- **Zod validates the public and paid endpoints** — contact, leads, chat, search and role change —
  before anything reaches the database or a metered API. The remaining handlers are
  admin-or-owner only and still rely on the session check plus Prisma's typing; extending the
  schemas to cover them is open work.
- **Admin guards** prevent an admin from demoting themselves or removing the last admin.
- **No secrets in the repository.** `.env*` is gitignored and has never been committed.

## Known limitations

Written down deliberately rather than left to be discovered:

| Limitation | Why |
|---|---|
| **Facebook login only works for accounts with a role on the Meta app.** Use Google, GitHub, or email. | Making it public needs Meta business verification and app review — out of scope here |
| **The contact form stops working when the n8n trial ends (around 26 Aug 2026).** | The workflow runs on an n8n cloud trial; self-hosting it was out of scope |
| **No error monitoring.** Production exceptions are only visible in platform logs. | Sentry is the obvious next step — see `Day10 §6` in my notes |
| **No automated tests or CI.** | The highest-value next addition, and honestly the gap I'd close first |
| **Dev and production share most credentials.** GitHub is split into separate OAuth apps; the rest are not. | Correct fix is a separate credential set per environment |
| **Anonymous users can reach the streaming chat endpoint** (8 requests/min per IP). | Intentional, so the demo is usable without signing up. An OpenAI budget cap is the backstop. |

## Things that broke on the way to production

Four bugs stood between "works locally" and "works deployed", none of which were where the
symptom pointed. They're written up in my notes; the one worth repeating here:

Enabling Better Auth's database-backed rate limiter made it write through a model it calls
`rateLimit` — which resolved to the `RateLimit` model this project already had, with a
required `resetAt` field that Better Auth never sends. Prisma rejected every insert. Because
the rate limiter runs before anything else in the auth handler, *all* of `/api/auth/*`
returned an empty 500, and signing in failed without the password ever being checked. The
fix was to point Better Auth at its own model. Finding it meant reproducing locally and
reading the stack trace, rather than guessing from the symptom.
