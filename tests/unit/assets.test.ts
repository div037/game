import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { GAME_IMAGES } from "../../src/assets";

function pngSize(file: string): [number, number] {
  const bytes = readFileSync(file);
  expect([...bytes.subarray(0, 8)]).toEqual([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    return statSync(file).isDirectory() ? listFiles(file) : [file];
  });
}

// Graphics copied from the CC0 packs (session 6b): every image the game
// loads exists with the frame layout the loader expects, and every file in
// assets/images is credited.
describe("assets", () => {
  test("every image in the manifest exists with the expected size", () => {
    for (const image of Object.values(GAME_IMAGES)) {
      const file = join(process.cwd(), "assets", "images", image.file);
      expect(existsSync(file), file).toBe(true);
      const [width, height] = pngSize(file);
      expect([width, height], image.file).toEqual([
        image.frameWidth * image.columns,
        image.frameHeight * image.rows,
      ]);
    }
  });

  test("every file in assets/images is listed in assets/CREDITS.md", () => {
    const credits = readFileSync(
      join(process.cwd(), "assets", "CREDITS.md"),
      "utf8",
    );
    const files = listFiles(join(process.cwd(), "assets", "images"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const relative = file.slice(process.cwd().length + 1);
      expect(credits, relative).toContain(relative);
    }
  });
});
