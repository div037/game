import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLevel, type LevelData } from "../../src/levels/level-data";

export function loadLevelFile(id: string): LevelData {
  const file = join(process.cwd(), "levels", `${id}.json`);
  return parseLevel(id, JSON.parse(readFileSync(file, "utf8")));
}

export const FLOOR_TOP_ROW = 15;

/** True when every column except `pits` has solid tiles in the 2 floor rows. */
export function hasFloor(level: LevelData, pits: number[] = []): boolean {
  for (let x = 0; x < level.widthTiles; x += 1) {
    const expected = !pits.includes(x);
    for (let row = level.heightTiles - 2; row < level.heightTiles; row += 1) {
      if (level.solidAt(x, row) !== expected) {
        return false;
      }
    }
  }
  return true;
}

export function objectsOfType(level: LevelData, type: string) {
  return level.objects.filter((object) => object.type === type);
}

export function tileX(object: { x: number }): number {
  return Math.floor(object.x / 32);
}

export function tileRow(object: { y: number }): number {
  return Math.floor(object.y / 32);
}
