"use client";

import { useEffect, useMemo, useRef } from "react";
import { useDraftData } from "@/lib/useDraftData";

export function RoundOverlay({
  round,
  focusOverall,
  onClose,
}: {
  round: number;
  focusOverall: number | null;
  onClose: () => void;
}) {
  const { teams, players, draftPicks, onClockPick } = useDraftData();
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const picks = useMemo(
    () => draftPicks.filter((p) => p.round === round).sort((a, b) => a.pick_in_round - b.pick_in_round),
    [draftPicks, round]
  );

  const currentOverall = focusOverall ?? (onClockPick && onClockPick.round === round ? onClockPick.overall : picks[0]?.overall);

  useEffect(() => {
    const el = carouselRef.current?.querySelector<HTMLElement>(`[data-overall="${currentOverall}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentOverall, round]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      dragState.current = { isDown: true, startX: e.pageX, scrollLeft: el.scrollLeft };
    };
    const onUp = () => {
      dragState.current.isDown = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.isDown) return;
      el.scrollLeft = dragState.current.scrollLeft - (e.pageX - dragState.current.startX);
    };
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="round-overlay">
      <div className="round-head">
        <button className="close-overlay" onClick={onClose}>
          <span className="arrow">←</span> Back to Full Board
        </button>
        <div className="round-title-block">
          <h2>ROUND {round}</h2>
          <p>Drag to browse this round&apos;s picks · click a tile on the full board to jump to a different round</p>
        </div>
        <div className="round-clock-slot" />
      </div>
      <div className="carousel-wrap">
        <div className="carousel" ref={carouselRef}>
          {picks.map((pick) => {
            const team = teamsById.get(pick.team_id);
            const player = pick.player_id != null ? playersById.get(pick.player_id) : undefined;
            const isCurrent = pick.overall === currentOverall;
            const isEmpty = pick.player_id == null;
            return (
              <div
                key={pick.id}
                data-overall={pick.overall}
                className={`rtile ${isEmpty ? "empty" : ""} ${isCurrent ? "current" : ""}`}
                onClick={(e) => {
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "center" });
                }}
              >
                <div className="team-hover">{team?.name}</div>
                <div className="pick-no">Pick #{pick.pick_in_round}</div>
                {player ? (
                  <>
                    <div className={`pos-tag pos-${player.pos}`}>{player.pos}</div>
                    <div className="pname">{player.name}</div>
                    <div className="pteam">{player.nfl_team}</div>
                  </>
                ) : (
                  <>
                    <div className="pname">{onClockPick && pick.overall === onClockPick.overall ? "On the clock" : "Upcoming"}</div>
                    <div className="pteam"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="carousel-hint">◄ drag / swipe to see other picks in this round ►</div>
    </div>
  );
}
