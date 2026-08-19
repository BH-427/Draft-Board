"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useToast } from "./Toast";

export function ClaimTeamGrid({ onAdminLogin }: { onAdminLogin: () => void }) {
  const { teams, leagueSettings, claimTeam, currentUser, setCurrentUser } = useDraftData();
  const [claiming, setClaiming] = useState<number | null>(null);
  const { showToast, ToastEl } = useToast();

  const myTeamId = currentUser?.type === "team" ? currentUser.teamId : null;

  async function handleClaim(teamId: number, isMine: boolean) {
    if (isMine) return; // already yours, nothing to do — TopBar shows you're logged in
    setClaiming(teamId);
    const res = await claimTeam(teamId);
    setClaiming(null);
    if (!res.ok) showToast(res.error || "Couldn't claim that team.");
  }

  const orderedTeams = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 30, letterSpacing: 2, color: "var(--amber)" }}>
          {leagueSettings?.league_name || "League Draft"}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--chalk-dim)", marginTop: 6 }}>
          TAP YOUR TEAM TO GET STARTED — NO LOGIN NEEDED
        </div>
      </div>

      {myTeamId != null && (
        <div
          className="a-card"
          style={{
            marginBottom: 24,
            borderColor: "var(--amber)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
            You're playing as <b style={{ color: "var(--amber)" }}>{teams.find((t) => t.id === myTeamId)?.name}</b>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {orderedTeams.map((team) => {
          const isMine = team.id === myTeamId;
          const disabled = (team.claimed && !isMine) || claiming === team.id;
          return (
            <button
              key={team.id}
              onClick={() => handleClaim(team.id, isMine)}
              disabled={disabled}
              className="btn"
              style={{
                padding: "18px 16px",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 600,
                borderColor: isMine ? "var(--amber)" : "var(--border)",
                opacity: team.claimed && !isMine ? 0.4 : 1,
                cursor: disabled && !isMine ? "not-allowed" : "pointer",
              }}
            >
              {team.name}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--chalk-dim)", marginTop: 4, fontWeight: 400 }}>
                {isMine ? "This is you" : team.claimed ? "Claimed" : claiming === team.id ? "Claiming…" : "Tap to claim"}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={onAdminLogin}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--chalk-dim)", background: "none", border: "none", cursor: "pointer" }}
        >
          Draft Admin →
        </button>
      </div>

      {myTeamId != null && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            onClick={() => setCurrentUser(null)}
            style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--chalk-dim)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Not you? Switch teams
          </button>
        </div>
      )}

      {ToastEl}
    </div>
  );
}
