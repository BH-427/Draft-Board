"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

export function LoginModal({ forced, onClose }: { forced: boolean; onClose: () => void }) {
  const { findLoginMatch, setCurrentUser } = useDraftData();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [match, setMatch] = useState<ReturnType<typeof findLoginMatch>>(null);

  function handleContinue() {
    const result = findLoginMatch(email);
    if (!result) {
      setError("No team or admin account matches that email. Check with your commissioner.");
      return;
    }
    setError("");
    setMatch(result);
  }

  function handleConfirm() {
    if (!match) return;
    if (match.type === "admin") setCurrentUser({ type: "admin" });
    else setCurrentUser({ type: "team", teamId: match.teamId });
    onClose();
  }

  return (
    <div className="login-modal-backdrop">
      <div className="login-modal">
        {!forced && (
          <button className="pm-close" onClick={onClose}>
            ✕
          </button>
        )}
        <h3>Log In</h3>
        {!match ? (
          <div>
            <p className="a-desc">Enter the email address your commissioner used to invite you.</p>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              placeholder="you@email.com"
              className="queue-team-select"
              style={{ marginBottom: 12 }}
            />
            <button className="btn primary" style={{ width: "100%" }} onClick={handleContinue}>
              Continue
            </button>
            <div className="login-error">{error}</div>
          </div>
        ) : (
          <div>
            <p className="a-desc">Is this your team?</p>
            <div className="login-team-confirm">{match.type === "admin" ? "Draft Admin" : match.teamName}</div>
            <button className="btn primary" style={{ width: "100%", marginTop: 14 }} onClick={handleConfirm}>
              Yes, log me in
            </button>
            <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={() => setMatch(null)}>
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
