import { expect, test } from "@playwright/test";
import { previewURL } from "../../playwright.config";

// DEBUG-HOOK-02 and DEBUG-HOOK-03 run against the production build served
// by the second web server of playwright.config.ts (`vite preview`).

test("DEBUG-HOOK-02 Build z parametrem debug", async ({ page }) => {
  await page.goto(`${previewURL}?debug=1`);
  await expect
    .poll(() => page.evaluate(() => typeof window.__game), { timeout: 3_000 })
    .toBe("object");
});

test("DEBUG-HOOK-03 Build bez parametru", async ({ page }) => {
  await page.goto(previewURL);
  await page.waitForTimeout(3_000);
  expect(await page.evaluate(() => typeof window.__game)).toBe("undefined");
});
