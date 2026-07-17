"use client";

import { useEffect, useRef } from "react";
import { useDraftData } from "@/lib/useDraftData";

export function MusicPlayer() {
  const { onClockPick, teamMusic, leagueSettings } = useDraftData();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!onClockPick || leagueSettings?.music_muted) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }

    const music = teamMusic[onClockPick.team_id];
    if (!music) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }

    if (audio.src !== music.public_url) {
      audio.src = music.public_url;
    }
    audio.play().catch(() => {
      // autoplay can be blocked until the user interacts with the page once — harmless.
    });
  }, [onClockPick?.team_id, onClockPick?.overall, teamMusic, leagueSettings?.music_muted]);

  return <audio ref={audioRef} loop />;
}
