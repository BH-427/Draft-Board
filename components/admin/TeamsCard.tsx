"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

export function TeamsCard() {
  const { teams, updateTeam, addTeam, removeTeam, reorderTeams } = useDraftData();
  const [newTeamName, setNewTeamName] = useState("");
  const { showToast, ToastEl } = useToast();
  const ordered = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((t) => t.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderTeams(ids);
  }

  async function resetAllClaims() {
    if (!window.confirm("Un-claim all teams? Anyone who already tapped their team will need to tap it again.")) return;
    const { error } = await supabase.from("teams").update({ claimed: false, claimed_at: null }).neq("id", 0);
    showToast(error ? error.message : "All claims reset.");
  }

  return (
    <div className="a-card">
      <h2>Draft Order</h2>
      <p className="a-desc">
        Set the pick order for round 1, and edit team names. Use the arrows to reorder — hit &quot;Apply Draft Order
        &amp; Type&quot; below once you&apos;re happy with it.
      </p>
      <ul className="order-list">
        {ordered.map((team, i) => (
          <li className="order-item" key={team.id}>
            <span className="num">{i + 1}</span>
            <input
              type="text"
              className="name"
              defaultValue={team.name}
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                color: "var(--chalk)",
                borderRadius: 6,
                padding: "6px 10px",
                fontFamily: "inherit",
              }}
              onBlur={(e) => e.target.value.trim() && e.target.value !== team.name && updateTeam(team.id, { name: e.target.value.trim() })}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: team.claimed ? "var(--turf)" : "var(--chalk-dim)",
                whiteSpace: "nowrap",
              }}
            >
              {team.claimed ? "Claimed" : "Unclaimed"}
            </span>
            <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
              ▲
            </button>
            <button onClick={() => move(i, 1)} disabled={i === ordered.length - 1} title="Move down">
              ▼
            </button>
            <button
              onClick={() => window.confirm(`Remove ${team.name}? This also removes any picks already made for them.`) && removeTeam(team.id)}
              title="Remove team"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="apply-bar">
        <input
          type="text"
          placeholder="New team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button
          className="btn"
          disabled={!newTeamName.trim()}
          onClick={() => {
            addTeam(newTeamName.trim());
            setNewTeamName("");
          }}
        >
          + Add Team
        </button>
        <button className="btn" onClick={resetAllClaims}>
          Reset All Claims
        </button>
      </div>
      {ToastEl}
    </div>
  );
}
