"use client";

import { useMemo, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { findLastCompletedPick } from "@/lib/draftEngine";
import { useToast } from "@/components/Toast";

export function DraftControlsCard() {
  const {
    draftPicks,
    players,
    teams,
    leagueSettings,
    draftedPlayerIds,
    undoLastPick,
    updateLeagueSettings,
    startDraft,
    draftPlayerForTeam,
  } = useDraftData();
  const last = findLastCompletedPick(draftPicks);
  const lastPlayer = last?.player_id ? players.find((p) => p.id === last.player_id) : null;
  const lastTeam = last ? teams.find((t) => t.id === last.team_id) : null;
  const canStart = draftPicks.length > 0 && !leagueSettings?.draft_started;
  const orderedTeams = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  const { showToast, ToastEl } = useToast();
  const [draftForTeamId, setDraftForTeamId] = useState<number | "">("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchResults = useMemo(() => {
    if (!playerQuery.trim()) return [];
    const q = playerQuery.trim().toLowerCase();
    return players
      .filter((p) => !draftedPlayerIds.has(p.id) && p.name.toLowerCase().includes(q))
      .sort((a, b) => a.overall_rank - b.overall_rank)
      .slice(0, 20);
  }, [players, draftedPlayerIds, playerQuery]);

  async function handleDraftNow() {
    if (draftForTeamId === "" || selectedPlayerId == null) return;
    setSubmitting(true);
    const res = await draftPlayerForTeam(draftForTeamId, selectedPlayerId);
    setSubmitting(false);
    if (!res.ok) {
      showToast(res.error || "Couldn't make that pick.");
      return;
    }
    showToast("Pick made.");
    setDraftForTeamId("");
    setPlayerQuery("");
    setSelectedPlayerId(null);
  }

  return (
    <div className="a-card">
      <h2>Draft Controls</h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 18,
        }}
      >
        <div className="a-desc" style={{ margin: 0 }}>
          {leagueSettings?.draft_started
            ? "The draft is live."
            : draftPicks.length === 0
              ? "Nothing generated yet — apply a draft order & type first."
              : "Draft order is set, but the clock hasn't started. Owners can build their queues now."}
        </div>
        <button className="btn primary" disabled={!canStart} onClick={startDraft}>
          {leagueSettings?.draft_started ? "Draft Started \u2713" : "Start Draft"}
        </button>
      </div>

      <label className="field-label">Draft For a Team</label>
      <p className="a-desc" style={{ marginTop: 4 }}>
        For when an owner's unavailable — this fills that team's next open pick, in or out of turn. It doesn't
        disturb whoever's actually on the clock unless it happens to be the same pick.
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end",
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 18,
        }}
      >
        <div>
          <label className="field-label">Team</label>
          <select
            value={draftForTeamId}
            onChange={(e) => setDraftForTeamId(e.target.value ? parseInt(e.target.value, 10) : "")}
            style={{ minWidth: 180 }}
          >
            <option value="">Select a team…</option>
            {orderedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <label className="field-label">Player</label>
          <input
            type="text"
            placeholder="Search available players…"
            value={playerQuery}
            onChange={(e) => {
              setPlayerQuery(e.target.value);
              setSelectedPlayerId(null);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            style={{ width: "100%" }}
          />
          {showResults && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 20,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                marginTop: 4,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onMouseDown={() => {
                    setSelectedPlayerId(p.id);
                    setPlayerQuery(p.name);
                    setShowResults(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--panel-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{p.name}</span>
                  <span className={`pos-pill pos-${p.pos}`} style={{ fontSize: 10 }}>
                    {p.pos}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn primary"
          disabled={draftForTeamId === "" || selectedPlayerId == null || submitting}
          onClick={handleDraftNow}
        >
          Draft Now
        </button>
      </div>

      <p className="a-desc">
        Made a mistake? You can only undo the single most recent pick — undoing further back would knock every pick
        after it out of sync.
      </p>
      <div className="undo-box">
        <div className="undo-info">
          {last && lastPlayer ? (
            <>
              Last pick: <b>{lastTeam?.name}</b> took <b>{lastPlayer.name}</b> (#{last.overall} overall)
            </>
          ) : (
            "No picks made yet."
          )}
        </div>
        <button className="btn undo-btn" disabled={!last} onClick={undoLastPick}>
          Undo Last Pick
        </button>
      </div>

      <label className="field-label" style={{ marginTop: 22 }}>
        Pick Clock
      </label>
      <div className="clock-settings">
        <label className="clock-toggle">
          <input
            type="checkbox"
            checked={leagueSettings?.pick_clock_enabled ?? true}
            onChange={(e) => updateLeagueSettings({ pick_clock_enabled: e.target.checked })}
          />
          Enable pick clock
        </label>
        <div className="clock-seconds-row">
          <label className="field-label">Seconds per pick</label>
          <input
            type="text"
            inputMode="numeric"
            value={leagueSettings?.pick_clock_seconds ?? 90}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, "");
              updateLeagueSettings({ pick_clock_seconds: digits === "" ? 0 : parseInt(digits, 10) });
            }}
          />
        </div>
      </div>
      <p className="a-desc" style={{ margin: "10px 0 0 0" }}>
        If the team on the clock has no queue set up when time runs out, the pick auto-drafts the best available
        player.
      </p>
      {ToastEl}
    </div>
  );
}