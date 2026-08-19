-- ============================================================================
-- Scale-back for Saturday: replace email-matched team login with a simple
-- "tap your team to claim it" flow. owner_email is kept (harmless, unused by
-- login now) in case email-based features get revisited later.
-- ============================================================================

alter table teams add column if not exists claimed boolean not null default false;
alter table teams add column if not exists claimed_at timestamptz;
