"use client";

import { useEffect, useRef, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { findLastCompletedPick } from "@/lib/draftEngine";

const VOICE_PREF_KEY = "fg2_announcerVoiceURI";
const AUTO_CLOSE_MS = 5000;

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
            `${team.name} selects... ${player.name}, ${player.pos}, ${player.nfl_team}.`
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
