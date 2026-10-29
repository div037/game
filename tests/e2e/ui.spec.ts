import { expect, test } from "@playwright/test";
import pkg from "../../package.json" with { type: "json" };
import {
  completeLevel,
  fallIntoPit,
  GEOMETRY,
  hasText,
  holdKey,
  loadLevel,
  openGame,
  pause,
  readState,
  runBot,
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

const PROMPT = "Naciśnij spację, aby zagrać";

test("UI-TITLE-01 Uruchomienie gry", async ({ page }) => {
  await page.goto("./");
  await page.waitForTimeout(3_000);
  const state = await readState(page);
  expect(state.scene).toBe("Title");
  expect(hasText(state, "Platformówka")).toBe(true);
  // The prompt blinks, so it may be in its hidden half second right now.
  await pause(page);
  const { state: shown } = await stepUntil(page, (s) => hasText(s, PROMPT), 31);
  expect(hasText(shown, PROMPT)).toBe(true);
  const title = shown.texts.find((t) => t.text === "Platformówka")!;
  const prompt = shown.texts.find((t) => t.text === PROMPT)!;
  expect(prompt.y).toBeGreaterThan(title.y);
});

test("UI-TITLE-02 Miganie napisu", async ({ page }) => {
  await openGame(page);
  await pause(page);
  await step(page, 120);
  // Find the next toggle, then measure the following ones.
  const initial = hasText(await readState(page), PROMPT);
  await stepUntil(page, (s) => hasText(s, PROMPT) !== initial, 31);
  let visible = !initial;
  for (let cycle = 0; cycle < 4; cycle += 1) {
    const { steps } = await stepUntil(
      page,
      (s) => hasText(s, PROMPT) !== visible,
      40,
    );
    expect(Math.abs(steps - 30)).toBeLessThanOrEqual(3);
    visible = !visible;
  }
});

test("UI-TITLE-03 Start gry", async ({ page }) => {
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
  expect(state.player?.x).toBe(2 * 32 + 16);
});

test("UI-VERSION-01 Wersja w rogu", async ({ page }) => {
  await openGame(page);
  const state = await readState(page);
  const version = state.texts.find((t) => t.text === `v${pkg.version}`);
  expect(version).toBeDefined();
  // Bottom-right corner of the 960 x 540 screen.
  expect(version!.x).toBeGreaterThan(960 - 120);
  expect(version!.y).toBeGreaterThan(540 - 40);
});

test("UI-HUD-COINS-01 Pierwsza gra", async ({ page }) => {
  await startLevel(page, "ruins-1");
  await step(page, 60);
  const { hud } = await readState(page);
  expect(hud).toEqual({ x: 16, y: 16, coins: 0, hearts: 3 });
});

test("UI-HUD-COINS-04 Oszczędności z wcześniejszych gier", async ({ page }) => {
  await openGame(page);
  await writeSaveFile(page, 6, {});
  await page.reload();
  await openGame(page);
  await loadLevel(page, "ruins-1");
  await pause(page);
  await step(page, 60);
  expect((await readState(page)).hud?.coins).toBe(6);
});

test("UI-HUD-COINS-02 Po zebraniu monet", async ({ page }) => {
  await startLevel(page, "test/coins");
  await holdKey(page, "ArrowRight", 70);
  expect((await readState(page)).hud?.coins).toBe(2);
  await page.keyboard.down("ArrowRight");
  await stepUntil(page, (s) => s.coins === 3, 60);
  const { steps, state } = await stepUntil(page, (s) => s.hud?.coins === 3, 6);
  await page.keyboard.up("ArrowRight");
  expect(state.hud?.coins).toBe(3);
  expect(steps).toBeLessThanOrEqual(6);
});

test("UI-HUD-COINS-03 Licznik nie przewija się z poziomem", async ({
  page,
}) => {
  await startLevel(page, "ruins-1");
  const before = (await readState(page)).hud!;
  await holdKey(page, "ArrowRight", 300);
  const state = await readState(page);
  expect(state.camera!.x).toBeGreaterThan(0);
  expect(state.hud!.x).toBe(before.x);
  expect(state.hud!.y).toBe(before.y);
});

test("UI-HUD-HEARTS-01 Pełne serca", async ({ page }) => {
  await startLevel(page, "ruins-1");
  await step(page, 60);
  const { hud } = await readState(page);
  expect(hud?.hearts).toBe(3);
  expect(hud!.y).toBe(16);
});

test("UI-HUD-HEARTS-02 Strata serca", async ({ page }) => {
  await startLevel(page, "test/pit");
  expect((await readState(page)).hud?.hearts).toBe(3);
  await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
  const { state, steps } = await stepUntil(
    page,
    (s) => s.hud?.hearts === 2,
    30,
  );
  expect(state.hud?.hearts).toBe(2);
  expect(steps).toBeLessThanOrEqual(30);
});

test("UI-LEVEL-COMPLETE-01 Wynik", async ({ page }) => {
  const ids = coinIds(loadLevelFile("ruins-1"));
  await openGame(page);
  await writeSaveFile(page, 7, { "ruins-1": ids.slice(0, 7) });
  await page.reload();
  await openGame(page);
  await loadLevel(page, "ruins-1");
  await pause(page);
  await completeLevel(page, GEOMETRY["ruins-1"]!.portalLeft);
  const state = await readState(page);
  expect(hasText(state, "Poziom ukończony!")).toBe(true);
  expect(hasText(state, "Monety: 7 z 10")).toBe(true);
});

test("UI-LEVEL-COMPLETE-03 Dozbieranie monet", async ({ page }) => {
  const level = loadLevelFile("ruins-1");
  const ids = coinIds(level);
  await openGame(page);
  await writeSaveFile(page, 7, { "ruins-1": ids.slice(0, 7) });
  await page.reload();
  await openGame(page);
  await loadLevel(page, "ruins-1");
  await pause(page);
  const result = await runBot(
    page,
    groundHeights(level),
    coinCenters(level),
    50 * 60,
  );
  expect(result.state.scene).toBe("LevelComplete");
  expect(hasText(result.state, "Monety: 10 z 10")).toBe(true);
});

test("UI-LEVEL-COMPLETE-02 Powrót", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  await completeLevel(page, GEOMETRY["test/flat-ground"]!.portalLeft);
  await step(page, 60);
  await page.keyboard.press("Space");
  const { state, steps } = await stepUntil(
    page,
    (s) => s.scene === "Title",
    30,
  );
  expect(state.scene).toBe("Title");
  expect(steps).toBeLessThanOrEqual(30);
});

test("UI-GAME-OVER-01 Napis", async ({ page }) => {
  await startLevel(page, "test/pit");
  for (let i = 0; i < 2; i += 1) {
    await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
    await step(page, 31);
  }
  expect((await readState(page)).hearts).toBe(1);
  await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
  const { state, steps } = await stepUntil(
    page,
    (s) => hasText(s, "Koniec gry"),
    30,
  );
  expect(hasText(state, "Koniec gry")).toBe(true);
  expect(steps).toBeLessThanOrEqual(30);
});

test("UI-GAME-OVER-02 Powrót", async ({ page }) => {
  await startLevel(page, "test/pit");
  for (let i = 0; i < 3; i += 1) {
    await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
    await step(page, 31);
  }
  expect((await readState(page)).scene).toBe("GameOver");
  await step(page, 60);
  await page.keyboard.press("Space");
  const { state, steps } = await stepUntil(
    page,
    (s) => s.scene === "Title",
    30,
  );
  expect(state.scene).toBe("Title");
  expect(steps).toBeLessThanOrEqual(30);
});
