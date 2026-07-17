"use client";

import { useRef } from "react";
import { useDraftData } from "@/lib/useDraftData";

export function WalkUpMusicCard() {
  const { teams, teamMusic, leagueSettings, updateLeagueSettings, uploadTeamMusic, removeTeamMusic } = useDraftData();
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const ordered = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="a-card">
      <h2>Team Walk-Up Music</h2>
      <p className="a-desc">
        Upload a song per team — it plays automatically as soon as that team is on the clock, and stops the moment
        their pick is made.
      </p>
      <label className="clock-toggle" style={{ marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={leagueSettings?.music_muted ?? false}
          onChange={(e) => updateLeagueSettings({ music_muted: e.target.checked })}
        />
        Mute all walk-up music
      </label>
      <div className="music-list">
        {ordered.map((team) => {
          const music = teamMusic[team.id];
          return (
            <div className="music-row" key={team.id}>
              <span className="m-team">{team.name}</span>
              <label className="m-file-label">
                {music ? "Replace file" : "Choose file"}
                <input
                  type="file"
                  accept="audio/*"
                  ref={(el) => {
                    fileInputs.current[team.id] = el;
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadTeamMusic(team.id, file);
                  }}
                />
              </label>
              <span className="m-filename">{music?.filename || "No file uploaded"}</span>
              {music && (
                <button className="m-btn remove" onClick={() => removeTeamMusic(team.id)}>
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
