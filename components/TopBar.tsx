"use client";

import { useDraftData } from "@/lib/useDraftData";
import { ClaimTeamGrid } from "./ClaimTeamGrid";

export function TopBar() {
  const { leagueSettings, teams, currentUser, logout } = useDraftData();

  const forced = !currentUser;
  const teamName = currentUser?.type === "team" ? teams.find((t) => t.id === currentUser.teamId)?.name : null;

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="yard-badge">FG2</div>
          <div>
            <h1>{leagueSettings?.league_name || "Draft Board"}</h1>
            <div className="sub">{new Date().getFullYear()} DRAFT</div>
          </div>
        </div>
        <div className="account-area">
          {currentUser && (
            <>
              <div className="account-badge">
                {currentUser.type === "admin" ? (
                  <span className="role-tag admin">Admin</span>
                ) : (
                  <b>{teamName}</b>
                )}
              </div>
              <button className="logout-link" onClick={logout}>
                Log Out
              </button>
            </>
          )}
        </div>
      </div>

      {forced && (
        <div className="login-modal-backdrop" style={{ overflowY: "auto" }}>
          <ClaimTeamGrid />
        </div>
      )}
    </>
  );
}