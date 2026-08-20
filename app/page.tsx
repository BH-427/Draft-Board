"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { TopBar } from "@/components/TopBar";
import { ClockStrip } from "@/components/ClockStrip";
import { Tabs, type TabKey } from "@/components/Tabs";
import { BoardTab } from "@/components/board/BoardTab";
import { PlayersTab } from "@/components/players/PlayersTab";
import { MyTeamTab } from "@/components/myteam/MyTeamTab";
import { AdminTab } from "@/components/admin/AdminTab";
import { ResultsTab } from "@/components/results/ResultsTab";
import { PickModal } from "@/components/PickModal";
import { DraftCompleteBanner } from "@/components/DraftCompleteBanner";
import { MusicPlayer } from "@/components/MusicPlayer";

export default function Home() {
  const { loading, currentUser, isAdmin, leagueSettings, draftPicks, onClockPick } = useDraftData();
  const [activeTab, setActiveTab] = useState<TabKey>("board");
  const showAdmin = !!currentUser && isAdmin();
  const adminOnly = currentUser?.type === "admin"; // standalone Admin login — not a drafting team
  const draftComplete = !!leagueSettings?.draft_started && draftPicks.length > 0 && !onClockPick;

  useEffect(() => {
    if (adminOnly) setActiveTab("admin");
    else if (activeTab === "admin" && !showAdmin) setActiveTab("board");
    else if (activeTab === "results" && !draftComplete) setActiveTab("board");
  }, [activeTab, showAdmin, adminOnly, draftComplete]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--chalk-dim)" }}>
        Loading draft board…
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <ClockStrip />
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        showAdmin={showAdmin}
        showResults={draftComplete}
        adminOnly={adminOnly}
      />
      {!adminOnly && (
        <>
          <div className={`tab-panel ${activeTab === "board" ? "active" : ""}`}>
            <BoardTab />
          </div>
          <div className={`tab-panel ${activeTab === "players" ? "active" : ""}`}>
            <PlayersTab />
          </div>
          <div className={`tab-panel ${activeTab === "myteam" ? "active" : ""}`}>
            <MyTeamTab />
          </div>
          {draftComplete && (
            <div className={`tab-panel ${activeTab === "results" ? "active" : ""}`}>
              <ResultsTab />
            </div>
          )}
        </>
      )}
      {showAdmin && (
        <div className={`tab-panel ${activeTab === "admin" ? "active" : ""}`}>
          <AdminTab />
        </div>
      )}
      <PickModal />
      <DraftCompleteBanner onViewResults={() => setActiveTab("results")} />
      <MusicPlayer />
    </>
  );
}