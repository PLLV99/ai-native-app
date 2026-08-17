# Security

Notes on the security posture of this project — what is enforced, how, and
what is deliberately out of scope.

This is a learning project built alongside a Next.js 16 course. After
finishing the course material I reviewed my own code and found several
issues that would have blocked a real deployment. This document records
what I found, what I changed, and what I knowingly left undone.

---

## Threat model

The application handles user accounts, so the assets worth protecting are:

| Asset | Why it matters |
|---|---|
| Session tokens | Grant full access to an account |
| Password hashes | Reused passwords compromise other services |
| TOTP secrets and backup codes | Bypass the second factor |
| OAuth client secrets | Impersonate the application to providers |
| Admin role membership | Privilege escalation to full user management |
| OpenAI API key | Direct financial cost when abused |

Assumed attacker: an unauthenticated remote user who can send arbitrary
HTTP requests, has read the source, and knows every route path. Not in
scope: an attacker with local disk access or database credentials.

---

## Authentication and authorization

**Sessions** are issued and verified by Better Auth, backed by Prisma and
PostgreSQL. Session lifetime is 7 days with a 1 day refresh window.

**Pages** under the `(main)` route group are protected in
`app/(main)/layout.tsx`. The session is resolved server side and the
request is redirected when it is absent, so every page below it is
protected by default rather than opting in one at a time.

**Route handlers do not inherit that guard.** Layouts do not run for route
handlers, and this project has no `proxy.ts`. Each handler under `app/api`
therefore resolves the session itself. This was the most significant issue
found during review: `app/api/users` originally had no authentication at
all, on the assumption that being inside the app made it protected.

Middleware was intentionally not used as the authorization boundary. The
Next.js documentation is explicit about this:

> Proxy is not intended for slow data fetching. While Proxy can be helpful
> for optimistic checks such as permission-based redirects, it should not
> be used as a full session management or authorization solution.

Two further reasons informed that decision. Proxy may be deployed to a CDN
separately from the application runtime, so it cannot be relied on to
share state with it. And the conventional negative matcher — 
`'/((?!api|_next/static|...).*)'` — excludes `/api` by default, which
means an API route can appear protected while receiving no coverage at
all.

**Roles** are stored by the Better Auth admin plugin as a single
comma-separated string on the user record, so a user may hold
`"admin,manager"`. Membership is therefore checked by splitting the value:

```ts
const roles = (session.user.role ?? "user").split(",").map((r) => r.trim())
if (!roles.includes("admin")) return forbidden()
```

Comparing the whole string with `!==` rejects legitimate admins who hold a
second role, and `.includes()` on the raw string matches `"administrator"`.
Both were present in the code before review.

`DELETE` on user resources additionally requires an admin role. Read
operations require only a session.

**Two-factor authentication** uses TOTP with `skipVerificationOnEnable`
left off, so a user must prove they can generate a valid code before 2FA
is switched on. Enabling and disabling both require the account password.

---

## Secrets

No credentials are committed. `.gitignore` covers `.env*`, and the full
history has been scanned for connection strings, OAuth secrets, API keys
and session tokens.

```bash
git grep -I -l -E "npg_|GOCSPX-|sk-[A-Za-z0-9]{20}" $(git rev-list --all)
```

`cookies.txt` — a curl cookie jar produced while testing the admin API —
is ignored as well. It contained a valid session token and was untracked,
one `git add .` away from being published.

`BETTER_AUTH_SECRET` signs session tokens, TOTP secrets and email
verification tokens. Rotating it invalidates every session and makes
existing TOTP secrets undecryptable, so an account with 2FA enabled is
locked out until its `twoFactor` row is cleared.

**Credentials are mostly shared between environments, which is a gap.**
GitHub is the exception — development and production use separate OAuth
applications, so revoking the production secret does not break local
development. Everything else (database, OpenAI key, mail account, and the
Google, LINE and Facebook OAuth clients) is one set used by local
development, the container, and the deployed app alike.

The consequence is honest to state: a credential leaked from a developer
machine reaches production, and testing runs against production data. The
fix is a second set of credentials and a separate database branch per
environment. It is listed in the known gaps below rather than described as
done.

---

## Input handling

Database access goes through Prisma, so ordinary queries are parameterized.
The one raw query in the project is the pgvector similarity search, which
uses a tagged template — values are bound, not interpolated:

```ts
await prisma.$queryRaw`
  SELECT id, content, 1 - (embedding <=> ${embeddingStr}::vector) AS similarity
  FROM document
  ORDER BY embedding <=> ${embeddingStr}::vector
  LIMIT ${topK}
`
```

`topK` reaches a SQL `LIMIT` and is clamped to a bounded range before use.
Left unbounded, a single request could ask the database for an arbitrary
number of rows.

Request bodies on the public and metered endpoints — contact, leads, chat,
search and role change — are validated with Zod schemas rather than
presence checks. `if (!name)` accepts an object, a ten megabyte string, and
text that is not an email address.

The remaining handlers, all admin-or-owner only, still parse the body
without a schema. Lower risk because a session is required to reach them,
but not the same guarantee — extending the schemas is open work.

---

## Cost and abuse

Endpoints that call the OpenAI API spend real money on every request, which
makes them a denial-of-wallet target rather than only a data risk. They
require a session and are rate limited per user id rather than per IP,
since addresses are shared behind NAT and trivially rotated.

The course material ships these endpoints with the authentication check
commented out and marked optional. It is not optional.

Authentication endpoints are rate limited more aggressively than the rest
of the API to slow credential stuffing against `/sign-in/email` and abuse
of the password reset mailer.

Rate limit state is kept in shared storage. An in-memory `Map` resets on
every restart, is not shared between container replicas, and is effectively
absent under serverless.

---

## Known gaps

Recorded rather than hidden. None of these are appropriate to skip for a
system holding real user data.

| Gap | Consequence | Why it is still open |
|---|---|---|
| No audit log | Admin actions leave no trail | Out of scope for the course; schema sketched but not built |
| No automated tests | Regressions are caught by hand | Planned next; role parsing is the first target |
| No account lockout | Rate limiting slows but does not stop credential stuffing | Needs a lockout and notification policy first |
| Admin cannot be prevented from every footgun | Server-side guards exist, but UI affordances lag | Guards added for self-demotion and last-admin removal |
| No secret rotation policy | Long-lived credentials | Manual rotation only |
| Error messages not fully normalized | Some responses differ enough to enumerate accounts | Needs an audit of every auth response path |
| **One credential set across environments** (GitHub OAuth excepted) | A leak from a developer machine reaches production; tests run against production data | Needs a second database branch and a duplicate set of provider credentials |
| **No error monitoring** | Production exceptions are only visible in platform logs, and nobody is watching them | Sentry is the intended fix; not wired up yet |
| **Facebook login restricted to app roles** | Anyone without a role on the Meta app cannot use that provider | Publishing requires Meta business verification and app review |

---

## Reporting

This is a personal learning project, deployed publicly at
https://ai-native-app-pllv99.vercel.app so it can be demonstrated. It holds
no real user data beyond the accounts created while testing it. If you are
reviewing it and spot something, please open an issue.
