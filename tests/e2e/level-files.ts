import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  groundHeights,
  objectsOfType,
  parseLevel,
  type LevelData,
} from "../../src/levels/level-data";

export function loadLevelFile(id: string): LevelData {
  const file = join(process.cwd(), "levels", `${id}.json`);
  return parseLevel(id, JSON.parse(readFileSync(file, "utf8")));
}

export function coinIds(level: LevelData): number[] {
  return objectsOfType(level, "coin").map((coin) => coin.id);
}

export function coinCenters(level: LevelData): [number, number][] {
  return objectsOfType(level, "coin").map((coin) => [
    coin.x + coin.width / 2,
    coin.y + coin.height / 2,
  ]);
}

export { groundHeights };
