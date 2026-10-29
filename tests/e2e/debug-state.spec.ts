import { expect, test } from "@playwright/test";
import {
  holdKey,
  loadLevel,
  openGame,
  readState,
  setPlayerPosition,
  startLevel,
  step,
} from "./helpers";

test("DEBUG-STATE-02 Pola poziomu", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const { level } = await readState(page);
  expect(level).toEqual({
    id: "test/flat-ground",
    widthTiles: 40,
    heightTiles: 17,
    coinsTotal: 0,
    coinsRemaining: 0,
  });
});

test("DEBUG-STATE-03 Pola Bohatera", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const { player } = await readState(page);
  expect(player).toEqual({
    x: 176,
    y: 465,
    width: 24,
    height: 30,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: "right",
  });
});

test("DEBUG-STATE-04 Kamera i liczniki", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const state = await readState(page);
  expect(state.camera).toEqual({ x: 0, y: 0 });
  expect(state.hearts).toBe(3);
  expect(state.hud).toEqual({
    x: expect.any(Number),
    y: expect.any(Number),
    coins: 0,
    hearts: 3,
  });
});

test("DEBUG-STATE-05 Widoczne napisy", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const { texts } = await readState(page);
  expect(texts.length).toBeGreaterThan(0);
  for (const entry of texts) {
    expect(typeof entry.text).toBe("string");
    expect(typeof entry.x).toBe("number");
    expect(typeof entry.y).toBe("number");
  }
  // The title screen texts are gone: only the level's texts are listed.
  expect(texts.map((entry) => entry.text)).not.toContain("Platformówka");
});

test("DEBUG-LOAD-LEVEL-01 Poziom testowy z ekranu startowego", async ({
  page,
}) => {
  await openGame(page);
  await loadLevel(page, "test/flat-ground");
  const state = await readState(page);
  expect(state.scene).toBe("Game");
  expect(state.level?.id).toBe("test/flat-ground");
  expect(state.player?.onGround).toBe(true);
  expect(state.hearts).toBe(3);
});

test("DEBUG-LOAD-LEVEL-02 Poziom gry", async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__game!.resetSave());
  await loadLevel(page, "ruins-1");
  const { level } = await readState(page);
  expect(level?.id).toBe("ruins-1");
  expect(level?.widthTiles).toBe(120);
  expect(level?.coinsTotal).toBe(10);
});

test("DEBUG-LOAD-LEVEL-03 Przeniesienie Bohatera", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  await setPlayerPosition(page, 400, 100);
  const { player } = await readState(page);
  expect(player?.x).toBe(400);
  expect(player?.y).toBe(100);
  expect(player?.vx).toBe(0);
  expect(player?.vy).toBe(0);
});

test("DEBUG-SAVE-01 Zapis po zebraniu monety", async ({ page }) => {
  await startLevel(page, "test/coins");
  // Walk right for 1 s: the first coin lies 1 tile ahead.
  await holdKey(page, "ArrowRight", 60);
  expect((await readState(page)).coins).toBe(1);
  const raw = await page.evaluate(() => localStorage.getItem("game-save"));
  expect(raw).not.toBeNull();
  const save = JSON.parse(raw!);
  expect(save.coins).toBe(1);
  expect(save.collected["test/coins"]).toHaveLength(1);
});

test("DEBUG-SAVE-02 Czyszczenie zapisu", async ({ page }) => {
  await startLevel(page, "test/coins");
  await holdKey(page, "ArrowRight", 150);
  expect((await readState(page)).coins).toBe(4);
  await page.evaluate(() => window.__game!.resetSave());
  await loadLevel(page, "test/coins");
  await step(page, 1);
  const state = await readState(page);
  expect(state.coins).toBe(0);
  expect(state.level?.coinsRemaining).toBe(5);
  expect(
    await page.evaluate(() => localStorage.getItem("game-save")),
  ).toBeNull();
});

test("DEBUG-SNAPSHOT-01 Zrzut w poziomie", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const [snapshot, playerX] = await page.evaluate(() => [
    window.__game!.snapshot(),
    window.__game!.player!.x,
  ]);
  expect(Object.keys(snapshot).sort()).toEqual(
    [
      "camera",
      "coins",
      "hearts",
      "level",
      "player",
      "scene",
      "seed",
      "time",
      "version",
    ].sort(),
  );
  expect(snapshot.scene).toBe("Game");
  expect(snapshot.level?.id).toBe("test/flat-ground");
  expect(snapshot.player?.x).toBe(playerX);
});
