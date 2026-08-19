"use client";

import { useEffect, useRef, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

const RUNOFF_SECONDS = 5;
const LOW_THRESHOLD = 10;

export function ClockStrip() {
  const { leagueSettings, teams, draftPicks, onClockPick, draftState, isAdmin, pauseClock, resumeClock, autoDraftOnClock } =
    useDraftData();
  const [now, setNow] = useState(() => Date.now());
  const firedForRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const team = onClockPick ? teams.find((t) => t.id === onClockPick.team_id) : null;
  const clockEnabled = leagueSettings?.pick_clock_enabled;
  const totalSeconds = leagueSettings?.pick_clock_seconds ?? 90;

  let remaining = totalSeconds;
  let inRunoff = false;
  if (clockEnabled && draftState) {
    if (draftState.clock_paused) {
      remaining = draftState.paused_remaining_seconds ?? totalSeconds;
    } else if (draftState.clock_started_at) {
      const elapsed = (now - new Date(draftState.clock_started_at).getTime()) / 1000;
      const raw = totalSeconds - elapsed;
      if (raw <= 0) {
        inRunoff = true;
        remaining = Math.max(0, RUNOFF_SECONDS + raw);
      } else {
        remaining = raw;
      }
    }
  }

  useEffect(() => {
    if (!onClockPick || !clockEnabled || !draftState || draftState.clock_paused) return;
    if (inRunoff && remaining <= 0 && firedForRef.current !== onClockPick.overall) {
      firedForRef.current = onClockPick.overall;
      autoDraftOnClock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRunoff, remaining, onClockPick?.overall, clockEnabled, draftState?.clock_paused]);

  if (!onClockPick) {
    const neverStarted = draftPicks.length === 0;
    return (
      <div className="clock-strip">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--amber)" }}>
          {neverStarted
            ? "Draft hasn't started yet — go to Admin \u2192 Draft Type and hit \u201cApply Draft Order & Type.\u201d"
            : "Draft complete — all picks are in."}
        </span>
      </div>
    );
  }

  let badgeClass = "pick-clock-badge";
  if (draftState?.clock_paused) badgeClass += " paused";
  else if (inRunoff) badgeClass += " runoff";
  else if (remaining <= LOW_THRESHOLD) badgeClass += " low";

  return (
    <div className="clock-strip">
      <span className="dot"></span>
      <span>
        ON THE CLOCK — <b>{team?.name}</b> · Round {onClockPick.round}, Pick {onClockPick.pick_in_round} (Overall #
        {onClockPick.overall})
      </span>
      {clockEnabled && isAdmin() && (
        <button
          className="pick-clock-pause"
          title={draftState?.clock_paused ? "Resume the pick clock" : "Pause the pick clock"}
          onClick={() => (draftState?.clock_paused ? resumeClock() : pauseClock())}
        >
          {draftState?.clock_paused ? "▶" : "⏸"}
        </button>
      )}
      {clockEnabled && <span className={badgeClass}>{Math.ceil(Math.max(0, remaining))}s</span>}
    </div>
  );
}