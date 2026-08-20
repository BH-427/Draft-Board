"use client";

import { useEffect, useRef, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { findLastCompletedPick } from "@/lib/draftEngine";

const VOICE_PREF_KEY = "fg2_announcerVoiceURI";
const AUTO_CLOSE_MS = 5000;

// Maps an NFL team's short code (as stored on players.nfl_team) to a natural
// spoken name for the announcer — saying "C-I-N" letter-by-letter is the bug
// this fixes.
const NFL_TEAM_SPOKEN: Record<string, string> = {
  ARI: "Arizona",
  ATL: "Atlanta",
  BAL: "Baltimore",
  BUF: "Buffalo",
  CAR: "Carolina",
  CHI: "Chicago",
  CIN: "Cincinnati",
  CLE: "Cleveland",
  DAL: "Dallas",
  DEN: "Denver",
  DET: "Detroit",
  GB: "Green Bay",
  HOU: "Houston",
  IND: "Indianapolis",
  JAC: "Jacksonville",
  KC: "Kansas City",
  LV: "Las Vegas",
  LAC: "the L.A. Chargers",
  LAR: "the L.A. Rams",
  MIA: "Miami",
  MIN: "Minnesota",
  NE: "New England",
  NO: "New Orleans",
  NYG: "the New York Giants",
  NYJ: "the New York Jets",
  PHI: "Philadelphia",
  PIT: "Pittsburgh",
  SEA: "Seattle",
  SF: "San Francisco",
  TB: "Tampa Bay",
  TEN: "Tennessee",
  WAS: "Washington",
  FA: "Free Agent",
};

function spokenNflTeam(code: string): string {
  return NFL_TEAM_SPOKEN[code] ?? code;
}

const POS_SPOKEN: Record<string, string> = {
  QB: "Quarterback",
  RB: "Running Back",
  WR: "Wide Receiver",
  TE: "Tight End",
  K: "Kicker",
  DST: "Defense",
};

function spokenPosition(pos: string): string {
  return POS_SPOKEN[pos] ?? pos;
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function PickModal() {
  const { draftPicks, players, teams, leagueSettings } = useDraftData();
  const [shownPick, setShownPick] = useState<ReturnType<typeof findLastCompletedPick>>(null);
  const [visible, setVisible] = useState(false);
  const lastSeenOverall = useRef<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const last = findLastCompletedPick(draftPicks);
    if (last && last.overall !== lastSeenOverall.current) {
      lastSeenOverall.current = last.overall;
      setShownPick(last);
      setVisible(true);

      if (leagueSettings?.announcer_enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
        const player = players.find((p) => p.id === last.player_id);
        const team = teams.find((t) => t.id === last.team_id);
        if (player && team) {
          const utter = new SpeechSynthesisUtterance(
            `With the ${ordinal(last.pick_in_round)} pick in the ${ordinal(last.round)} round, ${team.name} selects ${spokenPosition(player.pos)}, ${player.name}, ${spokenNflTeam(player.nfl_team)}.`
          );
          const voiceURI = window.localStorage.getItem(VOICE_PREF_KEY);
          const voice = voiceURI ? window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI) : null;
          if (voice) utter.voice = voice;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        }
      }

      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftPicks]);

  if (!shownPick) return null;

  const player = players.find((p) => p.id === shownPick.player_id);
  const team = teams.find((t) => t.id === shownPick.team_id);
  if (!player || !team) return null;

  function close() {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <div className={`pick-modal-backdrop ${visible ? "show" : "hidden"}`}>
      <div className="pick-modal">
        <button className="pm-close" onClick={close}>
          ✕
        </button>
        <div className="pm-eyebrow">
          PICK {shownPick.overall} · ROUND {shownPick.round}, PICK {shownPick.pick_in_round}
        </div>
        <div className="pm-team">{team.name}</div>
        <div className={`pm-pos pos-${player.pos}`}>{player.pos}</div>
        <div className="pm-name">{player.name}</div>
        <div className="pm-nfl">{player.nfl_team}</div>
      </div>
    </div>
  );
}
