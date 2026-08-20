"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

const POS_OPTIONS = ["BPA", "QB", "RB", "WR", "TE", "K", "DST"];

export function QueuePanel({ selectedQueueTeam }: { selectedQueueTeam: number | null }) {
  const { teams, players, leagueSettings, teamQueues, teamRoundPrefs, removeFromQueue, reorderQueue, setRoundPref } =
    useDraftData();
  const [view, setView] = useState<"total" | "byposition">("total");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const playersById = new Map(players.map((p) => [p.id, p]));
  const queue = selectedQueueTeam != null ? teamQueues[selectedQueueTeam] ?? [] : [];
  const prefs = selectedQueueTeam != null ? teamRoundPrefs[selectedQueueTeam] ?? [] : [];
  const prefByRound = new Map(prefs.map((p) => [p.round, p.preferred_pos]));
  const totalRounds = leagueSettings?.total_rounds ?? 15;

  function handleDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex || selectedQueueTeam == null) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const ids = queue.map((q) => q.player_id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(targetIndex, 0, moved);
    reorderQueue(selectedQueueTeam, ids);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="queue-panel">
      <label className="field-label">Queueing as</label>
      <div
        className="queue-team-select"
        style={{ display: "flex", alignItems: "center", cursor: "default", color: "var(--chalk)" }}
      >
        {teams.find((t) => t.id === selectedQueueTeam)?.name ?? "\u2014"}
      </div>
      <h3>Queue</h3>
      <div className="queue-toggle">
        <button className={view === "total" ? "active" : ""} onClick={() => setView("total")}>
          Total Queue
        </button>
        <button className={view === "byposition" ? "active" : ""} onClick={() => setView("byposition")}>
          By Position
        </button>
      </div>
      <div className="empty-note" style={{ marginBottom: 14 }}>
        No round preference set (or set to <b>BPA</b>)? Auto-draft takes your queue in the exact order you built it,
        top to bottom — not by overall rank. Set a preference below for any round where you&apos;d rather it grab the
        best available player at a position instead.
      </div>

      {view === "total" ? (
        queue.length === 0 ? (
          <div className="empty-note">Add players from the list to build this team&apos;s queue.</div>
        ) : (
          <ul className="queue-list">
            {queue.map((q, idx) => {
              const player = playersById.get(q.player_id);
              if (!player) return null;
              return (
                <li
                  className="queue-item"
                  key={q.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overIndex !== idx) setOverIndex(idx);
                  }}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  style={{
                    cursor: "grab",
                    opacity: dragIndex === idx ? 0.4 : 1,
                    borderTop: overIndex === idx && dragIndex !== null && dragIndex !== idx ? "2px solid var(--amber)" : "2px solid transparent",
                  }}
                >
                  <span title="Drag to reorder" style={{ cursor: "grab", color: "var(--chalk-dim)", fontSize: 14, lineHeight: 1 }}>
                    ⠿
                  </span>
                  <span className="qnum">{idx + 1}</span>
                  <span className="qname">{player.name}</span>
                  <span className={`qpos pos-${player.pos}`}>{player.pos}</span>
                  <button className="qremove" onClick={() => selectedQueueTeam != null && removeFromQueue(selectedQueueTeam, q.player_id)}>
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <div>
          <table className="byround-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Preferred Pos</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
                <tr key={round}>
                  <td>{round}</td>
                  <td>
                    <select
                      value={prefByRound.get(round) ?? "BPA"}
                      onChange={(e) => selectedQueueTeam != null && setRoundPref(selectedQueueTeam, round, e.target.value)}
                    >
                      {POS_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="empty-note" style={{ paddingTop: 12 }}>
            Auto-draft grabs the <i>next queued player</i> at that position — not necessarily the top-ranked one. If the
            queue is empty, auto-draft takes the best available player overall.
          </div>
        </div>
      )}
    </div>
  );
}