"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

export function TeamsCard() {
  const { teams, updateTeam, addTeam, removeTeam, reorderTeams } = useDraftData();
  const [newTeamName, setNewTeamName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const { showToast, ToastEl } = useToast();
  const ordered = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  function handleDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const ids = ordered.map((t) => t.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(targetIndex, 0, moved);
    reorderTeams(ids);
    setDragIndex(null);
    setOverIndex(null);
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
        Drag teams into the pick order for round 1, edit team names, and check &quot;Admin&quot; for any team whose
        owner should be able to undo picks, pause the clock, and reach this Admin tab during the draft — you can
        check as many as you want. There&apos;s also a standalone &quot;Admin&quot; option on the landing screen
        that doesn&apos;t need a team at all.
      </p>
      <ul className="order-list">
        {ordered.map((team, i) => (
          <li
            className="order-item"
            key={team.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIndex !== i) setOverIndex(i);
            }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            style={{
              cursor: "grab",
              opacity: dragIndex === i ? 0.4 : 1,
              borderTop: overIndex === i && dragIndex !== null && dragIndex !== i ? "2px solid var(--amber)" : "2px solid transparent",
            }}
          >
            <span title="Drag to reorder" style={{ cursor: "grab", color: "var(--chalk-dim)", fontSize: 16, lineHeight: 1 }}>
              ⠿
            </span>
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
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: team.is_admin ? "var(--amber)" : "var(--chalk-dim)",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={team.is_admin}
                onChange={(e) => updateTeam(team.id, { is_admin: e.target.checked })}
              />
              Admin
            </label>
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
