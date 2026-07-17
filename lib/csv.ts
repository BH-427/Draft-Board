export interface ParsedCsvPlayer {
  name: string;
  pos: string;
  nfl_team: string;
  rank: number | null;
}

export interface ParsedCsvResult {
  players: ParsedCsvPlayer[];
  warnings: string[];
}

/** Splits one CSV line into fields, respecting double-quoted fields (with "" escaping). */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function parseCSV(text: string): string[][] {
  return text
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0)
    .map(parseCSVLine);
}

const RANK_KEYWORDS = ["rk", "rank", "overall"];
const NAME_KEYWORDS = ["player", "name"];
const POS_KEYWORDS = ["pos", "position"];
const TEAM_KEYWORDS = ["team", "tm", "nfl"];

function guessColumn(header: string[], keywords: string[]): number {
  const lower = header.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  for (const kw of keywords) {
    const idx = lower.findIndex((h) => h === kw);
    if (idx > -1) return idx;
  }
  for (const kw of keywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx > -1) return idx;
  }
  return -1;
}

function looksLikeHeader(row: string[]): boolean {
  // A header row's cells are mostly non-numeric.
  const numericCount = row.filter((cell) => /^\d+$/.test(cell.trim())).length;
  return numericCount <= row.length / 2;
}

/** "RB1" -> "RB", "DST" -> "DST", "WR12" -> "WR" */
function stripPositionRank(raw: string): string {
  const match = raw.trim().toUpperCase().match(/^[A-Z]+/);
  return match ? match[0] : raw.trim().toUpperCase();
}

const NFL_TEAM_ALIASES: Record<string, string> = {};
function alias(code: string, ...names: string[]) {
  NFL_TEAM_ALIASES[code.toLowerCase()] = code;
  for (const n of names) NFL_TEAM_ALIASES[n.toLowerCase().replace(/[^a-z]/g, "")] = code;
}
alias("ARI", "Arizona", "Cardinals", "Arizona Cardinals");
alias("ATL", "Atlanta", "Falcons", "Atlanta Falcons");
alias("BAL", "Baltimore", "Ravens", "Baltimore Ravens");
alias("BUF", "Buffalo", "Bills", "Buffalo Bills");
alias("CAR", "Carolina", "Panthers", "Carolina Panthers");
alias("CHI", "Chicago", "Bears", "Chicago Bears");
alias("CIN", "Cincinnati", "Bengals", "Cincinnati Bengals");
alias("CLE", "Cleveland", "Browns", "Cleveland Browns");
alias("DAL", "Dallas", "Cowboys", "Dallas Cowboys");
alias("DEN", "Denver", "Broncos", "Denver Broncos");
alias("DET", "Detroit", "Lions", "Detroit Lions");
alias("GB", "GreenBay", "Green Bay", "Packers", "Green Bay Packers");
alias("HOU", "Houston", "Texans", "Houston Texans");
alias("IND", "Indianapolis", "Colts", "Indianapolis Colts");
alias("JAC", "Jacksonville", "Jaguars", "Jacksonville Jaguars", "JAX");
alias("KC", "KansasCity", "Kansas City", "Chiefs", "Kansas City Chiefs");
alias("LV", "LasVegas", "Las Vegas", "Raiders", "Las Vegas Raiders", "Oakland", "Oakland Raiders");
alias("LAC", "LosAngelesChargers", "LA Chargers", "Chargers", "San Diego", "San Diego Chargers");
alias("LAR", "LosAngelesRams", "LA Rams", "Rams", "St Louis", "St Louis Rams");
alias("MIA", "Miami", "Dolphins", "Miami Dolphins");
alias("MIN", "Minnesota", "Vikings", "Minnesota Vikings");
alias("NE", "NewEngland", "New England", "Patriots", "New England Patriots");
alias("NO", "NewOrleans", "New Orleans", "Saints", "New Orleans Saints");
alias("NYG", "NewYorkGiants", "NY Giants", "Giants", "New York Giants");
alias("NYJ", "NewYorkJets", "NY Jets", "Jets", "New York Jets");
alias("PHI", "Philadelphia", "Eagles", "Philadelphia Eagles");
alias("PIT", "Pittsburgh", "Steelers", "Pittsburgh Steelers");
alias("SEA", "Seattle", "Seahawks", "Seattle Seahawks");
alias("SF", "SanFrancisco", "San Francisco", "49ers", "San Francisco 49ers", "NinerS");
alias("TB", "TampaBay", "Tampa Bay", "Buccaneers", "Tampa Bay Buccaneers", "Bucs");
alias("TEN", "Tennessee", "Titans", "Tennessee Titans");
alias("WAS", "Washington", "Commanders", "Washington Commanders", "WSH");
alias("FA", "FreeAgent", "Free Agent", "None", "");

/** Normalizes a team cell (short code, full city/team name, or mascot) to a standard code. Falls back to the trimmed uppercase input if unrecognized. */
export function normalizeNflTeam(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (key in NFL_TEAM_ALIASES) return NFL_TEAM_ALIASES[key];
  return raw.trim().toUpperCase();
}

/**
 * Tolerant rankings CSV parser. Auto-detects a header row (or its absence)
 * and guesses which columns hold rank/name/position/team, falling back to
 * the first four columns positionally. Handles a position column formatted
 * like "RB1"/"WR12" (rank-suffixed) as well as a bare "RB"/"WR".
 */
export function parseRankingsCsv(text: string): ParsedCsvResult {
  const warnings: string[] = [];
  const rows = parseCSV(text);
  if (rows.length === 0) return { players: [], warnings: ["File was empty."] };

  const first = rows[0];
  const hasHeader = looksLikeHeader(first);
  const header = hasHeader ? first : [];
  const dataRows = hasHeader ? rows.slice(1) : rows;

  let rankCol = hasHeader ? guessColumn(header, RANK_KEYWORDS) : 0;
  let nameCol = hasHeader ? guessColumn(header, NAME_KEYWORDS) : 1;
  let posCol = hasHeader ? guessColumn(header, POS_KEYWORDS) : 2;
  let teamCol = hasHeader ? guessColumn(header, TEAM_KEYWORDS) : 3;

  if (rankCol === -1) rankCol = 0;
  if (nameCol === -1) nameCol = 1;
  if (posCol === -1) posCol = 2;
  if (teamCol === -1) {
    // FantasyPros-style exports put TEAM before POS positionally
    teamCol = 3;
  }

  const players: ParsedCsvPlayer[] = [];
  for (const row of dataRows) {
    const name = (row[nameCol] || "").trim();
    if (!name) continue;
    const rankRaw = (row[rankCol] || "").trim();
    const rank = /^\d+$/.test(rankRaw) ? parseInt(rankRaw, 10) : null;
    const pos = stripPositionRank(row[posCol] || "");
    const nfl_team = normalizeNflTeam(row[teamCol] || "");
    players.push({ name, pos, nfl_team, rank });
  }

  if (players.length === 0) {
    warnings.push("No player rows could be parsed — check the column layout.");
  }

  // Sort by parsed rank when available; rows without a rank keep their file order, appended after ranked ones.
  const ranked = players.filter((p) => p.rank != null).sort((a, b) => (a.rank as number) - (b.rank as number));
  const unranked = players.filter((p) => p.rank == null);
  return { players: [...ranked, ...unranked], warnings };
}
