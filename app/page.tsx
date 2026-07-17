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
import { PickModal } from "@/components/PickModal";
import { MusicPlayer } from "@/components/MusicPlayer";

export default function Home() {
  const { loading, currentUser, isAdmin } = useDraftData();
  const [activeTab, setActiveTab] = useState<TabKey>("board");
  const showAdmin = !!currentUser && isAdmin();

  useEffect(() => {
    if (activeTab === "admin" && !showAdmin) setActiveTab("board");
  }, [activeTab, showAdmin]);

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
      />
      <div className={`tab-panel ${activeTab === "board" ? "active" : ""}`}>
        <BoardTab />
      </div>
      <div className={`tab-panel ${activeTab === "players" ? "active" : ""}`}>
        <PlayersTab />
      </div>
      <div className={`tab-panel ${activeTab === "myteam" ? "active" : ""}`}>
        <MyTeamTab />
      </div>
      {showAdmin && (
        <div className={`tab-panel ${activeTab === "admin" ? "active" : ""}`}>
          <AdminTab />
        </div>
      )}
      <PickModal />
      <MusicPlayer />
    </>
  );
}
