"use client";

import { useEffect, useMemo, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { fillRosterSlots } from "@/lib/draftEngine";
import { useToast } from "@/components/Toast";

export function MyTeamTab() {
  const { teams, players, draftPicks, leagueSettings, currentUser } = useDraftData();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (currentUser?.type === "team") setSelectedTeam(currentUser.teamId);
    else if (selectedTeam == null && teams.length > 0) setSelectedTeam(teams[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, teams]);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const rosterCounts = leagueSettings?.roster_counts;
  const totalRounds = leagueSettings?.total_rounds ?? 15;

  const slots = useMemo(() => {
    if (!selectedTeam || !rosterCounts) return [];
    const teamPicks = draftPicks.filter((p) => p.team_id === selectedTeam);
    return fillRosterSlots(teamPicks, playersById, rosterCounts, totalRounds);
  }, [selectedTeam, draftPicks, playersById, rosterCounts, totalRounds]);

  const starterCount = rosterCounts
    ? Object.values(rosterCounts).reduce((a, b) => a + b, 0)
    : 0;
  const starterSlots = slots.slice(0, starterCount);
  const benchSlots = slots.slice(starterCount);

  function emailRoster() {
    const team = teams.find((t) => t.id === selectedTeam);
    const email = team?.owner_email?.trim();
    showToast(
      email
        ? `Would email ${team?.name}'s roster to ${email}, via Resend, once the backend is connected.`
        : `Add an email for ${team?.name} in Admin → Team Owners first.`
    );
  }

  return (
    <div className="panel-inner">
      <div className="team-select">
        <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--chalk-dim)", marginRight: 10 }}>
          VIEWING ROSTER FOR
        </label>
        <select value={selectedTeam ?? ""} onChange={(e) => setSelectedTeam(parseInt(e.target.value, 10))}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button className="btn" style={{ float: "right" }} onClick={emailRoster}>
          ✉ Email Roster
        </button>
      </div>

      <div className="section-label">Starters</div>
      <div className="roster-grid">
        {starterSlots.map((slot, i) => {
          const player = slot.pick?.player_id != null ? playersById.get(slot.pick.player_id) : null;
          return (
            <div className={`slot ${player ? "filled" : "open"}`} key={`starter-${i}`}>
              <span className={`slot-pos-badge pos-${slot.slotLabel}`}>{slot.slotLabel}</span>
              {player ? (
                <>
                  <div className="slot-name">{player.name}</div>
                  <div className="slot-team">
                    {player.pos} · {player.nfl_team}
                  </div>
                </>
              ) : (
                <div className="slot-name open">Empty</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="section-label">Bench</div>
      <div className="roster-grid">
        {benchSlots.map((slot, i) => {
          const player = slot.pick?.player_id != null ? playersById.get(slot.pick.player_id) : null;
          return (
            <div className={`slot ${player ? "filled" : "open"}`} key={`bench-${i}`}>
              <span className="slot-pos-badge pos-BN">BN</span>
              {player ? (
                <>
                  <div className="slot-name">{player.name}</div>
                  <div className="slot-team">
                    {player.pos} · {player.nfl_team}
                  </div>
                </>
              ) : (
                <div className="slot-name open">Empty</div>
              )}
            </div>
          );
        })}
      </div>
      {ToastEl}
    </div>
  );
}
