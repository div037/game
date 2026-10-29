import { defineConfig, loadEnv } from "vite";
import pkg from "./package.json" with { type: "json" };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE || "/game/";
  if (!base.startsWith("/")) {
    throw new Error(
      `VITE_BASE must start with "/" (got "${base}"). ` +
        "In Git Bash on Windows a bare VITE_BASE=/ gets rewritten to a " +
        "filesystem path; put VITE_BASE=/ in .env.local instead.",
    );
  }
  return {
    base,
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    build: { chunkSizeWarningLimit: 1500 },
  };
});
