"use client";

export type TabKey = "board" | "players" | "myteam" | "admin";

const TAB_LABELS: Record<TabKey, string> = {
  board: "Draft Board",
  players: "Player List",
  myteam: "My Team",
  admin: "Admin",
};

export function Tabs({
  active,
  onChange,
  showAdmin,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  showAdmin: boolean;
}) {
  const tabs: TabKey[] = showAdmin ? ["board", "players", "myteam", "admin"] : ["board", "players", "myteam"];
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
