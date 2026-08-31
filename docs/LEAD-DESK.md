# Lead Desk

Private CRM at **`/desk`** on fundopshq.com. Danny's IQ-EQ lead pipeline —
**completely separate from the FundOpsHQ product** apart from sharing this
Next.js app and domain.

> Rules, workflows and the promotion gate live in
> `~/projects/iqeq-outreach-june26/CLAUDE.md`. Read that before changing
> anything about how leads are qualified or exported.

## The two-database rule

|             | Project                                   | Client                                          |
| ----------- | ----------------------------------------- | ----------------------------------------------- |
| Public site | `fundops-intel` (`reolugphmfmlwelnnvet`)  | `getSupabaseAdmin()` — `lib/supabase/client.ts` |
| Lead Desk   | `danny-lead-crm` (`chyawefctesysoioxuwl`) | `getCrmAdmin()` — `lib/crm/supabase.ts`         |

They are separate projects on purpose. A service-role key bypasses RLS on every
table in its project, so co-locating would give the public site permanent,
unrevokable access to confidential lead data — referral-partner names, stealth
launches, people under non-compete.

**Never** point a FundOpsHQ code path at the CRM project, or `getCrmAdmin()` at
the site's project.

## Environment

```
CRM_SUPABASE_URL=https://chyawefctesysoioxuwl.supabase.co
CRM_SUPABASE_SERVICE_ROLE_KEY=<danny-lead-crm dashboard → Settings → API>
CRM_PASSWORD_HASH=scrypt$<salt>$<hash>
CRM_SESSION_SECRET=<32 random bytes, hex>
```

Generate the last two:

```bash
node scripts/hash-desk-password.mjs
```

The plaintext password is never stored — only the scrypt hash. Keep the password
in a password manager. Set all four in `.env.local` and in Vercel
(Production **and** Preview).

## Auth

Deliberately **not** Supabase Auth. For a single user it would add a signup
surface, a password-reset flow, and an anon key in the browser for no benefit.
Instead:

- `proxy.ts` gates `/desk/*` and `/api/desk/*` (Next 16 renamed `middleware` → `proxy`)
- Password verified with scrypt + `timingSafeEqual` in `lib/crm/password.ts` (Node runtime)
- Session is an HMAC-SHA256 token, 12h TTL, verified with Web Crypto in
  `lib/crm/session.ts` so it runs on the edge
- Cookie is `httpOnly`, `secure` in production, `sameSite=strict` — no Supabase
  key ever reaches the browser
- Login is rate limited to 8 attempts / 15 min per IP
- Every `/desk` response carries `X-Robots-Tag: noindex`, and `/desk/` is in
  `app/robots.ts`

Verified behavior: unauthenticated → 307 to login; API → 401; tampered or
unsigned cookie → rejected; public routes untouched.

## Data

Everything reads through views, so the rules live in SQL rather than in the app:

- **`desk_rows`** — the grid. Enforces the promotion gate: no disqualified
  firms, no parked leads, and nothing without a researched person and a real
  email address. If it has no address it is not a lead; it stays a `signals`
  row and is invisible here.
- **`leads_shareable`** — the ONLY source for a client-facing export. Source,
  priority, readiness, blocker, lead_ref and notes are not columns in that view,
  so they cannot leak. `/api/desk/export` reads it and nothing else.
- **`firm_suppression_status`** — the 9-month researched / 6-month contacted gate.

## Marking work done

Marking a lead done also writes a `contact_log` row. Without it the suppression
clock would start when the row appeared rather than when Danny actually worked
it, and the firm would resurface too early.

The bulk bar picks which event to log: `researched` (9-month window, the
default) or `contacted` (6-month window). Default is deliberately the
conservative direction — under-suppressing is recoverable, over-suppressing
hides real prospects silently.

## Files

```
proxy.ts                      auth gate, scoped to /desk + /api/desk
lib/crm/supabase.ts           CRM Supabase client (server only)
lib/crm/session.ts            HMAC session — Web Crypto, edge-safe
lib/crm/password.ts           scrypt — Node only, never import in proxy.ts
lib/crm/queries.ts            all data access
app/desk/page.tsx             server component, fetches desk_rows
app/desk/DeskGrid.tsx         the grid (client)
app/desk/login/page.tsx       login form
app/api/desk/*                login, logout, work-state, export, contact-log
scripts/hash-desk-password.mjs
```
