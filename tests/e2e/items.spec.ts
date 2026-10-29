import { expect, test } from "@playwright/test";
import {
  fallIntoPit,
  GEOMETRY,
  holdKey,
  openGame,
  pause,
  readState,
  startLevel,
  step,
  stepUntil,
  writeSaveFile,
} from "./helpers";
import {
  coinCenters,
  coinIds,
  groundHeights,
  loadLevelFile,
} from "./level-files";
import { runBot } from "./helpers";

test("ITEMS-COIN-01 Pierwsza moneta", async ({ page }) => {
  await startLevel(page, "test/coins");
  const before = await readState(page);
  expect(before.coins).toBe(0);
  expect(before.level?.coinsRemaining).toBe(5);
  await holdKey(page, "ArrowRight", 60);
  const after = await readState(page);
  expect(after.coins).toBe(1);
  expect(after.level?.coinsRemaining).toBe(4);
});

test("ITEMS-COIN-02 Moneta liczy się raz", async ({ page }) => {
  await startLevel(page, "test/coins");
  await holdKey(page, "ArrowRight", 60);
  expect((await readState(page)).coins).toBe(1);
  await holdKey(page, "ArrowLeft", 60);
  await holdKey(page, "ArrowRight", 60);
  const after = await readState(page);
  expect(after.coins).toBe(1);
  expect(after.level?.coinsRemaining).toBe(4);
});

test("ITEMS-COIN-FOREVER-01 Dziura nie zabiera monet", async ({ page }) => {
  await startLevel(page, "test/coins");
  await holdKey(page, "ArrowRight", 150);
  expect((await readState(page)).coins).toBe(4);
  await fallIntoPit(page, GEOMETRY["test/coins"]!.pitX);
  await step(page, 31);
  const after = await readState(page);
  expect(after.player?.onGround).toBe(true);
  expect(after.coins).toBe(4);
  expect(after.level?.coinsRemaining).toBe(1);
});

test("ITEMS-COIN-FOREVER-02 Ponowne wejście do poziomu", async ({ page }) => {
  const ids = coinIds(loadLevelFile("ruins-1"));
  await openGame(page);
  await writeSaveFile(page, 7, { "ruins-1": ids.slice(0, 7) });
  await page.reload();
  await openGame(page);
  await pause(page);
  await step(page, 60);
  await page.keyboard.press("Space");
  const { state } = await stepUntil(page, (s) => s.scene === "Game", 60, 5);
  expect(state.scene).toBe("Game");
  expect(state.coins).toBe(7);
  expect(state.level?.coinsRemaining).toBe(3);
});

test("ITEMS-COIN-FOREVER-03 Zamknięcie gry", async ({ page }) => {
  await startLevel(page, "ruins-1");
  const level = loadLevelFile("ruins-1");
  // Play until 5 coins are collected, then open the game again.
  const heights = groundHeights(level);
  const coins = coinCenters(level);
  let state = await readState(page);
  while (state.coins < 5) {
    const result = await runBot(page, heights, coins, 60);
    state = result.state;
    expect(result.steps).toBeGreaterThan(0);
    expect(state.scene).toBe("Game");
  }
  expect(state.coins).toBe(5);
  await page.reload();
  await openGame(page);
  await page.evaluate(() => window.__game!.loadLevel("ruins-1"));
  await pause(page);
  const reopened = await readState(page);
  expect(reopened.coins).toBe(5);
  expect(reopened.level?.coinsRemaining).toBe(5);
});

test("ITEMS-COIN-FOREVER-04 Koniec gry", async ({ page }) => {
  await startLevel(page, "test/coins");
  await holdKey(page, "ArrowRight", 110);
  expect((await readState(page)).coins).toBe(3);
  for (let i = 0; i < 2; i += 1) {
    await fallIntoPit(page, GEOMETRY["test/coins"]!.pitX);
    await step(page, 31);
  }
  expect((await readState(page)).hearts).toBe(1);
  await fallIntoPit(page, GEOMETRY["test/coins"]!.pitX);
  const { state } = await stepUntil(page, (s) => s.scene === "GameOver", 30);
  expect(state.scene).toBe("GameOver");
  expect(state.coins).toBe(3);
});
