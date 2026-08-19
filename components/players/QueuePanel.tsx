"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

const POS_OPTIONS = ["BPA", "QB", "RB", "WR", "TE", "K", "DST"];

export function QueuePanel({
  selectedQueueTeam,
  onChangeTeam,
}: {
  selectedQueueTeam: number | null;
  onChangeTeam: (teamId: number) => void;
}) {
  const { teams, players, leagueSettings, teamQueues, teamRoundPrefs, currentUser, removeFromQueue, moveInQueue, setRoundPref } =
    useDraftData();
  const [view, setView] = useState<"total" | "byposition">("total");

  const playersById = new Map(players.map((p) => [p.id, p]));
  const locked = currentUser?.type === "team";
  const queue = selectedQueueTeam != null ? teamQueues[selectedQueueTeam] ?? [] : [];
  const prefs = selectedQueueTeam != null ? teamRoundPrefs[selectedQueueTeam] ?? [] : [];
  const prefByRound = new Map(prefs.map((p) => [p.round, p.preferred_pos]));
  const totalRounds = leagueSettings?.total_rounds ?? 15;

  return (
    <div className="queue-panel">
      <label className="field-label">Queueing as</label>
      {locked ? (
        <div
          className="queue-team-select"
          style={{ display: "flex", alignItems: "center", cursor: "default", color: "var(--chalk)" }}
        >
          {teams.find((t) => t.id === selectedQueueTeam)?.name ?? "\u2014"}
        </div>
      ) : (
        <select
          className="queue-team-select"
          value={selectedQueueTeam ?? ""}
          onChange={(e) => onChangeTeam(parseInt(e.target.value, 10))}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      <h3>Queue</h3>
      <div className="queue-toggle">
        <button className={view === "total" ? "active" : ""} onClick={() => setView("total")}>
          Total Queue
        </button>
        <button className={view === "byposition" ? "active" : ""} onClick={() => setView("byposition")}>
          By Position
        </button>
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
                <li className="queue-item" key={q.id}>
                  <span className="qnum">{idx + 1}</span>
                  <span className="qname">{player.name}</span>
                  <span className={`qpos pos-${player.pos}`}>{player.pos}</span>
                  <button className="qmove" disabled={idx === 0} onClick={() => selectedQueueTeam != null && moveInQueue(selectedQueueTeam, q.player_id, "up")}>
                    ▲
                  </button>
                  <button
                    className="qmove"
                    disabled={idx === queue.length - 1}
                    onClick={() => selectedQueueTeam != null && moveInQueue(selectedQueueTeam, q.player_id, "down")}
                  >
                    ▼
                  </button>
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