import { parseLevel, type LevelData } from "./level-data";

// Every map under levels/ becomes a lazily loaded module, so the production
// build only fetches a test level when a test asks for it.
const levelModules = import.meta.glob("../../levels/**/*.json", {
  import: "default",
});

export function levelPath(id: string): string {
  return `../../levels/${id}.json`;
}

const cache = new Map<string, LevelData>();

/** A level that was loaded before, without waiting; null otherwise. */
export function cachedLevelData(id: string): LevelData | null {
  return cache.get(id) ?? null;
}

export async function loadLevelData(id: string): Promise<LevelData> {
  const cached = cache.get(id);
  if (cached) {
    return cached;
  }
  const load = levelModules[levelPath(id)];
  if (!load) {
    throw new Error(`Unknown level "${id}"`);
  }
  const level = parseLevel(id, await load());
  cache.set(id, level);
  return level;
}
