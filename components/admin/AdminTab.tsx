"use client";

import { useDraftData } from "@/lib/useDraftData";
import { DraftControlsCard } from "./DraftControlsCard";
import { EmailBoardCard } from "./EmailBoardCard";
import { AnnouncerCard } from "./AnnouncerCard";
import { LeagueInfoCard } from "./LeagueInfoCard";
import { TeamsCard } from "./TeamsCard";
import { DraftTypeCard } from "./DraftTypeCard";
import { TeamOwnersCard } from "./TeamOwnersCard";
import { RosterRequirementsCard } from "./RosterRequirementsCard";
import { WalkUpMusicCard } from "./WalkUpMusicCard";
import { RankingsUploadCard } from "./RankingsUploadCard";

export function AdminTab() {
  const { isAdmin } = useDraftData();

  if (!isAdmin()) {
    return (
      <div className="panel-inner">
        <p className="a-desc">Only the league admin can access this tab.</p>
      </div>
    );
  }

  return (
    <div className="panel-inner">
      <div className="admin-wrap">
        <DraftControlsCard />
        <EmailBoardCard />
        <AnnouncerCard />
        <LeagueInfoCard />
        <TeamsCard />
        <DraftTypeCard />
        <TeamOwnersCard />
        <RosterRequirementsCard />
        <WalkUpMusicCard />
        <RankingsUploadCard />
      </div>
    </div>
  );
}
