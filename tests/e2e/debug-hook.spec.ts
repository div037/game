import { expect, test } from "@playwright/test";
import pkg from "../../package.json" with { type: "json" };
import { openGame, readState } from "./helpers";

test("DEBUG-HOOK-01 Serwer deweloperski", async ({ page }) => {
  await page.goto("./");
  await expect
    .poll(() => page.evaluate(() => typeof window.__game), { timeout: 3_000 })
    .toBe("object");
  const version = await page.evaluate(() => window.__game!.version);
  expect(version).toBe(pkg.version);
});

test("DEBUG-STATE-01 Ekran startowy", async ({ page }) => {
  await openGame(page);
  const state = await readState(page);
  expect(state.scene).toBe("Title");
  expect(state.level).toBeNull();
  expect(state.player).toBeNull();
  expect(state.camera).toBeNull();
  expect(state.hud).toBeNull();
  expect(state.hearts).toBeNull();
  expect(state.coins).toBe(0);
  expect(state.texts.map((entry) => entry.text)).toContain("Platformówka");
});
