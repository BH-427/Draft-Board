"use client";

import { useDraftData } from "@/lib/useDraftData";
import { findLastCompletedPick } from "@/lib/draftEngine";

export function DraftControlsCard() {
  const { draftPicks, players, teams, leagueSettings, undoLastPick, updateLeagueSettings, startDraft } = useDraftData();
  const last = findLastCompletedPick(draftPicks);
  const lastPlayer = last?.player_id ? players.find((p) => p.id === last.player_id) : null;
  const lastTeam = last ? teams.find((t) => t.id === last.team_id) : null;
  const canStart = draftPicks.length > 0 && !leagueSettings?.draft_started;

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
            type="number"
            min={5}
            max={600}
            value={leagueSettings?.pick_clock_seconds ?? 90}
            onChange={(e) => updateLeagueSettings({ pick_clock_seconds: parseInt(e.target.value, 10) || 90 })}
          />
        </div>
      </div>
      <p className="a-desc" style={{ margin: "10px 0 0 0" }}>
        If the team on the clock has no queue set up when time runs out, the pick auto-drafts the best available
        player.
      </p>
    </div>
  );
}