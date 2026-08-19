"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { PlayerTable } from "./PlayerTable";
import { QueuePanel } from "./QueuePanel";

export function PlayersTab() {
  const { teams, currentUser } = useDraftData();
  const [selectedQueueTeam, setSelectedQueueTeam] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser?.type === "team") {
      setSelectedQueueTeam(currentUser.teamId);
    } else if (selectedQueueTeam == null && teams.length > 0) {
      setSelectedQueueTeam(teams[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, teams]);

  return (
    <div className="panel-inner">
      <div className="pl-layout">
        <PlayerTable selectedQueueTeam={selectedQueueTeam} />
        <QueuePanel selectedQueueTeam={selectedQueueTeam} onChangeTeam={setSelectedQueueTeam} />
      </div>
    </div>
  );
}