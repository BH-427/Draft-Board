"use client";

export type TabKey = "board" | "players" | "myteam" | "results" | "admin";

const TAB_LABELS: Record<TabKey, string> = {
  board: "Draft Board",
  players: "Player List",
  myteam: "My Team",
  results: "Results",
  admin: "Admin",
};

export function Tabs({
  active,
  onChange,
  showAdmin,
  showResults,
  adminOnly,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  showAdmin: boolean;
  showResults?: boolean;
  adminOnly?: boolean;
}) {
  const tabs: TabKey[] = adminOnly
    ? ["admin"]
    : ["board", "players", "myteam", ...(showResults ? (["results"] as TabKey[]) : []), ...(showAdmin ? (["admin"] as TabKey[]) : [])];
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button key={tab} className={`tab-btn ${active === tab ? "active" : ""}`} onClick={() => onChange(tab)}>
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
