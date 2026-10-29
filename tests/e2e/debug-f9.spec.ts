import { expect, test, type Download } from "@playwright/test";
import { startLevel } from "./helpers";

async function pressF9(page: Parameters<typeof startLevel>[0]) {
  const downloads: Download[] = [];
  page.on("download", (download) => downloads.push(download));
  await page.keyboard.press("F9");
  await expect.poll(() => downloads.length, { timeout: 5_000 }).toBe(2);
  return downloads;
}

test("DEBUG-F9-01 Dwa pliki", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const downloads = await pressF9(page);
  const names = downloads.map((download) => download.suggestedFilename());
  expect(names.sort()).toEqual(["debug-screenshot.png", "debug-state.json"]);
});

test("DEBUG-F9-02 Treść pliku stanu", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const downloads = await pressF9(page);
  const state = downloads.find(
    (download) => download.suggestedFilename() === "debug-state.json",
  )!;
  const path = await state.path();
  const { readFile } = await import("node:fs/promises");
  const json = JSON.parse(await readFile(path, "utf8"));
  expect(json.scene).toBe("Game");
  expect(json.level.id).toBe("test/flat-ground");
  expect(json.player.x).toBe(176);
});

test("DEBUG-F9-03 Zrzut ekranu", async ({ page }) => {
  await startLevel(page, "test/flat-ground");
  const downloads = await pressF9(page);
  const shot = downloads.find(
    (download) => download.suggestedFilename() === "debug-screenshot.png",
  )!;
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(await shot.path());
  expect([...bytes.subarray(0, 8)]).toEqual([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  // IHDR chunk: width and height as big-endian 32-bit integers.
  expect(bytes.readUInt32BE(16)).toBe(960);
  expect(bytes.readUInt32BE(20)).toBe(540);
});
