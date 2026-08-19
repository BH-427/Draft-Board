"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useToast } from "@/components/Toast";

export function TeamOwnersCard() {
  const { teams, updateTeam } = useDraftData();
  const { showToast, ToastEl } = useToast();

  const ordered = [...teams].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="a-card">
      <h2>
        Team Owners{" "}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--chalk-dim)", fontWeight: 400 }}>
          (placeholder — real sending comes with Resend)
        </span>
      </h2>
      <p className="a-desc">
        Assign each team an owner email if you want it on file for later — but it&apos;s{" "}
        <b>not used for login</b>. Teams just tap their name on the landing screen to claim it, no email needed.
        (Admin access is set separately, via the checkboxes in the Draft Order card, or the standalone
        &quot;Admin&quot; option on the landing screen.) &quot;Send Invite&quot; and &quot;Email Results&quot;
        below are placeholders for when the real backend (Resend) is wired up.
      </p>

      <div className="owner-list">
        {ordered.map((team) => (
          <OwnerRow key={team.id} teamId={team.id} teamName={team.name} initialEmail={team.owner_email || ""} onSave={(email) => updateTeam(team.id, { owner_email: email })} />
        ))}
      </div>

      <div className="apply-bar">
        <button className="btn" onClick={() => showToast("Would send an invite email to every owner on file, via Resend, once connected.")}>
          ✉ Send Invite to All Owners
        </button>
        <button className="btn" onClick={() => showToast("Would email full draft results to every owner on file, via Resend, once connected.")}>
          ✉ Email Draft Results to All Owners
        </button>
      </div>
      {ToastEl}
    </div>
  );
}

function OwnerRow({
  teamName,
  initialEmail,
  onSave,
}: {
  teamId: number;
  teamName: string;
  initialEmail: string;
  onSave: (email: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const isSet = !!initialEmail.trim();

  return (
    <div className="owner-row">
      <span className="o-team">{teamName}</span>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => email.trim() !== initialEmail.trim() && onSave(email.trim())}
        placeholder="owner@email.com"
      />
      <span className={`o-status ${isSet ? "set" : "unset"}`}>{isSet ? "Email on file" : "Not set"}</span>
    </div>
  );
}