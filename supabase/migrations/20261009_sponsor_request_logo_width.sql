-- The width a request's logo is drawn at in the email, worked out from the file's own shape when it
-- is uploaded (lib/sponsor/packages.ts emailLogoWidth), so the booking draws it as the preview did.
alter table public.sponsor_requests add column if not exists logo_width integer;
