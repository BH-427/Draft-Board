"use client";

import { useEffect, useRef, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

const AUTO_CLOSE_MS = 8000;

export function DraftCompleteBanner({ onViewResults }: { onViewResults: () => void }) {
  const { leagueSettings, draftPicks, onClockPick } = useDraftData();
  const [visible, setVisible] = useState(false);
  const wasCompleteRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = !!leagueSettings?.draft_started && draftPicks.length > 0 && !onClockPick;

  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setVisible(true);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete]);

  function close() {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <div className={`pick-modal-backdrop ${visible ? "show" : "hidden"}`}>
      <div className="pick-modal">
        <button className="pm-close" onClick={close}>
          ✕
        </button>
        <div className="pm-eyebrow">THE {new Date().getFullYear()} DRAFT IS IN THE BOOKS</div>
        <div className="pm-name" style={{ fontSize: 40, marginBottom: 22 }}>
          Draft Complete!
        </div>
        <button
          className="btn primary"
          onClick={() => {
            onViewResults();
            close();
          }}
        >
          View Final Results →
        </button>
      </div>
    </div>
  );
}
