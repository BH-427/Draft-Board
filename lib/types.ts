export type Pos = "QB" | "RB" | "WR" | "TE" | "K" | "FLEX" | "DST" | "BN";

export type DraftType = "snake" | "linear" | "custom";

export interface RosterCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  DST: number;
  K: number;
}

export interface LeagueSettings {
  id: number;
  league_name: string;
  num_teams: number;
  draft_type: DraftType;
  custom_directions: Record<string, "forward" | "reverse">;
  roster_counts: RosterCounts;
  total_rounds: number;
  pick_clock_enabled: boolean;
  pick_clock_seconds: number;
  music_muted: boolean;
  announcer_enabled: boolean;
  admin_email: string;
  draft_started: boolean;
}

export interface Team {
  id: number;
  name: string;
  owner_email: string | null;
  sort_order: number;
  claimed: boolean;
  claimed_at: string | null;
  is_admin: boolean;
}

export interface Player {
  id: number;
  name: string;
  pos: string;
  nfl_team: string;
  overall_rank: number;
}

export interface DraftPick {
  id: number;
  round: number;
  pick_in_round: number;
  overall: number;
  team_id: number;
  player_id: number | null;
  is_auto: boolean;
  made_at: string | null;
}

export interface DraftState {
  id: number;
  on_clock_overall: number | null;
  clock_started_at: string | null;
  clock_paused: boolean;
  paused_remaining_seconds: number | null;
}

export interface TeamQueueItem {
  id: number;
  team_id: number;
  player_id: number;
  sort_order: number;
}

export interface TeamRoundPref {
  team_id: number;
  round: number;
  preferred_pos: string; // position code, or 'BPA' for best-player-available
}

export interface TeamMusic {
  team_id: number;
  storage_path: string;
  filename: string;
  public_url: string;
}

export type CurrentUser = { type: "admin" } | { type: "team"; teamId: number } | null;