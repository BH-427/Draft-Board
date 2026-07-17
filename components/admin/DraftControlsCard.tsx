"use client";

import { useDraftData } from "@/lib/useDraftData";
import { findLastCompletedPick } from "@/lib/draftEngine";

export function DraftControlsCard() {
  const { draftPicks, players, teams, leagueSettings, undoLastPick, updateLeagueSettings } = useDraftData();
  const last = findLastCompletedPick(draftPicks);
  const lastPlayer = last?.player_id ? players.find((p) => p.id === last.player_id) : null;
  const lastTeam = last ? teams.find((t) => t.id === last.team_id) : null;

  return (
    <div className="a-card">
      <h2>Draft Controls</h2>
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
