"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import {
  buildDraftRows,
  findLastCompletedPick,
  findOnClockPick,
  nextAvailablePlayer,
  teamOrderNames,
} from "./draftEngine";
import type {
  CurrentUser,
  DraftPick,
  DraftState,
  LeagueSettings,
  Player,
  Team,
  TeamMusic,
  TeamQueueItem,
  TeamRoundPref,
} from "./types";

const CURRENT_USER_KEY = "fg2_currentUser";

interface DraftDataValue {
  loading: boolean;
  leagueSettings: LeagueSettings | null;
  teams: Team[];
  players: Player[];
  draftPicks: DraftPick[];
  draftState: DraftState | null;
  teamQueues: Record<number, TeamQueueItem[]>;
  teamRoundPrefs: Record<number, TeamRoundPref[]>;
  teamMusic: Record<number, TeamMusic>;
  currentUser: CurrentUser;
  onClockPick: DraftPick | null;
  draftedPlayerIds: Set<number>;

  // auth
  claimTeam: (teamId: number) => Promise<{ ok: boolean; error?: string }>;
  setCurrentUser: (user: CurrentUser) => void;
  logout: () => void;
  isAdmin: () => boolean;
  canActFor: (teamId: number) => boolean;

  // draft actions
  draftPlayer: (playerId: number, isAuto?: boolean) => Promise<void>;
  draftPlayerForTeam: (teamId: number, playerId: number) => Promise<{ ok: boolean; error?: string }>;
  undoLastPick: () => Promise<void>;
  autoDraftOnClock: () => Promise<void>;
  applyDraftOrderAndType: (opts: {
    orderedTeamIds: number[];
    draftType: LeagueSettings["draft_type"];
    customDirections: Record<string, "forward" | "reverse">;
    totalRounds: number;
  }) => Promise<void>;
  startDraft: () => Promise<void>;

  // clock
  pauseClock: () => Promise<void>;
  resumeClock: () => Promise<void>;

  // settings / config
  updateLeagueSettings: (patch: Partial<LeagueSettings>) => Promise<void>;
  updateTeam: (teamId: number, patch: Partial<Team>) => Promise<void>;
  addTeam: (name: string) => Promise<void>;
  removeTeam: (teamId: number) => Promise<void>;
  reorderTeams: (orderedTeamIds: number[]) => Promise<void>;

  // queues
  addToQueue: (teamId: number, playerId: number) => Promise<void>;
  removeFromQueue: (teamId: number, playerId: number) => Promise<void>;
  moveInQueue: (teamId: number, playerId: number, direction: "up" | "down") => Promise<void>;
  setRoundPref: (teamId: number, round: number, pos: string) => Promise<void>;

  // players / CSV
  replacePlayerPool: (rows: { name: string; pos: string; nfl_team: string }[]) => Promise<void>;

  // music
  uploadTeamMusic: (teamId: number, file: File) => Promise<void>;
  removeTeamMusic: (teamId: number) => Promise<void>;
}

const DraftDataContext = createContext<DraftDataValue | null>(null);

export function DraftDataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [teamQueueRows, setTeamQueueRows] = useState<TeamQueueItem[]>([]);
  const [teamRoundPrefRows, setTeamRoundPrefRows] = useState<TeamRoundPref[]>([]);
  const [teamMusicRows, setTeamMusicRows] = useState<TeamMusic[]>([]);
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(null);

  const teamsRef = useRef(teams);
  teamsRef.current = teams;
  const draftPicksRef = useRef(draftPicks);
  draftPicksRef.current = draftPicks;
  const leagueSettingsRef = useRef(leagueSettings);
  leagueSettingsRef.current = leagueSettings;
  const teamQueueRowsRef = useRef(teamQueueRows);
  teamQueueRowsRef.current = teamQueueRows;
  const teamRoundPrefRowsRef = useRef(teamRoundPrefRows);
  teamRoundPrefRowsRef.current = teamRoundPrefRows;
  const draftStateRef = useRef(draftState);
  draftStateRef.current = draftState;
  const playersRef = useRef(players);
  playersRef.current = players;

  const refetch = useCallback(async (table: string) => {
    switch (table) {
      case "league_settings": {
        const { data } = await supabase.from("league_settings").select("*").eq("id", 1).maybeSingle();
        if (data) setLeagueSettings(data as LeagueSettings);
        break;
      }
      case "teams": {
        const { data } = await supabase.from("teams").select("*").order("sort_order");
        if (data) setTeams(data as Team[]);
        break;
      }
      case "players": {
        const { data } = await supabase.from("players").select("*").order("overall_rank");
        if (data) setPlayers(data as Player[]);
        break;
      }
      case "draft_picks": {
        const { data } = await supabase.from("draft_picks").select("*").order("overall");
        if (data) setDraftPicks(data as DraftPick[]);
        break;
      }
      case "draft_state": {
        const { data } = await supabase.from("draft_state").select("*").eq("id", 1).maybeSingle();
        if (data) setDraftState(data as DraftState);
        break;
      }
      case "team_queue": {
        const { data } = await supabase.from("team_queue").select("*").order("sort_order");
        if (data) setTeamQueueRows(data as TeamQueueItem[]);
        break;
      }
      case "team_round_prefs": {
        const { data } = await supabase.from("team_round_prefs").select("*");
        if (data) setTeamRoundPrefRows(data as TeamRoundPref[]);
        break;
      }
      case "team_music": {
        const { data } = await supabase.from("team_music").select("*");
        if (data) setTeamMusicRows(data as TeamMusic[]);
        break;
      }
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        setCurrentUserState(JSON.parse(stored));
      } catch {
        // ignore malformed stored value
      }
    }

    (async () => {
      await Promise.all(
        [
          "league_settings",
          "teams",
          "players",
          "draft_picks",
          "draft_state",
          "team_queue",
          "team_round_prefs",
          "team_music",
        ].map(refetch)
      );
      setLoading(false);
    })();

    const channel = supabase
      .channel("draft-data-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "league_settings" }, () => refetch("league_settings"))
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => refetch("teams"))
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => refetch("players"))
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_picks" }, () => refetch("draft_picks"))
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_state" }, () => refetch("draft_state"))
      .on("postgres_changes", { event: "*", schema: "public", table: "team_queue" }, () => refetch("team_queue"))
      .on("postgres_changes", { event: "*", schema: "public", table: "team_round_prefs" }, () => refetch("team_round_prefs"))
      .on("postgres_changes", { event: "*", schema: "public", table: "team_music" }, () => refetch("team_music"))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentUser = useCallback((user: CurrentUser) => {
    setCurrentUserState(user);
    if (user) window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  const logout = useCallback(() => setCurrentUser(null), [setCurrentUser]);

  const claimTeam = useCallback(
    async (teamId: number) => {
      // No exclusivity here on purpose — this is a trusted, private league.
      // "claimed" is just an informational status, not a lock. Anyone can
      // tap into any team at any time (e.g. logging back into their own
      // team after logging out), regardless of its current claimed state.
      await supabase
        .from("teams")
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq("id", teamId);

      setCurrentUser({ type: "team", teamId });
      return { ok: true };
    },
    [setCurrentUser]
  );

  const isAdmin = useCallback(() => {
    if (currentUser?.type === "admin") return true;
    if (currentUser?.type === "team") {
      const team = teamsRef.current.find((t) => t.id === currentUser.teamId);
      return !!team?.is_admin;
    }
    return false;
  }, [currentUser]);

  const canActFor = useCallback(
    (teamId: number) => {
      if (isAdmin()) return true;
      return currentUser?.type === "team" && currentUser.teamId === teamId;
    },
    [currentUser, isAdmin]
  );

  const onClockPick = useMemo(
    () => (leagueSettings?.draft_started ? findOnClockPick(draftPicks) : null),
    [draftPicks, leagueSettings?.draft_started]
  );
  const draftedPlayerIds = useMemo(
    () => new Set(draftPicks.filter((p) => p.player_id != null).map((p) => p.player_id as number)),
    [draftPicks]
  );

  const advanceClockAfterPick = useCallback(async (completedOverall: number) => {
    const nextPick = draftPicksRef.current
      .filter((p) => p.player_id == null && p.overall !== completedOverall)
      .sort((a, b) => a.overall - b.overall)[0];
    await supabase
      .from("draft_state")
      .update({
        on_clock_overall: nextPick ? nextPick.overall : null,
        clock_started_at: nextPick ? new Date().toISOString() : null,
        clock_paused: false,
        paused_remaining_seconds: null,
      })
      .eq("id", 1);
  }, []);

  const draftPlayer = useCallback(
    async (playerId: number, isAuto = false) => {
      const pick = findOnClockPick(draftPicksRef.current);
      if (!pick) return;
      const { error, data } = await supabase
        .from("draft_picks")
        .update({ player_id: playerId, is_auto: isAuto, made_at: new Date().toISOString() })
        .eq("id", pick.id)
        .is("player_id", null)
        .select();
      if (error || !data || data.length === 0) return; // someone else already made this pick
      await supabase.from("team_queue").delete().eq("player_id", playerId);
      await advanceClockAfterPick(pick.overall);
    },
    [advanceClockAfterPick]
  );

  // Admin-only: draft a player for any team's next open pick, whether or not
  // that team is currently on the clock (e.g. an owner is AFK). Only resets
  // the running clock if the pick filled actually was the current on-the-clock
  // pick — filling some other team's future pick out of turn doesn't disturb
  // whoever's turn it currently is.
  const draftPlayerForTeam = useCallback(
    async (teamId: number, playerId: number) => {
      if (!isAdmin()) return { ok: false, error: "Admin only." };
      if (!leagueSettingsRef.current?.draft_started) return { ok: false, error: "Start the draft first." };

      const alreadyDrafted = draftPicksRef.current.some((p) => p.player_id === playerId);
      if (alreadyDrafted) return { ok: false, error: "That player is already drafted." };

      const targetPick = draftPicksRef.current
        .filter((p) => p.team_id === teamId && p.player_id == null)
        .sort((a, b) => a.overall - b.overall)[0];
      if (!targetPick) return { ok: false, error: "That team has no open picks left." };

      const currentOnClock = findOnClockPick(draftPicksRef.current);

      const { error, data } = await supabase
        .from("draft_picks")
        .update({ player_id: playerId, is_auto: false, made_at: new Date().toISOString() })
        .eq("id", targetPick.id)
        .is("player_id", null)
        .select();
      if (error) return { ok: false, error: error.message };
      if (!data || data.length === 0) return { ok: false, error: "That pick was just made — try again." };

      await supabase.from("team_queue").delete().eq("player_id", playerId);

      if (currentOnClock && currentOnClock.overall === targetPick.overall) {
        await advanceClockAfterPick(targetPick.overall);
      }
      return { ok: true };
    },
    [isAdmin, advanceClockAfterPick]
  );

  const undoLastPick = useCallback(async () => {
    if (!isAdmin()) return;
    const last = findLastCompletedPick(draftPicksRef.current);
    if (!last) return;
    await supabase
      .from("draft_picks")
      .update({ player_id: null, is_auto: false, made_at: null })
      .eq("id", last.id);
    await supabase
      .from("draft_state")
      .update({
        on_clock_overall: last.overall,
        clock_started_at: new Date().toISOString(),
        clock_paused: false,
        paused_remaining_seconds: null,
      })
      .eq("id", 1);
  }, [isAdmin]);

  const autoDraftOnClock = useCallback(async () => {
    const pick = findOnClockPick(draftPicksRef.current);
    if (!pick) return;
    const drafted = new Set(draftPicksRef.current.filter((p) => p.player_id != null).map((p) => p.player_id as number));
    const queue = teamQueueRowsRef.current.filter((q) => q.team_id === pick.team_id).sort((a, b) => a.sort_order - b.sort_order);
    const prefRow = teamRoundPrefRowsRef.current.find((r) => r.team_id === pick.team_id && r.round === pick.round);
    const wantedPos = prefRow?.preferred_pos && prefRow.preferred_pos !== "BPA" ? prefRow.preferred_pos : null;
    const playersById = new Map(playersRef.current.map((p) => [p.id, p]));

    let chosenId: number | null = null;

    if (wantedPos) {
      const queuedAtPos = queue.map((q) => playersById.get(q.player_id)).find((p) => p && !drafted.has(p.id) && p.pos === wantedPos);
      chosenId = queuedAtPos?.id ?? nextAvailablePlayer(playersRef.current, drafted, wantedPos)?.id ?? null;
    } else {
      const queuedAny = queue.map((q) => playersById.get(q.player_id)).find((p) => p && !drafted.has(p.id));
      chosenId = queuedAny?.id ?? null;
    }

    if (chosenId == null) {
      chosenId = nextAvailablePlayer(playersRef.current, drafted)?.id ?? null;
    }

    if (chosenId != null) await draftPlayer(chosenId, true);
  }, [draftPlayer]);

  const applyDraftOrderAndType = useCallback(
    async ({
      orderedTeamIds,
      draftType,
      customDirections,
      totalRounds,
    }: {
      orderedTeamIds: number[];
      draftType: LeagueSettings["draft_type"];
      customDirections: Record<string, "forward" | "reverse">;
      totalRounds: number;
    }) => {
      // persist round-1 order onto teams.sort_order
      for (let i = 0; i < orderedTeamIds.length; i++) {
        await supabase.from("teams").update({ sort_order: i }).eq("id", orderedTeamIds[i]);
      }

      const rows = buildDraftRows(orderedTeamIds, totalRounds, draftType, customDirections);

      await supabase.from("draft_picks").delete().gt("id", 0);
      const CHUNK = 200;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await supabase.from("draft_picks").insert(rows.slice(i, i + CHUNK));
      }

      // draft_started resets to false here on purpose — (re)configuring the
      // order/type/rounds always requires an explicit "Start Draft" afterward,
      // even if the draft was already live before this was called.
      await supabase
        .from("league_settings")
        .update({ draft_type: draftType, custom_directions: customDirections, total_rounds: totalRounds, draft_started: false })
        .eq("id", 1);

      await supabase
        .from("draft_state")
        .update({
          on_clock_overall: null,
          clock_started_at: null,
          clock_paused: false,
          paused_remaining_seconds: null,
        })
        .eq("id", 1);
    },
    []
  );

  const startDraft = useCallback(async () => {
    if (!isAdmin()) return;
    const firstPick = [...draftPicksRef.current].sort((a, b) => a.overall - b.overall)[0];
    if (!firstPick) return; // nothing generated yet — Apply Draft Order & Type first

    await supabase.from("league_settings").update({ draft_started: true }).eq("id", 1);
    await supabase
      .from("draft_state")
      .update({
        on_clock_overall: firstPick.overall,
        clock_started_at: new Date().toISOString(),
        clock_paused: false,
        paused_remaining_seconds: null,
      })
      .eq("id", 1);
  }, [isAdmin]);

  const pauseClock = useCallback(async () => {
    if (!isAdmin()) return;
    const state = draftStateRef.current;
    const settings = leagueSettingsRef.current;
    if (!state || !settings || !state.clock_started_at) return;
    const elapsed = (Date.now() - new Date(state.clock_started_at).getTime()) / 1000;
    const remaining = Math.max(0, settings.pick_clock_seconds - elapsed);
    await supabase
      .from("draft_state")
      .update({ clock_paused: true, paused_remaining_seconds: Math.round(remaining), clock_started_at: null })
      .eq("id", 1);
  }, [isAdmin]);

  const resumeClock = useCallback(async () => {
    if (!isAdmin()) return;
    const state = draftStateRef.current;
    const settings = leagueSettingsRef.current;
    if (!state || !settings) return;
    const remaining = state.paused_remaining_seconds ?? settings.pick_clock_seconds;
    const startedAt = new Date(Date.now() - (settings.pick_clock_seconds - remaining) * 1000).toISOString();
    await supabase
      .from("draft_state")
      .update({ clock_paused: false, clock_started_at: startedAt, paused_remaining_seconds: null })
      .eq("id", 1);
  }, [isAdmin]);

  const updateLeagueSettings = useCallback(async (patch: Partial<LeagueSettings>) => {
    await supabase.from("league_settings").update(patch).eq("id", 1);
  }, []);

  const updateTeam = useCallback(async (teamId: number, patch: Partial<Team>) => {
    await supabase.from("teams").update(patch).eq("id", teamId);
  }, []);

  const addTeam = useCallback(async (name: string) => {
    const maxOrder = teamsRef.current.length ? Math.max(...teamsRef.current.map((t) => t.sort_order)) + 1 : 0;
    await supabase.from("teams").insert({ name, sort_order: maxOrder });
    await supabase.from("league_settings").update({ num_teams: teamsRef.current.length + 1 }).eq("id", 1);
  }, []);

  const removeTeam = useCallback(async (teamId: number) => {
    await supabase.from("teams").delete().eq("id", teamId);
    await supabase
      .from("league_settings")
      .update({ num_teams: Math.max(1, teamsRef.current.length - 1) })
      .eq("id", 1);
  }, []);

  const reorderTeams = useCallback(async (orderedTeamIds: number[]) => {
    for (let i = 0; i < orderedTeamIds.length; i++) {
      await supabase.from("teams").update({ sort_order: i }).eq("id", orderedTeamIds[i]);
    }
  }, []);

  const addToQueue = useCallback(async (teamId: number, playerId: number) => {
    const existing = teamQueueRowsRef.current.filter((q) => q.team_id === teamId);
    const nextOrder = existing.length ? Math.max(...existing.map((q) => q.sort_order)) + 1 : 0;
    await supabase.from("team_queue").insert({ team_id: teamId, player_id: playerId, sort_order: nextOrder });
  }, []);

  const removeFromQueue = useCallback(async (teamId: number, playerId: number) => {
    await supabase.from("team_queue").delete().eq("team_id", teamId).eq("player_id", playerId);
  }, []);

  const moveInQueue = useCallback(async (teamId: number, playerId: number, direction: "up" | "down") => {
    const list = teamQueueRowsRef.current.filter((q) => q.team_id === teamId).sort((a, b) => a.sort_order - b.sort_order);
    const idx = list.findIndex((q) => q.player_id === playerId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    await supabase.from("team_queue").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("team_queue").update({ sort_order: a.sort_order }).eq("id", b.id);
  }, []);

  const setRoundPref = useCallback(async (teamId: number, round: number, pos: string) => {
    await supabase.from("team_round_prefs").upsert({ team_id: teamId, round, preferred_pos: pos });
  }, []);

  const replacePlayerPool = useCallback(async (rows: { name: string; pos: string; nfl_team: string }[]) => {
    await supabase.from("players").delete().gt("id", 0);
    const withRank = rows.map((r, i) => ({ ...r, overall_rank: i + 1 }));
    const CHUNK = 200;
    for (let i = 0; i < withRank.length; i += CHUNK) {
      await supabase.from("players").insert(withRank.slice(i, i + CHUNK));
    }
  }, []);

  const uploadTeamMusic = useCallback(async (teamId: number, file: File) => {
    const path = `team-${teamId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("team-music").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("team-music").getPublicUrl(path);
    await supabase
      .from("team_music")
      .upsert({ team_id: teamId, storage_path: path, filename: file.name, public_url: pub.publicUrl });
  }, []);

  const removeTeamMusic = useCallback(async (teamId: number) => {
    const existing = teamMusicRows.find((m) => m.team_id === teamId);
    if (existing) await supabase.storage.from("team-music").remove([existing.storage_path]);
    await supabase.from("team_music").delete().eq("team_id", teamId);
  }, [teamMusicRows]);

  const teamQueues = useMemo(() => {
    const map: Record<number, TeamQueueItem[]> = {};
    for (const row of teamQueueRows) {
      (map[row.team_id] ??= []).push(row);
    }
    for (const key of Object.keys(map)) map[Number(key)].sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [teamQueueRows]);

  const teamRoundPrefs = useMemo(() => {
    const map: Record<number, TeamRoundPref[]> = {};
    for (const row of teamRoundPrefRows) {
      (map[row.team_id] ??= []).push(row);
    }
    return map;
  }, [teamRoundPrefRows]);

  const teamMusic = useMemo(() => {
    const map: Record<number, TeamMusic> = {};
    for (const row of teamMusicRows) map[row.team_id] = row;
    return map;
  }, [teamMusicRows]);

  const value: DraftDataValue = {
    loading,
    leagueSettings,
    teams,
    players,
    draftPicks,
    draftState,
    teamQueues,
    teamRoundPrefs,
    teamMusic,
    currentUser,
    onClockPick,
    draftedPlayerIds,
    claimTeam,
    setCurrentUser,
    logout,
    isAdmin,
    canActFor,
    draftPlayer,
    draftPlayerForTeam,
    undoLastPick,
    autoDraftOnClock,
    applyDraftOrderAndType,
    startDraft,
    pauseClock,
    resumeClock,
    updateLeagueSettings,
    updateTeam,
    addTeam,
    removeTeam,
    reorderTeams,
    addToQueue,
    removeFromQueue,
    moveInQueue,
    setRoundPref,
    replacePlayerPool,
    uploadTeamMusic,
    removeTeamMusic,
  };

  return <DraftDataContext.Provider value={value}>{children}</DraftDataContext.Provider>;
}

export function useDraftData(): DraftDataValue {
  const ctx = useContext(DraftDataContext);
  if (!ctx) throw new Error("useDraftData must be used within a DraftDataProvider");
  return ctx;
}

export function useTeamOrderIds(): number[] {
  const { teams } = useDraftData();
  return useMemo(() => teamOrderNames(teams), [teams]);
}