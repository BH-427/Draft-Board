-- ============================================================================
-- Per-position queue ordering: lets a team drag-reorder their queue within
-- each position group, independent of the flat "Total Queue" order. Auto-draft
-- uses this order (instead of flat queue order) when a round has a preferred
-- position set.
-- ============================================================================

alter table team_queue add column if not exists pos_sort_order integer not null default 0;

-- Backfill: seed each team's per-position order from their existing flat
-- queue order, so the new "By Position" tab starts out matching what's
-- already there instead of every row tying at 0.
update team_queue tq
set pos_sort_order = sub.rn
from (
  select tq2.id, row_number() over (partition by tq2.team_id, p.pos order by tq2.sort_order) - 1 as rn
  from team_queue tq2
  join players p on p.id = tq2.player_id
) sub
where tq.id = sub.id;
