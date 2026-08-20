"use client";

import { useMemo, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { groupTeamPicksByPosition } from "@/lib/draftEngine";
import { BoardGrid } from "@/components/board/BoardGrid";
import { RoundOverlay } from "@/components/board/RoundOverlay";

const POS_LABELS: Record<string, string> = {
  QB: "Quarterbacks",
  RB: "Running Backs",
  WR: "Wide Receivers",
  TE: "Tight Ends",
  K: "Kickers",
  DST: "Defense/ST",
  Other: "Other",
};

function printSection(target: "rosters" | "board") {
  const cls = `printing-${target}`;
  document.documentElement.classList.add(cls);
  const cleanup = () => {
    document.documentElement.classList.remove(cls);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

export function ResultsTab() {
  const { teams, players, draftPicks } = useDraftData();
  const [openRound, setOpenRound] = useState<{ round: number; focusOverall: number | null } | null>(null);

  const orderedTeams = useMemo(() => [...teams].sort((a, b) => a.sort_order - b.sort_order), [teams]);
  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  return (
    <div className="panel-inner results-tab">
      <div className="board-toolbar">
        <h2>Draft Complete — Final Results</h2>
      </div>

      <div id="print-rosters" className="results-section">
        <div className="board-toolbar">
          <h3>Final Rosters</h3>
          <button className="btn" onClick={() => printSection("rosters")}>
            🖨 Print Rosters
          </button>
        </div>
        <div className="results-rosters-grid">
          {orderedTeams.map((team) => {
            const teamPicks = draftPicks.filter((p) => p.team_id === team.id);
            const groups = groupTeamPicksByPosition(teamPicks, playersById);
            return (
              <div className="results-team-card" key={team.id}>
                <h4>{team.name}</h4>
                {groups.map((group) => (
                  <div className="results-pos-group" key={group.pos}>
                    <div className="results-pos-label">{POS_LABELS[group.pos] ?? group.pos}</div>
                    <ul>
                      {group.picks.map((pick) => {
                        const player = playersById.get(pick.player_id!);
                        if (!player) return null;
                        return (
                          <li key={pick.id}>
                            <span className="results-player-name">{player.name}</span>
                            <span className="results-player-team">{player.nfl_team}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div id="print-board" className="results-section">
        <div className="board-toolbar">
          <h3>Full Draft Board</h3>
          <button className="btn" onClick={() => printSection("board")}>
            🖨 Print Draft Board
          </button>
        </div>
        <BoardGrid onOpenRound={(round, focusOverall) => setOpenRound({ round, focusOverall })} />
        {openRound && (
          <RoundOverlay round={openRound.round} focusOverall={openRound.focusOverall} onClose={() => setOpenRound(null)} />
        )}
      </div>
    </div>
  );
}
