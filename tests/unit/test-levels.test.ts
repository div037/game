import { describe, expect, test } from "vitest";
import {
  FLOOR_TOP_ROW,
  hasFloor,
  loadLevelFile,
  objectsOfType,
  tileRow,
  tileX,
} from "./level-helpers";

function expectStartAndPortal(
  level: ReturnType<typeof loadLevelFile>,
  startX: number,
  portalX: number,
) {
  const starts = objectsOfType(level, "player-start");
  const portals = objectsOfType(level, "exit-portal");
  expect(starts).toHaveLength(1);
  expect(portals).toHaveLength(1);
  expect(tileX(starts[0]!)).toBe(startX);
  expect(tileX(portals[0]!)).toBe(portalX);
}

describe("DEBUG-TEST-LEVELS", () => {
  test("DEBUG-TEST-LEVELS-01 flat-ground", () => {
    const level = loadLevelFile("test/flat-ground");
    expect([level.widthTiles, level.heightTiles]).toEqual([40, 17]);
    expect(hasFloor(level)).toBe(true);
    expectStartAndPortal(level, 5, 37);
    expect(objectsOfType(level, "coin")).toHaveLength(0);
  });

  test("DEBUG-TEST-LEVELS-02 wall", () => {
    const level = loadLevelFile("test/wall");
    expect([level.widthTiles, level.heightTiles]).toEqual([40, 17]);
    expect(hasFloor(level)).toBe(true);
    expectStartAndPortal(level, 8, 37);
    for (let row = FLOOR_TOP_ROW - 4; row < FLOOR_TOP_ROW; row += 1) {
      expect(level.solidAt(10, row)).toBe(true);
      expect(level.solidAt(9, row)).toBe(false);
      expect(level.solidAt(11, row)).toBe(false);
    }
    expect(level.solidAt(10, FLOOR_TOP_ROW - 5)).toBe(false);
  });

  test("DEBUG-TEST-LEVELS-03 ceiling", () => {
    const level = loadLevelFile("test/ceiling");
    expect([level.widthTiles, level.heightTiles]).toEqual([40, 17]);
    expect(hasFloor(level)).toBe(true);
    expectStartAndPortal(level, 5, 37);
    for (let x = 3; x <= 12; x += 1) {
      expect(level.solidAt(x, 12)).toBe(true);
      expect(level.solidAt(x, 13)).toBe(false);
      expect(level.solidAt(x, 14)).toBe(false);
      expect(level.solidAt(x, 11)).toBe(false);
    }
    expect(level.solidAt(2, 12)).toBe(false);
    expect(level.solidAt(13, 12)).toBe(false);
  });

  test("DEBUG-TEST-LEVELS-04 pit", () => {
    const level = loadLevelFile("test/pit");
    expect([level.widthTiles, level.heightTiles]).toEqual([40, 17]);
    expectStartAndPortal(level, 5, 37);
    expect(hasFloor(level, [12, 13])).toBe(true);
  });

  test("DEBUG-TEST-LEVELS-05 coins", () => {
    const level = loadLevelFile("test/coins");
    expect([level.widthTiles, level.heightTiles]).toEqual([40, 17]);
    expectStartAndPortal(level, 5, 37);
    const coins = objectsOfType(level, "coin");
    expect(coins.map(tileX).sort((a, b) => a - b)).toEqual([7, 9, 11, 13, 15]);
    for (const coin of coins) {
      expect(tileRow(coin)).toBe(FLOOR_TOP_ROW - 1);
    }
    expect(hasFloor(level, [20, 21])).toBe(true);
  });

  test("DEBUG-TEST-LEVELS-06 tall-drop", () => {
    const level = loadLevelFile("test/tall-drop");
    expect([level.widthTiles, level.heightTiles]).toEqual([20, 40]);
    expect(hasFloor(level)).toBe(true);
    const portals = objectsOfType(level, "exit-portal");
    expect(portals).toHaveLength(1);
    expect(tileX(portals[0]!)).toBe(17);
    for (let x = 1; x <= 3; x += 1) {
      expect(level.solidAt(x, 3)).toBe(true);
      expect(level.solidAt(x, 2)).toBe(false);
      expect(level.solidAt(x, 4)).toBe(false);
    }
    expect(level.solidAt(0, 3)).toBe(false);
    expect(level.solidAt(4, 3)).toBe(false);
    const starts = objectsOfType(level, "player-start");
    expect(starts).toHaveLength(1);
    expect(tileX(starts[0]!)).toBe(2);
    expect(tileRow(starts[0]!)).toBe(2);
  });
});
