import { expect, test } from "@playwright/test";
import {
  BODY_HALF_WIDTH,
  FLOOR_TOP_Y,
  player,
  setPlayerPosition,
  STANDING_Y,
  startLevel,
  step,
  stepUntil,
  TILE,
} from "./helpers";

test("PHYSICS-GRAVITY-01 Spadanie z miejsca", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  // Feet 10 tiles above the floor.
  const startY = FLOOR_TOP_Y - 10 * TILE - 15;
  await setPlayerPosition(page, 176, startY);
  await step(page, 24); // 0.4 s
  const after = await player(page);
  expect(Math.abs(after.y - startY - 3 * TILE)).toBeLessThanOrEqual(8);
});

test("PHYSICS-MAX-FALL-01 Długie spadanie", async ({ page }) => {
  await startLevel(page, "test/tall-drop");
  await page.keyboard.down("ArrowRight");
  const { state } = await stepUntil(page, (s) => !s.player!.onGround, 120);
  await page.keyboard.up("ArrowRight");
  expect(state.player!.onGround).toBe(false);
  await step(page, 60);
  const after = await player(page);
  expect(after.onGround).toBe(false);
  expect(Math.abs(after.vy - 20 * TILE)).toBeLessThanOrEqual(0.5 * TILE);
});

test("PHYSICS-SOLID-01 Stanie na posadzce", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  await setPlayerPosition(page, 176, FLOOR_TOP_Y - 3 * TILE - 15);
  await step(page, 60);
  const after = await player(page);
  expect(after.onGround).toBe(true);
  expect(after.y).toBe(STANDING_Y);
  await step(page, 30);
  expect((await player(page)).y).toBe(STANDING_Y);
});

test("PHYSICS-SOLID-02 Mur", async ({ page }) => {
  await startLevel(page, "test/wall");
  await page.keyboard.down("ArrowRight");
  await step(page, 120);
  await page.keyboard.up("ArrowRight");
  const after = await player(page);
  const wallLeft = 10 * TILE;
  expect(after.x + BODY_HALF_WIDTH).toBe(wallLeft);
  expect(after.x).toBeLessThan(wallLeft);
});

test("PHYSICS-SOLID-03 Kamień nad głową", async ({ page }) => {
  await startLevel(page, "test/ceiling");
  const ceilingBottom = 13 * TILE;
  await page.keyboard.press("Space");
  let landed = -1;
  for (let i = 1; i <= 60; i += 1) {
    await step(page, 1);
    const state = await player(page);
    expect(state.y - 15).toBeGreaterThanOrEqual(ceilingBottom);
    if (i > 2 && state.onGround) {
      landed = i;
      break;
    }
  }
  expect(landed).toBeGreaterThan(0);
  expect(landed).toBeLessThan(48);
});
