import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist", "node_modules", ".worktrees", ".superpowers"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: "readonly" },
    },
  },
  {
    files: ["vite.config.ts", "tests/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  eslintConfigPrettier,
]);
