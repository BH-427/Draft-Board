import type { DraftPick, DraftType, Player, RosterCounts, Team } from "./types";

/**
 * Computes the pick order (array of team ids) for a given round, honoring the
 * league's draft type. `baseOrder` is the round-1 order (team ids, index 0 = pick 1).
 */
export function computeOrderForRound(
  round: number,
  baseOrder: number[],
  draftType: DraftType,
  customDirections: Record<string, "forward" | "reverse">
): number[] {
  if (draftType === "linear") {
    return baseOrder.slice();
  }
  if (draftType === "custom") {
    const dir = customDirections[String(round)] || (round % 2 === 1 ? "forward" : "reverse");
    return dir === "reverse" ? baseOrder.slice().reverse() : baseOrder.slice();
  }
  // snake (default): odd rounds forward, even rounds reversed
  return round % 2 === 1 ? baseOrder.slice() : baseOrder.slice().reverse();
}

export interface NewDraftPickRow {
  round: number;
  pick_in_round: number;
  overall: number;
  team_id: number;
  player_id: null;
  is_auto: false;
  made_at: null;
}

/**
 * Generates every empty draft_picks row for the whole draft, in the order the
 * draft will run. Used by the admin's "Apply Draft Order & Type" action, which
 * replaces the entire draft_picks table (this resets any picks already made).
 */
export function buildDraftRows(
  baseOrder: number[],
  totalRounds: number,
  draftType: DraftType,
  customDirections: Record<string, "forward" | "reverse">
): NewDraftPickRow[] {
  const rows: NewDraftPickRow[] = [];
  let overall = 0;
  const numTeams = baseOrder.length;

  for (let round = 1; round <= totalRounds; round++) {
    const order = computeOrderForRound(round, baseOrder, draftType, customDirections);
    for (let i = 0; i < numTeams; i++) {
      overall++;
      rows.push({
        round,
        pick_in_round: i + 1,
        overall,
        team_id: order[i],
        player_id: null,
        is_auto: false,
        made_at: null,
      });
    }
  }
  return rows;
}

export function findOnClockPick(picks: DraftPick[]): DraftPick | null {
  let onClock: DraftPick | null = null;
  for (const p of picks) {
    if (p.player_id == null) {
      if (!onClock || p.overall < onClock.overall) onClock = p;
    }
  }
  return onClock;
}

export function findLastCompletedPick(picks: DraftPick[]): DraftPick | null {
  let last: DraftPick | null = null;
  for (const p of picks) {
    if (p.player_id != null) {
      if (!last || p.overall > last.overall) last = p;
    }
  }
  return last;
}

export function nextAvailablePlayer(players: Player[], draftedIds: Set<number>, pos?: string): Player | null {
  const candidates = players
    .filter((p) => (!pos || p.pos === pos) && !draftedIds.has(p.id))
    .sort((a, b) => a.overall_rank - b.overall_rank);
  return candidates[0] ?? null;
}

export interface RosterSlotFill {
  slotLabel: string; // 'QB', 'RB', 'FLEX', 'BN', etc.
  pick: DraftPick | null; // the pick filling this slot, or null if still open
}

const STARTER_ORDER: (keyof RosterCounts)[] = ["QB", "RB", "WR", "TE", "FLEX", "DST", "K"];

/**
 * Fills starter slots (in STARTER_ORDER, FLEX accepts RB/WR/TE) from a team's
 * completed picks (sorted by overall), then fills bench slots with whatever's
 * left, up to totalRounds picks total.
 */
export function fillRosterSlots(
  teamPicks: DraftPick[],
  playersById: Map<number, Player>,
  rosterCounts: RosterCounts,
  totalRounds: number
): RosterSlotFill[] {
  const sorted = [...teamPicks].filter((p) => p.player_id != null).sort((a, b) => a.overall - b.overall);
  const remaining = [...sorted];
  const slots: RosterSlotFill[] = [];

  for (const posKey of STARTER_ORDER) {
    const count = rosterCounts[posKey] ?? 0;
    for (let i = 0; i < count; i++) {
      const idx = remaining.findIndex((pick) => {
        const player = playersById.get(pick.player_id!);
        if (!player) return false;
        if (posKey === "FLEX") return player.pos === "RB" || player.pos === "WR" || player.pos === "TE";
        return player.pos === posKey;
      });
      if (idx > -1) {
        slots.push({ slotLabel: posKey, pick: remaining[idx] });
        remaining.splice(idx, 1);
      } else {
        slots.push({ slotLabel: posKey, pick: null });
      }
    }
  }

  const starterCount = slots.length;
  const benchCount = Math.max(0, totalRounds - starterCount);
  for (let i = 0; i < benchCount; i++) {
    slots.push({ slotLabel: "BN", pick: remaining.shift() ?? null });
  }

  return slots;
}

export function benchCountFor(rosterCounts: RosterCounts, totalRounds: number): number {
  const starters = STARTER_ORDER.reduce((sum, k) => sum + (rosterCounts[k] ?? 0), 0);
  return Math.max(0, totalRounds - starters);
}

export function starterCountFor(rosterCounts: RosterCounts): number {
  return STARTER_ORDER.reduce((sum, k) => sum + (rosterCounts[k] ?? 0), 0);
}

export function teamOrderNames(teams: Team[]): number[] {
  return [...teams].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.id);
}

export interface TeamPositionGroup {
  pos: string;
  picks: DraftPick[];
}

const RESULTS_POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DST"];

/**
 * Groups a team's completed picks by the player's literal position (QB/RB/WR/TE/K/DST),
 * in that fixed order, each group sorted by draft order. Used for the end-of-draft
 * results view — unlike fillRosterSlots, this ignores starter/bench/FLEX distinctions.
 */
export function groupTeamPicksByPosition(
  teamPicks: DraftPick[],
  playersById: Map<number, Player>
): TeamPositionGroup[] {
  const completed = [...teamPicks].filter((p) => p.player_id != null).sort((a, b) => a.overall - b.overall);
  const groups = new Map<string, DraftPick[]>();
  for (const pick of completed) {
    const pos = playersById.get(pick.player_id!)?.pos ?? "Other";
    (groups.get(pos) ?? groups.set(pos, []).get(pos)!).push(pick);
  }
  const ordered: TeamPositionGroup[] = [];
  for (const pos of RESULTS_POS_ORDER) {
    const picks = groups.get(pos);
    if (picks) {
      ordered.push({ pos, picks });
      groups.delete(pos);
    }
  }
  for (const [pos, picks] of groups) ordered.push({ pos, picks });
  return ordered;
}
