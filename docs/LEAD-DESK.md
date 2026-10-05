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
CRM_PASSWORD_HASH=scrypt:<salt>:<hash>
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
- Password verified with scrypt + `timingSafeEqual` in `lib/crm/password.ts` (Node runtime).
  The hash uses `:` separators, not `$` — dotenv expansion would treat `$salt`
  as a variable reference and silently blank it out.
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

## The grid

Defaults to **All**, sorted by date received. Every column header opens an
Excel-style filter — distinct values with counts, search, sort A→Z / Z→A —
and the value list honours the other active filters, so filtering narrows
what the next column offers. `Received` gets a date range with 7/30/90-day
presets instead.

Columns reorder by dragging a header. The two identity columns (checkbox and
Contact) are pinned to the left and are re-pinned on load even if a saved
layout says otherwise — the sticky left offsets depend on them being at 0 and 1.
The Columns panel carries ↑/↓ nudge buttons as the keyboard-reachable path, plus
Reset layout. Order and visibility persist per browser in `localStorage`
(`leaddesk.layout.v1`); columns added later keep their defaults rather than
disappearing.

`Domain` is the bare host (`bare_domain()` in SQL: no scheme, no `www.`) so it
can be pasted straight into a CRM search.

The Status column carries an inline checkbox: ticking it marks the lead done
and writes the contact_log row; unticking returns it to to-do and writes
nothing (un-marking is a correction, not work).

Notes are editable in the drawer — one field for the person, one for the firm
(`firms.notes`). Both are internal and neither is exportable.

## Staying fast as the desk grows

The desk gains a few hundred leads a night, so nothing here may cost more as
the history gets longer. Measured on 2026-10-05 at 3,477 leads: the page drew
every one (about 62,000 table cells and 10,000 copy buttons), sent 8.1 MB to
the browser, and redrew the whole table on each checkbox tick and each letter
typed. Four rules came out of that:

- **The table draws 200 rows at a time** (`PAGE_ROWS` in `DeskGrid.tsx`), with
  "Show 200 more" and "Show all" under it. Filters, chip counts, search,
  select-all and export still run over every lead. Select-all deliberately
  takes every matching row, drawn or not, so "To do → select all → Mark done"
  clears a batch longer than one page; the bulk bar says how many of the
  selected rows are further down.
- **The list carries grid columns only** (`GRID_COLUMNS` in
  `lib/crm/queries.ts`). Internal notes, firm notes and the research summary
  are read one lead at a time by `/api/desk/lead` when a row is opened. Add a
  column to `GRID_COLUMNS` only when the grid itself shows, filters or
  searches it.
- **Changes are applied in the browser, not by reloading.** Marking done or
  saving notes updates the rows already loaded; the Refresh button in the
  header is the one thing that reloads every lead from the CRM.
- **The notes box only appears once the lead's notes have loaded.** If that
  load fails the drawer says so and offers no box, so blank text can never be
  saved over real notes.

`fetchDeskRows` reads the first page with the total, then the remaining pages
side by side: two round trips however long the history is. Tests:
`app/desk/__tests__/DeskGrid.test.tsx` and `lib/crm/__tests__/queries.test.ts`.

Not done yet, and worth doing once the desk passes about 10,000 leads: load
open leads plus the last 30 days by default, with the older history on demand.

## Palette

Neutral black-and-white, deliberately. The original green-tinted palette put
done-row text at **3.7:1 — under the WCAG AA floor** — and once a batch is
worked every row reads "done", so that was the whole grid. Measured values on
`--surface #121212`:

| token       | hex       | ratio  |     |
| ----------- | --------- | ------ | --- |
| `--ink`     | `#FAFAFA` | 17.9:1 | AAA |
| `--inkSoft` | `#DEDEDE` | 13.9:1 | AAA |
| `--muted`   | `#ABABAB` | 8.2:1  | AAA |
| `--dim`     | `#8A8A8A` | 5.4:1  | AA  |
| `--accent`  | `#57D9A8` | 10.6:1 | AAA |

Done rows now keep readable text and let the Status pill carry the state, rather
than greying the entire row. Keep every colour on a token — if you add one,
measure it against `--surface` first.

## Exports

Two buttons, deliberately different files:

- **Export to Excel** — `desk_rows`, 34 columns including handling notes and
  who referred the lead. Sheet is named `Leads (INTERNAL)`. Never send it.
- **Export shareable** — `leads_shareable`, 10 columns. Source, priority,
  readiness, blocker, lead_ref and notes are not columns in that view, so they
  cannot appear in the file.

Both respect the current selection: tick rows and the export covers only those;
tick nothing and it covers everything.

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
app/api/desk/*                login, logout, work-state, export, contact-log, lead, notes
scripts/hash-desk-password.mjs
```
