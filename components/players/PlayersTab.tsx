"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { PlayerTable } from "./PlayerTable";
import { QueuePanel } from "./QueuePanel";

export function PlayersTab() {
  const { currentUser } = useDraftData();
  const [selectedQueueTeam, setSelectedQueueTeam] = useState<number | null>(null);

  // This tab is only ever shown to team-type users (standalone Admin sessions
  // only see the Admin tab), so the queue is always locked to your own team.
  useEffect(() => {
    if (currentUser?.type === "team") {
      setSelectedQueueTeam(currentUser.teamId);
    }
  }, [currentUser]);

  return (
    <div className="panel-inner">
      <div className="pl-layout">
        <PlayerTable selectedQueueTeam={selectedQueueTeam} />
        <QueuePanel selectedQueueTeam={selectedQueueTeam} />
      </div>
    </div>
  );
}