import { expect, test } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";

// DEBUG-HOOK-02 and DEBUG-HOOK-03 need a production build served by
// `vite preview`, so they start their own server on a separate port.
const port = 4173;
let server: ChildProcess | undefined;

test.beforeAll(async () => {
  server = spawn(
    "npx",
    ["vite", "preview", "--port", String(port), "--strictPort"],
    { stdio: "ignore" },
  );
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${port}/game/`);
      if (response.ok) {
        return;
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("vite preview did not start; run `npm run build` first");
});

test.afterAll(() => {
  server?.kill();
});

test("DEBUG-HOOK-02 Build z parametrem debug", async ({ page }) => {
  await page.goto(`http://localhost:${port}/game/?debug=1`);
  await expect
    .poll(() => page.evaluate(() => typeof window.__game), { timeout: 3_000 })
    .toBe("object");
});

test("DEBUG-HOOK-03 Build bez parametru", async ({ page }) => {
  await page.goto(`http://localhost:${port}/game/`);
  await page.waitForTimeout(3_000);
  expect(await page.evaluate(() => typeof window.__game)).toBe("undefined");
});
