import { expect, test } from "@playwright/test";
import {
  holdKey,
  openGame,
  pause,
  player,
  readState,
  resume,
  startLevel,
  step,
} from "./helpers";

test("DEBUG-FIXED-STEP-01 Czas gry rośnie krokami", async ({ page }) => {
  await openGame(page);
  await pause(page);
  const before = (await readState(page)).time;
  await step(page, 60);
  const after = (await readState(page)).time;
  expect(Math.abs(after - before - 1000)).toBeLessThanOrEqual(1);
});

test("DEBUG-FIXED-STEP-02 Ten sam wynik za każdym razem", async ({ page }) => {
  const run = async () => {
    await startLevel(page, "test/flat-ground");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.press("Space");
    await step(page, 90);
    await page.keyboard.up("ArrowRight");
    return player(page);
  };
  const first = await run();
  const second = await run();
  expect(second.x).toBe(first.x);
  expect(second.y).toBe(first.y);
  expect(second.vx).toBe(first.vx);
  expect(second.vy).toBe(first.vy);
  // The run must have moved the player, otherwise equality proves nothing.
  expect(first.x).toBeGreaterThan(176 + 100);
});

test("DEBUG-STEP-01 Zatrzymanie", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const before = (await readState(page)).time;
  await page.waitForTimeout(1000);
  const state = await readState(page);
  expect(state.time).toBe(before);
  expect(state.paused).toBe(true);
});

test("DEBUG-STEP-02 Kroki z klawiszem", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const before = await readState(page);
  await holdKey(page, "ArrowRight", 60);
  const after = await readState(page);
  expect(Math.abs(after.player!.x - before.player!.x - 96)).toBeLessThanOrEqual(
    1,
  );
  expect(Math.abs(after.time - before.time - 1000)).toBeLessThanOrEqual(1);
});

test("DEBUG-STEP-03 Wznowienie", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const before = (await readState(page)).time;
  await resume(page);
  await page.waitForTimeout(1000);
  const state = await readState(page);
  expect(state.paused).toBe(false);
  expect(state.time - before).toBeGreaterThanOrEqual(500);
});

test("DEBUG-TIME-SCALE-01 Dziesięć razy szybciej", async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__game!.setTimeScale(10));
  const before = (await readState(page)).time;
  await page.waitForTimeout(1000);
  const state = await readState(page);
  expect(state.timeScale).toBe(10);
  expect(state.time - before).toBeGreaterThanOrEqual(5000);
});

test("DEBUG-TIME-SCALE-02 Zwykła prędkość", async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__game!.setTimeScale(1));
  const before = (await readState(page)).time;
  await page.waitForTimeout(1000);
  const state = await readState(page);
  expect(state.time - before).toBeLessThanOrEqual(1500);
});

test("DEBUG-SEED-01 Ten sam ciąg", async ({ page }) => {
  await openGame(page);
  const draw = (seed: string) =>
    page.evaluate((value) => {
      window.__game!.setSeed(value);
      return Array.from({ length: 5 }, () => window.__game!.random());
    }, seed);
  const first = await draw("ruiny");
  const second = await draw("ruiny");
  expect(second).toEqual(first);
  for (const value of first) {
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  }
  expect(await page.evaluate(() => window.__game!.seed)).toBe("ruiny");
});

test("DEBUG-SEED-02 Inne ziarno", async ({ page }) => {
  await openGame(page);
  const draw = (seed: string) =>
    page.evaluate((value) => {
      window.__game!.setSeed(value);
      return Array.from({ length: 5 }, () => window.__game!.random());
    }, seed);
  const a = await draw("a");
  const b = await draw("b");
  expect(a.some((value, index) => value !== b[index])).toBe(true);
});
