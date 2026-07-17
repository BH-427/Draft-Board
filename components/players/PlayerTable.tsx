"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

const POS_FILTERS = ["ALL", "QB", "RB", "WR", "TE", "K", "DST"];

export function PlayerTable({ selectedQueueTeam }: { selectedQueueTeam: number | null }) {
  const { players, draftedPlayerIds, teamQueues, onClockPick, canActFor, draftPlayer, addToQueue, removeFromQueue } =
    useDraftData();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [hideDrafted, setHideDrafted] = useState(false);

  const queue = selectedQueueTeam != null ? teamQueues[selectedQueueTeam] ?? [] : [];
  const queuedIds = new Set(queue.map((q) => q.player_id));

  const list = players
    .filter((p) => (activeFilter === "ALL" || p.pos === activeFilter) && (!hideDrafted || !draftedPlayerIds.has(p.id)))
    .sort((a, b) => a.overall_rank - b.overall_rank)
    .slice(0, 80);

  return (
    <div>
      <div className="board-toolbar">
        <h2>Rankings — Player List</h2>
      </div>
      <div className="pl-controls">
        {POS_FILTERS.map((pos) => (
          <button
            key={pos}
            className={`filter-chip ${activeFilter === pos ? "active" : ""}`}
            data-pos={pos}
            onClick={() => setActiveFilter(pos)}
          >
            {pos}
          </button>
        ))}
      </div>
      <label className="avail-toggle">
        <input type="checkbox" checked={hideDrafted} onChange={(e) => setHideDrafted(e.target.checked)} />
        Show only available players
      </label>
      <table className="plist">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Pos</th>
            <th>Team</th>
            <th>Status</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => {
            const isDrafted = draftedPlayerIds.has(p.id);
            const inQueue = queuedIds.has(p.id);
            const canDraft = !isDrafted && !!onClockPick && canActFor(onClockPick.team_id);
            return (
              <tr key={p.id}>
                <td className="rank-cell">{p.overall_rank}</td>
                <td>{p.name}</td>
                <td>
                  <span className={`pos-pill pos-${p.pos}`}>{p.pos}</span>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--chalk-dim)" }}>{p.nfl_team}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isDrafted ? "#e4572e" : "var(--chalk-dim)" }}>
                  {isDrafted ? "Drafted" : "Available"}
                </td>
                <td>
                  <button
                    className={`add-q-btn ${inQueue ? "added" : ""}`}
                    disabled={isDrafted || selectedQueueTeam == null}
                    onClick={() =>
                      selectedQueueTeam != null &&
                      (inQueue ? removeFromQueue(selectedQueueTeam, p.id) : addToQueue(selectedQueueTeam, p.id))
                    }
                  >
                    {inQueue ? "✓ Queued" : "+ Queue"}
                  </button>
                </td>
                <td>
                  <button
                    className="draft-btn"
                    disabled={!canDraft}
                    title={onClockPick && !canActFor(onClockPick.team_id) ? "Only the team on the clock or the admin can make this pick" : ""}
                    onClick={() => canDraft && draftPlayer(p.id)}
                  >
                    Draft
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
