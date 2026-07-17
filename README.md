# Field Goal Seekers 2 — Draft Board

A live, multi-user fantasy football draft board for a ~13-person league (12 team owners + 1
commissioner/admin). Everyone watches picks happen in real time, sets a queue of players to grab,
and the commissioner runs the draft from the Admin tab.

This is a small-scale tool for a private league — **it intentionally has no real authentication**
(see "A note on security" below). It's built to be cheap and simple to run once a year, not to be
commercially hardened.

## Stack

- **Next.js (App Router) + TypeScript**, deployed on **Vercel**.
- **Supabase**: Postgres for all league/draft data, Realtime for live sync across every device,
  Storage for team walk-up music files.

## One-time setup

### 1. Create the Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the contents of `supabase/migrations/0001_init.sql`. This creates
   every table, sets up (permissive) RLS policies, creates the `team-music` storage bucket, and
   seeds 12 placeholder teams plus the singleton `league_settings` / `draft_state` rows.
3. In Project Settings → API, copy the **Project URL** and **anon public key**.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the two values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with the email you plan to set as the
Draft Admin (see below) — until an admin email is configured, anyone can log in as admin so you
can finish setup.

### 4. Configure the league (Admin tab)

- **Team Owners** card: set the *Draft Admin Email* (your commissioner email) and each team's
  owner email. Owners log in by typing this exact email — there's no password.
- **Draft Order** card: rename the 12 placeholder teams to your real team names, and set the
  round-1 order.
- **Draft Type** card: pick snake / linear / custom, then hit **Apply Draft Order & Type**. This
  generates every pick slot for the whole draft — do this again any time the order/type/rounds
  change (it resets any picks already made, same as re-drafting from scratch).
- **Roster Requirements**: set starter slots per position and total rounds.
- **Rankings Upload**: upload your rankings CSV (e.g. `FantasyPros_2026_Draft_ALL_Rankings.csv`)
  — do this **before** the draft starts, ideally ~1 week out once rankings settle. Re-uploading
  after picks have been made will clear those picks' player references (you'll get a confirmation
  warning if you try).
- **Team Walk-Up Music** (optional): upload a song per team.

### 5. Deploy to Vercel

1. Push this repo to GitHub (see below) and import it in [vercel.com/new](https://vercel.com/new).
2. Add the same two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel project settings.
3. Deploy. Share the resulting URL with your league.

## Before draft day

- **Supabase plan**: a free-tier Supabase project pauses itself after a week of inactivity — check
  it's active a day or two before the draft. Free tier's Realtime connection limit comfortably
  covers 13 people, but if you want headroom (or want to avoid the pause-on-inactivity risk
  entirely on draft day), upgrading to the Pro plan for that month is the safe move.
- Do a practice run: open the app in two browser windows and make a pick in one — the other should
  update within a second or two without a refresh.

## A note on security

There's no real login system (no Supabase Auth, no passwords, no magic links) — logging in is
just typing an email that matches what's configured in the Team Owners card. Anyone who has the
deployed URL and knows an owner's email can act as that owner, and the Supabase anon key ships to
the browser with permissive read/write policies on every table. That's a deliberate tradeoff for a
trusted ~13-person league running one draft a year, not an oversight — see the migration file's
header comment for details. Don't reuse this schema/RLS setup for anything with real stakes or
strangers involved.

## Project structure

```
app/                  Next.js pages, layout, global (ported) styles
components/           UI components, grouped by tab (board/, players/, myteam/, admin/)
lib/                  Supabase client, draft engine logic, CSV parser, data provider/hooks
supabase/migrations/  Database schema, RLS policies, storage bucket, seed data
```
