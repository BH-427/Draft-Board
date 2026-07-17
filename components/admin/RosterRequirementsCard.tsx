"use client";

import { useDraftData } from "@/lib/useDraftData";
import { benchCountFor, starterCountFor } from "@/lib/draftEngine";
import type { RosterCounts } from "@/lib/types";

const POSITIONS: (keyof RosterCounts)[] = ["QB", "RB", "WR", "TE", "FLEX", "DST", "K"];

export function RosterRequirementsCard() {
  const { leagueSettings, updateLeagueSettings } = useDraftData();
  const rosterCounts = leagueSettings?.roster_counts;
  const totalRounds = leagueSettings?.total_rounds ?? 15;

  if (!rosterCounts) return null;

  const starterCount = starterCountFor(rosterCounts);
  const benchCount = benchCountFor(rosterCounts, totalRounds);

  function setCount(pos: keyof RosterCounts, value: number) {
    updateLeagueSettings({ roster_counts: { ...rosterCounts!, [pos]: Math.max(0, value) } });
  }

  return (
    <div className="a-card">
      <h2>Roster Requirements</h2>
      <p className="a-desc">Starting lineup slots per team. Bench spots fill automatically based on total rounds.</p>
      <div className="roster-config">
        {POSITIONS.map((pos) => (
          <div className={`rc-item pos-${pos}`} key={pos}>
            <span className="pos-pill">{pos}</span>
            <input
              type="number"
              min={0}
              max={6}
              value={rosterCounts[pos] ?? 0}
              onChange={(e) => setCount(pos, parseInt(e.target.value, 10) || 0)}
            />
          </div>
        ))}
      </div>

      <label className="field-label">Total Rounds (Draft Length)</label>
      <div className="rounds-control">
        <div className="stepper">
          <button onClick={() => updateLeagueSettings({ total_rounds: Math.max(starterCount, totalRounds - 1) })}>−</button>
          <span className="count">{totalRounds}</span>
          <button onClick={() => updateLeagueSettings({ total_rounds: totalRounds + 1 })}>+</button>
        </div>
        <div className="rounds-note bench-note">
          <div>
            <b>{starterCount}</b> starter slots · <b>{benchCount}</b> bench slots
          </div>
          <div>Adjust rounds up or down each season without changing starter requirements.</div>
        </div>
      </div>
    </div>
  );
}
