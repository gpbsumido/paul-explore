import { PlayerRow, SortKey } from "@/types/nba";

export const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Player" },
  { key: "pos", label: "Pos" },
  { key: "gp", label: "GP" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
];

export function getSortValue(row: PlayerRow, key: SortKey): string | number {
  switch (key) {
    case "name":
      return row.name.toLowerCase();
    case "pos":
      return row.pos.toLowerCase();
    case "gp":
      return row.stats?.games_played ?? -1;
    case "pts":
      return row.stats?.pts ?? -1;
    case "reb":
      return row.stats?.reb ?? -1;
    case "ast":
      return row.stats?.ast ?? -1;
    case "stl":
      return row.stats?.stl ?? -1;
    case "blk":
      return row.stats?.blk ?? -1;
  }
}
