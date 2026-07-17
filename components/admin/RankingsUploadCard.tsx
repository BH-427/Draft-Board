"use client";

import { useRef, useState } from "react";
import { useDraftData } from "@/lib/useDraftData";
import { parseRankingsCsv, type ParsedCsvPlayer } from "@/lib/csv";
import { useToast } from "@/components/Toast";

export function RankingsUploadCard() {
  const { draftPicks, replacePlayerPool } = useDraftData();
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ParsedCsvPlayer[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast, ToastEl } = useToast();

  const picksAlreadyMade = draftPicks.some((p) => p.player_id != null);

  async function handleFile(file: File) {
    const text = await file.text();
    const result = parseRankingsCsv(text);
    setParsed(result.players);
    setWarnings(result.warnings);
    setFileName(file.name);
  }

  async function confirmApply() {
    if (!parsed) return;
    if (picksAlreadyMade) {
      const ok = window.confirm(
        "Picks have already been made in this draft. Replacing the player pool now will clear those picks' player references. Continue?"
      );
      if (!ok) return;
    }
    await replacePlayerPool(parsed.map((p) => ({ name: p.name, pos: p.pos, nfl_team: p.nfl_team })));
    showToast(`Replaced the player pool with ${parsed.length} players from ${fileName}.`);
    setParsed(null);
  }

  return (
    <div className="a-card">
      <h2>Rankings Upload</h2>
      <p className="a-desc">
        Upload a CSV of player rankings (name, position, team, rank). Typically loaded about a week before draft day.
      </p>
      <div
        className={`dropzone ${dragOver ? "drag" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <div className="icon">⬆</div>
        <div className="main-txt">Drop CSV here, or click to browse</div>
        <div className="sub-txt">
          Expected columns: rank, name, position, team — team can be a short code, a full city/team name, or just the
          mascot (e.g. &quot;SF&quot;, &quot;San Francisco&quot;, &quot;Ravens&quot; all work)
        </div>
      </div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {parsed && (
        <div>
          <div className="preview-meta">
            Parsed {parsed.length} players from {fileName}
            {warnings.length > 0 ? ` — ${warnings.join(" ")}` : ""}
            {picksAlreadyMade ? " — warning: picks have already been made in this draft." : ""}
          </div>
          <table className="preview">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Pos</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {parsed.slice(0, 25).map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.pos}</td>
                  <td>{p.nfl_team}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="apply-bar">
            <button className="btn primary" onClick={confirmApply}>
              Confirm &amp; Replace Player Pool
            </button>
            <button className="btn" onClick={() => setParsed(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {ToastEl}
    </div>
  );
}
