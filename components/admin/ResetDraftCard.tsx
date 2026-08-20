"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useToast } from "@/components/Toast";

export function ResetDraftCard() {
  const { resetBoard, resetForNewSeason } = useDraftData();
  const { showToast, ToastEl } = useToast();
  const [submitting, setSubmitting] = useState<"board" | "season" | null>(null);

  async function handleResetBoard() {
    if (!window.confirm("Clear every pick and reset the clock? Team names, draft order, and settings are untouched.")) return;
    setSubmitting("board");
    await resetBoard();
    setSubmitting(null);
    showToast("Board reset — picks and clock cleared.");
  }

  async function handleResetForNewSeason() {
    if (
      !window.confirm(
        "Reset EVERYTHING for a new season? This clears every pick, team names, owner emails, claimed status, and queues — back to 12 placeholder teams. Roster requirements, pick clock, draft type, and the uploaded rankings stay as-is. This cannot be undone."
      )
    )
      return;
    setSubmitting("season");
    await resetForNewSeason();
    setSubmitting(null);
    showToast("Reset for a new season — re-claim teams and set the draft order to continue.");
  }

  return (
    <div className="a-card">
      <h2>Reset Draft</h2>
      <p className="a-desc">
        Two levels of reset, both destructive and both require confirmation below. Neither touches the uploaded
        player rankings.
      </p>

      <div className="undo-box">
        <div className="undo-info">
          <b>Reset Board</b> — clears every pick and stops the clock. Team names, draft order, roster requirements,
          and league settings are left alone. Use this to re-run the same draft setup from scratch.
        </div>
        <button className="btn undo-btn" disabled={submitting !== null} onClick={handleResetBoard}>
          Reset Board
        </button>
      </div>

      <div className="undo-box" style={{ marginTop: 14, borderColor: "var(--amber)" }}>
        <div className="undo-info">
          <b>Reset for New Season</b> — everything above, plus team names, owner emails, claimed status, admin flags,
          and queues all reset. Teams go back to 12 placeholders, ready to be renamed and re-claimed for next year's
          draft.
        </div>
        <button className="btn undo-btn" disabled={submitting !== null} onClick={handleResetForNewSeason}>
          Reset for New Season
        </button>
      </div>
      {ToastEl}
    </div>
  );
}
