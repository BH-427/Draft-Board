"use client";

import { useToast } from "@/components/Toast";

export function EmailBoardCard() {
  const { showToast, ToastEl } = useToast();
  return (
    <div className="a-card">
      <h2>Email Draft Board</h2>
      <p className="a-desc">
        Sends the full draft board to every owner with an email on file, via Resend, once the backend is connected.
        To send just one team&apos;s roster to its owner instead, use &quot;Email Roster&quot; on that team&apos;s
        page in the My Team tab.
      </p>
      <button
        className="btn primary"
        onClick={() => showToast("Would email the full draft board to the league via Resend, once connected.")}
      >
        ✉ Email Draft Board to League
      </button>
      {ToastEl}
    </div>
  );
}
