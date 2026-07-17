"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useToast } from "@/components/Toast";

export function LeagueInfoCard() {
  const { leagueSettings, updateLeagueSettings } = useDraftData();
  const [name, setName] = useState("");
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (leagueSettings) setName(leagueSettings.league_name);
  }, [leagueSettings]);

  async function save() {
    await updateLeagueSettings({ league_name: name });
    showToast("League name saved.");
  }

  return (
    <div className="a-card">
      <h2>League Info</h2>
      <p className="a-desc">Basic details shown across the site.</p>
      <div className="a-row">
        <div>
          <label className="field-label">League Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>
      <div className="apply-bar">
        <button className="btn primary" onClick={save}>
          Save League Name
        </button>
      </div>
      {ToastEl}
    </div>
  );
}
