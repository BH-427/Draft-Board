"use client";

import { useState } from "react";
import { useDraftData } from "@/lib/useDraftData";

export function LoginModal({ forced, onClose }: { forced: boolean; onClose: () => void }) {
  const { findLoginMatch, setCurrentUser } = useDraftData();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleContinue() {
    const result = findLoginMatch(email);
    if (!result || result.type !== "admin") {
      setError("That doesn't match the admin email. Team owners should tap their team name on the previous screen instead.");
      return;
    }
    setCurrentUser({ type: "admin" });
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
        <h3>Draft Admin</h3>
        <p className="a-desc">Enter the admin email set up in the league config.</p>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          placeholder="admin@email.com"
          className="queue-team-select"
          style={{ marginBottom: 12 }}
        />
        <button className="btn primary" style={{ width: "100%" }} onClick={handleContinue}>
          Continue
        </button>
        <div className="login-error">{error}</div>
      </div>
    </div>
  );
}
