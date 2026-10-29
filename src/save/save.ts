// Browser save: total coins and the coins collected in each level.
// Format and key are part of the debug spec (DEBUG-SAVE).

export const SAVE_KEY = "game-save";

export interface SaveData {
  coins: number;
  collected: Record<string, number[]>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function emptySave(): SaveData {
  return { coins: 0, collected: {} };
}

export function loadSave(storage: StorageLike): SaveData {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) {
    return emptySave();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const coins =
      typeof parsed.coins === "number" && Number.isFinite(parsed.coins)
        ? Math.max(0, Math.floor(parsed.coins))
        : 0;
    const collected: Record<string, number[]> = {};
    if (parsed.collected && typeof parsed.collected === "object") {
      for (const [level, ids] of Object.entries(parsed.collected)) {
        if (Array.isArray(ids)) {
          collected[level] = ids.filter((id) => typeof id === "number");
        }
      }
    }
    return { coins, collected };
  } catch {
    return emptySave();
  }
}

export function writeSave(storage: StorageLike, save: SaveData): void {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function resetSave(storage: StorageLike): void {
  storage.removeItem(SAVE_KEY);
}

export function collectedIn(save: SaveData, levelId: string): number[] {
  return save.collected[levelId] ?? [];
}

/** Returns a new save with the coin added, or the same save if known. */
export function collectCoin(
  save: SaveData,
  levelId: string,
  coinId: number,
): SaveData {
  const ids = collectedIn(save, levelId);
  if (ids.includes(coinId)) {
    return save;
  }
  return {
    coins: save.coins + 1,
    collected: { ...save.collected, [levelId]: [...ids, coinId] },
  };
}
