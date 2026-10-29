import { expect, test } from "@playwright/test";
import {
  BODY_HALF_WIDTH,
  GEOMETRY,
  holdKey,
  openGame,
  pause,
  readState,
  runBot,
  setPlayerPosition,
  STANDING_Y,
  startLevel,
  step,
  stepUntil,
  TILE,
} from "./helpers";
import { coinCenters, groundHeights, loadLevelFile } from "./level-files";

test("LEVEL-START-EXIT-02 Pojawienie się na starcie", async ({ page }) => {
  await openGame(page);
  await pause(page);
  await step(page, 60);
  await page.keyboard.press("Space");
  const { state, steps } = await stepUntil(
    page,
    (s) => s.scene === "Game" && s.player !== null && s.player.onGround,
    60,
    5,
  );
  expect(steps).toBeLessThanOrEqual(60);
  expect(state.level?.id).toBe("ruins-1");
  expect(state.player?.x).toBe(2 * TILE + 16);
  expect(state.player?.y).toBe(STANDING_Y);
});

test("LEVEL-EXIT-01 Koniec poziomu", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const portalLeft = GEOMETRY["test/flat-ground"]!.portalLeft;
  await setPlayerPosition(
    page,
    portalLeft - TILE - BODY_HALF_WIDTH,
    STANDING_Y,
  );
  await page.keyboard.down("ArrowRight");
  const touch = await stepUntil(
    page,
    (s) => s.scene !== "Game" || s.player!.x + BODY_HALF_WIDTH >= portalLeft,
    60,
  );
  const done = await stepUntil(page, (s) => s.scene === "LevelComplete", 30);
  await page.keyboard.up("ArrowRight");
  expect(touch.steps + done.steps).toBeLessThanOrEqual(60);
  expect(done.state.scene).toBe("LevelComplete");
  expect(done.state.player).toBeNull();
});

test("LEVEL-CAMERA-01 Bohater w środku", async ({ page }) => {
  await startLevel(page, "ruins-1");
  await setPlayerPosition(page, 60 * TILE, STANDING_Y);
  await holdKey(page, "ArrowRight", 120);
  const state = await readState(page);
  const screenX = state.player!.x - state.camera!.x;
  expect(Math.abs(screenX - 480)).toBeLessThanOrEqual(3 * TILE);
});

test("LEVEL-CAMERA-02 Lewy brzeg poziomu", async ({ page }) => {
  await startLevel(page, "ruins-1");
  await step(page, 60);
  const state = await readState(page);
  expect(state.camera!.x).toBe(0);
  expect(state.player!.x - state.camera!.x).toBeLessThan(480);
});

test("LEVEL-RUINS-1-03 Przejście bez dziur", async ({ page }) => {
  await startLevel(page, "ruins-1");
  const level = loadLevelFile("ruins-1");
  const result = await runBot(
    page,
    groundHeights(level),
    coinCenters(level),
    50 * 60,
  );
  expect(result.state.scene).toBe("LevelComplete");
  expect(result.steps).toBeGreaterThanOrEqual(35 * 60);
  expect(result.steps).toBeLessThanOrEqual(50 * 60);
});
