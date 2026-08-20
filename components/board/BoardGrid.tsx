"use client";

import { useRef, type CSSProperties } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useDragScroll } from "@/lib/useDragScroll";
import type { DraftPick, Player, Team } from "@/lib/types";

function tileContent(pick: DraftPick | undefined, player: Player | undefined, isOnClock: boolean, teamName: string) {
  if (!pick || !player) {
    return (
      <>
        <div className="pick-no">Pick #{pick?.pick_in_round ?? ""}</div>
        <div className="pname" style={{ marginTop: 20, fontStyle: "italic", color: "var(--chalk-dim)" }}>
          {isOnClock ? "On the clock" : "Upcoming"}
        </div>
        <div className="pteam">{teamName}</div>
      </>
    );
  }
  return (
    <>
      <div className="pick-no">Pick #{pick.pick_in_round}</div>
      <div className={`pos-tag pos-${player.pos}`}>{player.pos}</div>
      <div className="pname">{player.name}</div>
      <div className="pteam">{player.nfl_team}</div>
    </>
  );
}

export function BoardGrid({ onOpenRound }: { onOpenRound: (round: number, focusOverall: number) => void }) {
  const { teams, players, draftPicks, onClockPick, leagueSettings } = useDraftData();
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);
  const orderedTeams = [...teams].sort((a, b) => a.sort_order - b.sort_order);
  const totalRounds = leagueSettings?.total_rounds ?? 15;
  const playersById = new Map(players.map((p) => [p.id, p]));

  const gridStyle = {
    "--board-cols": `64px repeat(${orderedTeams.length}, 1fr)`,
  } as CSSProperties;

  const minWidth = Math.max(900, 64 + orderedTeams.length * 120);

  return (
    <div className="board-scroll" ref={scrollRef}>
      <div className="board-grid" style={{ ...gridStyle, minWidth }}>
        <div className="board-cols-header">
          <div className="col-head corner"></div>
          {orderedTeams.map((t: Team) => (
            <div className="col-head" key={t.id}>
              {t.name}
            </div>
          ))}
        </div>

        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
          <div className="round-row" key={round}>
            <div className="round-label">
              RD {round}
              <small>{round % 2 === 1 ? "→" : "←"}</small>
            </div>
            {orderedTeams.map((t) => {
              const pick = draftPicks.find((p) => p.round === round && p.team_id === t.id);
              const player = pick?.player_id != null ? playersById.get(pick.player_id) : undefined;
              const isOnClock = !!pick && !!onClockPick && pick.overall === onClockPick.overall;
              const isEmpty = !pick || pick.player_id == null;
              return (
                <div
                  key={t.id}
                  className={`tile ${isEmpty ? "empty" : ""} ${isOnClock ? "on-clock" : ""}`}
                  onClick={() => pick && onOpenRound(round, pick.overall)}
                >
                  {tileContent(pick, player, isOnClock, t.name)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
