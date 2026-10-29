import { expect, test } from "@playwright/test";
import {
  BODY_HALF_WIDTH,
  completeLevel,
  fallIntoPit,
  GEOMETRY,
  holdKey,
  player,
  readState,
  setPlayerPosition,
  STANDING_Y,
  startLevel,
  step,
  stepUntil,
  TILE,
} from "./helpers";

const TOLERANCE = 8;

/** Steps one by one and records the highest point and the landing step. */
async function trackJump(page: Parameters<typeof player>[0], maxSteps = 70) {
  const start = await player(page);
  let highest = start.y;
  let landing = -1;
  for (let i = 1; i <= maxSteps; i += 1) {
    await step(page, 1);
    const state = await player(page);
    highest = Math.min(highest, state.y);
    if (i > 2 && state.onGround) {
      landing = i;
      break;
    }
  }
  return { rise: start.y - highest, landing };
}

test("PLAYER-RUN-01 Bieg przez 2 sekundy", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const before = await player(page);
  await holdKey(page, "ArrowRight", 120);
  const after = await player(page);
  expect(Math.abs(after.x - before.x - 6 * TILE)).toBeLessThanOrEqual(
    TOLERANCE,
  );
});

test("PLAYER-RUN-02 Zatrzymanie bez ślizgania", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  await holdKey(page, "ArrowRight", 30);
  const released = await player(page);
  await step(page, 30);
  const after = await player(page);
  expect(Math.abs(after.x - released.x)).toBeLessThanOrEqual(3.2);
});

test("PLAYER-RUN-03 Bieg w powietrzu", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  await page.keyboard.press("Space");
  await step(page, 6);
  const before = await player(page);
  expect(before.onGround).toBe(false);
  await holdKey(page, "ArrowLeft", 30);
  const after = await player(page);
  expect(after.onGround).toBe(false);
  expect(Math.abs(after.x - before.x + 48)).toBeLessThanOrEqual(1.6);
});

test("PLAYER-JUMP-01 Skok z posadzki", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  await page.keyboard.press("Space");
  const { rise, landing } = await trackJump(page);
  expect(Math.abs(rise - 3 * TILE)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(landing - 48)).toBeLessThanOrEqual(6);
});

test("PLAYER-JUMP-02 Brak skoku w powietrzu", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const start = await player(page);
  await page.keyboard.press("Space");
  await step(page, 12); // 0.2 s in the air
  await page.keyboard.press("Space");
  let highest = start.y;
  let landing = -1;
  for (let i = 13; i <= 70; i += 1) {
    await step(page, 1);
    const state = await player(page);
    highest = Math.min(highest, state.y);
    if (state.onGround) {
      landing = i;
      break;
    }
  }
  expect(start.y - highest).toBeLessThanOrEqual(3 * TILE + TOLERANCE);
  expect(Math.abs(landing - 48)).toBeLessThanOrEqual(6);
});

test("PLAYER-JUMP-03 Skok w biegu nad dziurą", async ({ page }) => {
  await startLevel(page, "test/pit");
  const pitLeft = 12 * TILE;
  const pitRight = 14 * TILE;
  // Running right, the player reaches the edge of the pit.
  await setPlayerPosition(page, pitLeft - BODY_HALF_WIDTH - 4, STANDING_Y);
  await page.keyboard.down("ArrowRight");
  await step(page, 2);
  const takeoff = await player(page);
  expect(takeoff.onGround).toBe(true);
  await page.keyboard.press("Space");
  await step(page, 3);
  expect((await player(page)).onGround).toBe(false);
  const { state } = await stepUntil(
    page,
    (s) => s.player !== null && s.player.onGround,
    70,
  );
  await page.keyboard.up("ArrowRight");
  expect(state.player!.onGround).toBe(true);
  expect(state.player!.y).toBe(STANDING_Y);
  expect(state.player!.x + BODY_HALF_WIDTH).toBeGreaterThan(pitRight);
  expect(
    Math.abs(state.player!.x - takeoff.x - 2.4 * TILE),
  ).toBeLessThanOrEqual(TOLERANCE);
});

test("PLAYER-FACING-01 Obrót w lewo", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  expect((await player(page)).facing).toBe("right");
  await holdKey(page, "ArrowLeft", 6);
  await step(page, 6);
  expect((await player(page)).facing).toBe("left");
});

test("PLAYER-FACING-02 Start poziomu", async ({ page }) => {
  await startLevel(page, "ruins-1");
  await step(page, 60);
  expect((await player(page)).facing).toBe("right");
});

test("PLAYER-HEARTS-01 Pełne serca po wejściu do poziomu", async ({ page }) => {
  await startLevel(page, "test/pit");
  await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
  await step(page, 31);
  await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
  await step(page, 31);
  expect((await readState(page)).hearts).toBe(1);
  await completeLevel(page, GEOMETRY["test/pit"]!.portalLeft);
  await step(page, 60);
  await page.keyboard.press("Space");
  await stepUntil(page, (s) => s.scene === "Title", 30);
  await step(page, 60);
  await page.keyboard.press("Space");
  const { state } = await stepUntil(page, (s) => s.scene === "Game", 60, 5);
  expect(state.scene).toBe("Game");
  expect(state.hearts).toBe(3);
});

test("PLAYER-PIT-01 Strata serca", async ({ page }) => {
  await startLevel(page, "test/pit");
  expect((await readState(page)).hearts).toBe(3);
  await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
  expect((await readState(page)).hearts).toBe(2);
  await step(page, 30);
  const after = await player(page);
  expect(after.x).toBe(5 * TILE + 16);
  expect(after.y).toBe(STANDING_Y);
  expect(after.onGround).toBe(true);
});

test("PLAYER-PIT-02 Ostatnie serce", async ({ page }) => {
  await startLevel(page, "test/pit");
  for (let i = 0; i < 2; i += 1) {
    await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
    await step(page, 31);
  }
  expect((await readState(page)).hearts).toBe(1);
  await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
  const { state } = await stepUntil(page, (s) => s.scene === "GameOver", 30);
  expect(state.scene).toBe("GameOver");
});

test("PLAYER-BOUNDS-01 Lewy brzeg", async ({ page }) => {
  await startLevel(page, "ruins-1");
  expect((await player(page)).x).toBe(2 * TILE + 16);
  await holdKey(page, "ArrowLeft", 120);
  const after = await player(page);
  expect(after.x - BODY_HALF_WIDTH).toBe(0);
});
