"use client";

import { useEffect, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { useToast } from "@/components/Toast";
import type { DraftType } from "@/lib/types";

export function DraftTypeCard() {
  const { teams, leagueSettings, applyDraftOrderAndType } = useDraftData();
  const [draftType, setDraftType] = useState<DraftType>("snake");
  const [customDirections, setCustomDirections] = useState<Record<string, "forward" | "reverse">>({});
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (leagueSettings) {
      setDraftType(leagueSettings.draft_type);
      setCustomDirections(leagueSettings.custom_directions || {});
    }
  }, [leagueSettings]);

  const totalRounds = leagueSettings?.total_rounds ?? 15;

  async function apply() {
    const orderedTeamIds = [...teams].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.id);
    await applyDraftOrderAndType({ orderedTeamIds, draftType, customDirections, totalRounds });
    showToast("Draft order & type applied — the mock board has been rebuilt.");
  }

  return (
    <div className="a-card">
      <h2>Draft Type</h2>
      <p className="a-desc">How the round-1 order above carries through the rest of the draft.</p>
      <div className="draft-type-options">
        <label className={`dt-option ${draftType === "snake" ? "active" : ""}`}>
          <input type="radio" name="draftType" checked={draftType === "snake"} onChange={() => setDraftType("snake")} />
          <div>
            <b>Snake</b>
            <span>Order flips every round — round 2 runs pick 12 → 1, round 3 flips back, and so on.</span>
          </div>
        </label>
        <label className={`dt-option ${draftType === "linear" ? "active" : ""}`}>
          <input type="radio" name="draftType" checked={draftType === "linear"} onChange={() => setDraftType("linear")} />
          <div>
            <b>Linear</b>
            <span>Same order every single round — pick 1 → 12, every round, no flip.</span>
          </div>
        </label>
        <label className={`dt-option ${draftType === "custom" ? "active" : ""}`}>
          <input type="radio" name="draftType" checked={draftType === "custom"} onChange={() => setDraftType("custom")} />
          <div>
            <b>Custom</b>
            <span>Pick which rounds run forward vs. reversed — e.g. a 3rd-round reversal league.</span>
          </div>
        </label>
      </div>

      {draftType === "custom" && (
        <div style={{ marginTop: 16 }}>
          <label className="field-label">Per-round direction</label>
          <div className="custom-rounds-list">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
              const dir = customDirections[String(round)] || (round % 2 === 1 ? "forward" : "reverse");
              return (
                <div className="cr-item" key={round}>
                  <span className="cr-round">Round {round}</span>
                  <button
                    className={`cr-dir-btn ${dir}`}
                    onClick={() =>
                      setCustomDirections((prev) => ({
                        ...prev,
                        [String(round)]: dir === "forward" ? "reverse" : "forward",
                      }))
                    }
                  >
                    {dir === "forward" ? "Forward" : "Reverse"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="apply-bar">
        <button className="btn primary" onClick={apply}>
          Apply Draft Order &amp; Type
        </button>
        <span className="apply-note">Rebuilds the mock board with the new order — resets all picks made so far.</span>
      </div>
      {ToastEl}
    </div>
  );
}
