import { expect, test } from "@playwright/test";
import {
  completeLevel,
  fallIntoPit,
  GEOMETRY,
  holdKey,
  openGame,
  pause,
  player,
  readState,
  scene,
  startLevel,
  step,
  stepUntil,
} from "./helpers";

const TOLERANCE = 8; // 0.25 tile

test.describe("CONTROLS-MOVE", () => {
  for (const [id, key, expected] of [
    ["CONTROLS-MOVE-01 Strzałka w prawo", "ArrowRight", 96],
    ["CONTROLS-MOVE-02 Klawisz A", "KeyA", -96],
    ["CONTROLS-MOVE-03 Klawisz D", "KeyD", 96],
  ] as const) {
    test(id, async ({ page }) => {
      await startLevel(page, "test/flat-ground");
      const before = await player(page);
      await holdKey(page, key, 60);
      const after = await player(page);
      expect(Math.abs(after.x - before.x - expected)).toBeLessThanOrEqual(
        TOLERANCE,
      );
    });
  }

  test("CONTROLS-MOVE-04 Oba kierunki naraz", async ({ page }) => {
    await startLevel(page, "test/flat-ground");
    const before = await player(page);
    await page.keyboard.down("ArrowLeft");
    await page.keyboard.down("ArrowRight");
    await step(page, 60);
    await page.keyboard.up("ArrowLeft");
    await page.keyboard.up("ArrowRight");
    const after = await player(page);
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(3.2);
  });
});

test.describe("CONTROLS-JUMP", () => {
  for (const [id, key] of [
    ["CONTROLS-JUMP-01 Spacja", "Space"],
    ["CONTROLS-JUMP-02 Strzałka w górę", "ArrowUp"],
    ["CONTROLS-JUMP-03 Klawisz W", "KeyW"],
  ] as const) {
    test(id, async ({ page }) => {
      await startLevel(page, "test/flat-ground");
      const before = await player(page);
      expect(before.onGround).toBe(true);
      await page.keyboard.press(key);
      await step(page, 3); // 0.05 s
      const after = await player(page);
      expect(after.vy).toBeLessThan(0);
      expect(after.y).toBeLessThan(before.y);
    });
  }
});

test.describe("CONTROLS-SCREEN", () => {
  test("CONTROLS-SCREEN-01 Spacja po chwili", async ({ page }) => {
    await startLevel(page, "test/pit");
    for (let i = 0; i < 3; i += 1) {
      await fallIntoPit(page, GEOMETRY["test/pit"]!.pitX);
      await step(page, 31);
    }
    expect(await scene(page)).toBe("GameOver");
    await step(page, 60);
    await page.keyboard.press("Space");
    const { state } = await stepUntil(
      page,
      (current) => current.scene === "Title",
      30,
    );
    expect(state.scene).toBe("Title");
  });

  test("CONTROLS-SCREEN-02 Spacja za wcześnie", async ({ page }) => {
    await startLevel(page, "test/flat-ground");
    await completeLevel(page, GEOMETRY["test/flat-ground"]!.portalLeft);
    await step(page, 12); // 0.2 s
    await page.keyboard.press("Space");
    await step(page, 12);
    expect(await scene(page)).toBe("LevelComplete");
  });

  test("CONTROLS-SCREEN-03 Inne klawisze nic nie robią", async ({ page }) => {
    await openGame(page);
    await pause(page);
    await step(page, 60);
    for (const key of ["ArrowRight", "KeyA", "KeyD", "KeyW"]) {
      await page.keyboard.press(key);
      await step(page, 10);
    }
    await step(page, 30);
    expect((await readState(page)).scene).toBe("Title");
  });
});
