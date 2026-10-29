import type { GameHook } from "../../src/debug/types";

declare global {
  interface Window {
    __game?: GameHook;
  }
}

export {};
