# Refreshing the Lead Desk suppression hashes

The Lead Desk (IQ-EQ) and FundOpsHQ datasets must never be joined. The
outreach pipeline still has to avoid Lead Desk contacts, so it checks a
hash list. Refresh it like this (Claude does this via the Supabase MCP;
no Lead Desk credential is ever placed in the website's environment):

1. In the Lead Desk project (`danny-lead-crm`), compute hashes server-side so
   only hashes leave that database:

   ```sql
   select distinct encode(sha256(lower(trim(email))::bytea), 'hex') as hash
   from <people table> where email is not null and email <> '';
   ```

2. Insert them into `outreach_suppression_hashes` in the FundOpsHQ project
   (`reolugphmfmlwelnnvet`) with `on conflict (hash) do nothing`.

Run it weekly, or after any large Lead Desk import. Rows are never deleted
automatically; a contact who leaves Lead Desk stays suppressed, which is the
safe direction.
