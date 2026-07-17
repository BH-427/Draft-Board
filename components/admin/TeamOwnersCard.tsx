"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useToast } from "@/components/Toast";

export function TeamOwnersCard() {
  const { teams, leagueSettings, updateTeam, updateLeagueSettings } = useDraftData();
  const [adminEmail, setAdminEmail] = useState("");
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (leagueSettings) setAdminEmail(leagueSettings.admin_email);
  }, [leagueSettings]);

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
        Assign each team an owner email. &quot;Send Invite&quot; and &quot;Email Results&quot; don&apos;t actually
        send anything yet — they&apos;re here so the flow and layout are ready for when the real backend is wired
        up. Login matching against these emails <i>does</i> work, on any device.
      </p>

      <label className="field-label">Draft Admin Email</label>
      <div className="admin-email-row">
        <input
          type="text"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          onBlur={() => updateLeagueSettings({ admin_email: adminEmail.trim() })}
          placeholder="commissioner@email.com"
        />
      </div>
      <p className="a-desc" style={{ margin: "8px 0 20px 0" }}>
        Whoever logs in with this email gets full admin access — Undo, pause the clock, and this Admin tab. A
        commissioner who also owns a team should use a different email for their team&apos;s owner slot below.
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
