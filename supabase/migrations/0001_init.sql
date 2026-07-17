-- Field Goal Seekers 2 — Draft Board schema
--
-- This app is built for a trusted ~13-person league (12 team owners + 1 admin),
-- run once a year, with NO real authentication (login is a simple email-match
-- checked in the app, not Supabase Auth). RLS policies below are intentionally
-- PERMISSIVE — anyone holding the deployed URL and the public anon key can
-- read/write everything. That is an accepted tradeoff for this project, not an
-- oversight: see README.md.

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists league_settings (
  id int primary key default 1,
  league_name text not null default 'Field Goal Seekers 2',
  num_teams int not null default 12,
  draft_type text not null default 'snake' check (draft_type in ('snake', 'linear', 'custom')),
  custom_directions jsonb not null default '{}'::jsonb,
  roster_counts jsonb not null default '{"QB":1,"RB":2,"WR":2,"TE":1,"FLEX":1,"DST":1,"K":1}'::jsonb,
  total_rounds int not null default 15,
  pick_clock_enabled boolean not null default true,
  pick_clock_seconds int not null default 90,
  music_muted boolean not null default false,
  announcer_enabled boolean not null default false,
  admin_email text not null default '',
  constraint league_settings_singleton check (id = 1)
);

create table if not exists teams (
  id serial primary key,
  name text not null,
  owner_email text,
  sort_order int not null
);

create table if not exists players (
  id serial primary key,
  name text not null,
  pos text not null,
  nfl_team text not null default '',
  overall_rank int not null
);
create index if not exists players_overall_rank_idx on players (overall_rank);
create index if not exists players_pos_idx on players (pos);

create table if not exists draft_picks (
  id serial primary key,
  round int not null,
  pick_in_round int not null,
  overall int not null unique,
  team_id int not null references teams (id) on delete cascade,
  player_id int references players (id) on delete set null,
  is_auto boolean not null default false,
  made_at timestamptz
);
create index if not exists draft_picks_overall_idx on draft_picks (overall);
create index if not exists draft_picks_team_idx on draft_picks (team_id);

create table if not exists draft_state (
  id int primary key default 1,
  on_clock_overall int,
  clock_started_at timestamptz,
  clock_paused boolean not null default false,
  paused_remaining_seconds int,
  constraint draft_state_singleton check (id = 1)
);

create table if not exists team_queue (
  id serial primary key,
  team_id int not null references teams (id) on delete cascade,
  player_id int not null references players (id) on delete cascade,
  sort_order int not null,
  unique (team_id, player_id)
);
create index if not exists team_queue_team_idx on team_queue (team_id, sort_order);

create table if not exists team_round_prefs (
  team_id int not null references teams (id) on delete cascade,
  round int not null,
  preferred_pos text not null,
  primary key (team_id, round)
);

create table if not exists team_music (
  team_id int primary key references teams (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  public_url text not null
);

-- ============================================================================
-- Row Level Security — permissive (no real auth in this app; see note above)
-- ============================================================================

alter table league_settings enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table draft_picks enable row level security;
alter table draft_state enable row level security;
alter table team_queue enable row level security;
alter table team_round_prefs enable row level security;
alter table team_music enable row level security;

create policy "public full access" on league_settings for all using (true) with check (true);
create policy "public full access" on teams for all using (true) with check (true);
create policy "public full access" on players for all using (true) with check (true);
create policy "public full access" on draft_picks for all using (true) with check (true);
create policy "public full access" on draft_state for all using (true) with check (true);
create policy "public full access" on team_queue for all using (true) with check (true);
create policy "public full access" on team_round_prefs for all using (true) with check (true);
create policy "public full access" on team_music for all using (true) with check (true);

-- ============================================================================
-- Realtime
-- ============================================================================

alter publication supabase_realtime add table league_settings;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table draft_picks;
alter publication supabase_realtime add table draft_state;
alter publication supabase_realtime add table team_queue;
alter publication supabase_realtime add table team_round_prefs;
alter publication supabase_realtime add table team_music;

-- ============================================================================
-- Storage — walk-up music bucket
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('team-music', 'team-music', true)
on conflict (id) do nothing;

create policy "public read team-music" on storage.objects
  for select using (bucket_id = 'team-music');
create policy "public write team-music" on storage.objects
  for insert with check (bucket_id = 'team-music');
create policy "public update team-music" on storage.objects
  for update using (bucket_id = 'team-music');
create policy "public delete team-music" on storage.objects
  for delete using (bucket_id = 'team-music');

-- ============================================================================
-- Seed data
-- ============================================================================

insert into league_settings (id) values (1) on conflict (id) do nothing;
insert into draft_state (id) values (1) on conflict (id) do nothing;

insert into teams (name, owner_email, sort_order)
select name, null, sort_order
from (
  values
    ('Gridiron Ghosts', 0),
    ('Blitz Brigade', 1),
    ('Red Zone Renegades', 2),
    ('Turf Titans', 3),
    ('Hail Mary Heroes', 4),
    ('Sack Attack', 5),
    ('Pigskin Pirates', 6),
    ('End Zone Elites', 7),
    ('Fumble Force', 8),
    ('Rushing Rebels', 9),
    ('Deep Threats', 10),
    ('Goal Line Gang', 11)
) as seed(name, sort_order)
where not exists (select 1 from teams);
