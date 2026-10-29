import { defineConfig, devices } from "@playwright/test";

// PW_BROWSERS limits the projects, e.g. PW_BROWSERS=chromium or
// PW_BROWSERS=chromium,firefox. Without it all three browsers run (CI).
// In cloud sessions only Chromium works: Firefox and WebKit need system
// libraries that are not installed there.
const allBrowsers = ["chromium", "firefox", "webkit"] as const;
type Browser = (typeof allBrowsers)[number];

function selectedBrowsers(): Browser[] {
  const raw = process.env.PW_BROWSERS?.trim();
  if (!raw) {
    return [...allBrowsers];
  }
  const wanted = raw.split(",").map((name) => name.trim().toLowerCase());
  const unknown = wanted.filter(
    (name) => !allBrowsers.includes(name as Browser),
  );
  if (unknown.length > 0) {
    throw new Error(
      `PW_BROWSERS contains unknown browsers: ${unknown.join(", ")}. ` +
        `Use a comma separated subset of ${allBrowsers.join(", ")}.`,
    );
  }
  return allBrowsers.filter((name) => wanted.includes(name));
}

const deviceFor: Record<Browser, (typeof devices)[string]> = {
  chromium: devices["Desktop Chrome"],
  firefox: devices["Desktop Firefox"],
  webkit: devices["Desktop Safari"],
};

const port = 5173;
export const baseURL = `http://localhost:${port}/game/`;
/** `vite preview` of a fresh production build, for the DEBUG-HOOK tests. */
export const previewPort = 4173;
export const previewURL = `http://localhost:${previewPort}/game/`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  projects: selectedBrowsers().map((name) => ({
    name,
    use: { ...deviceFor[name] },
  })),
  webServer: [
    {
      command: `npm run dev -- --port ${port} --strictPort`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npm run build && npm run preview -- --port ${previewPort} --strictPort`,
      url: previewURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
