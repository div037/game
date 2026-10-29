import { describe, expect, test } from "vitest";
import { pits, steps } from "../../src/levels/level-data";
import { loadLevelFile, objectsOfType, tileRow, tileX } from "./level-helpers";

const level = loadLevelFile("ruins-1");
const FLOOR_TOP = 15;

/** Height of the stone stack standing on the floor at column x, in tiles. */
function wallHeight(x: number): number {
  let height = 0;
  for (let row = FLOOR_TOP - 1; row >= 0; row -= 1) {
    if (!level.solidAt(x, row)) {
      break;
    }
    height += 1;
  }
  return height;
}

function coinAt(x: number, heightAboveFloor: number): boolean {
  return objectsOfType(level, "coin").some(
    (coin) =>
      tileX(coin) === x && tileRow(coin) === FLOOR_TOP - heightAboveFloor,
  );
}

describe("levels", () => {
  test("LEVEL-START-EXIT-01 Mapa Ruin 1", () => {
    expect(objectsOfType(level, "player-start")).toHaveLength(1);
    expect(objectsOfType(level, "exit-portal")).toHaveLength(1);
  });

  test("LEVEL-REACHABLE-01 Sprawdzenie mapy Ruin 1", () => {
    const pitWidths = pits(level).map((pit) => pit.width);
    expect(Math.max(...pitWidths)).toBe(2);
    const rises = steps(level).map((step) => step.rise);
    expect(Math.max(...rises)).toBe(2);
  });

  test("LEVEL-RUINS-1-01 Wymiary i posadzka", () => {
    expect(level.widthTiles).toBe(120);
    expect(level.heightTiles).toBe(17);
    const pitColumns = [40, 78, 79];
    for (let x = 0; x < 120; x += 1) {
      const solid = !pitColumns.includes(x);
      expect(level.solidAt(x, 15)).toBe(solid);
      expect(level.solidAt(x, 16)).toBe(solid);
    }
    expect(objectsOfType(level, "coin")).toHaveLength(10);
  });

  test("LEVEL-RUINS-1-02 Kolejność przeszkód", () => {
    const start = objectsOfType(level, "player-start")[0]!;
    expect(tileX(start)).toBe(2);
    expect(coinAt(6, 1) && coinAt(7, 1) && coinAt(8, 1)).toBe(true);
    expect([wallHeight(16), wallHeight(17)]).toEqual([1, 1]);
    expect(coinAt(16, 2)).toBe(true);
    expect([wallHeight(28), wallHeight(29), wallHeight(30)]).toEqual([2, 2, 2]);
    expect(pits(level)).toEqual([
      { x: 40, width: 1 },
      { x: 78, width: 2 },
    ]);
    expect([52, 53, 55, 56, 58, 59].map(wallHeight)).toEqual([
      1, 1, 2, 2, 3, 3,
    ]);
    expect(coinAt(52, 2) && coinAt(55, 3) && coinAt(58, 4)).toBe(true);
    expect(coinAt(78, 2) && coinAt(79, 2)).toBe(true);
    expect([92, 93, 94].map(wallHeight)).toEqual([1, 2, 3]);
    expect(coinAt(94, 4)).toBe(true);
    const portal = objectsOfType(level, "exit-portal")[0]!;
    expect(tileX(portal)).toBe(114);
    expect(tileRow(portal) + portal.height / 32).toBe(FLOOR_TOP);
    // Nothing else stands on the floor.
    const known = new Set([
      16, 17, 28, 29, 30, 52, 53, 55, 56, 58, 59, 92, 93, 94,
    ]);
    for (let x = 0; x < 120; x += 1) {
      if (!known.has(x)) {
        expect(wallHeight(x)).toBe(0);
      }
    }
  });
});
