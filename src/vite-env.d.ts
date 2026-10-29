/// <reference types="vite/client" />

import type { GameHook } from "./debug/types";

declare global {
  const __APP_VERSION__: string;

  interface Window {
    __game?: GameHook;
  }
}

export {};
