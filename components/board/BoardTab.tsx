"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { BoardGrid } from "./BoardGrid";
import { RoundOverlay } from "./RoundOverlay";

export function BoardTab() {
  const { onClockPick } = useDraftData();
  const [openRound, setOpenRound] = useState<{ round: number; focusOverall: number | null } | null>(null);

  return (
    <div className="panel-inner">
      <div className="board-toolbar">
        <h2>Full Draft Board</h2>
        <button
          className="btn primary"
          disabled={!onClockPick}
          onClick={() => onClockPick && setOpenRound({ round: onClockPick.round, focusOverall: onClockPick.overall })}
        >
          Expand Current Round →
        </button>
      </div>
      <BoardGrid onOpenRound={(round, focusOverall) => setOpenRound({ round, focusOverall })} />
      {openRound && (
        <RoundOverlay round={openRound.round} focusOverall={openRound.focusOverall} onClose={() => setOpenRound(null)} />
      )}
    </div>
  );
}
