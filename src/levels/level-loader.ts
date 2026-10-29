import { parseLevel, type LevelData } from "./level-data";

// Every map under levels/ becomes a lazily loaded module, so the production
// build only fetches a test level when a test asks for it.
const levelModules = import.meta.glob("../../levels/**/*.json", {
  import: "default",
});

export function levelPath(id: string): string {
  return `../../levels/${id}.json`;
}

export async function loadLevelData(id: string): Promise<LevelData> {
  const load = levelModules[levelPath(id)];
  if (!load) {
    throw new Error(`Unknown level "${id}"`);
  }
  return parseLevel(id, await load());
}
