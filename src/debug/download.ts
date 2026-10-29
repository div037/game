import type Phaser from "phaser";
import { DEBUG_SCREENSHOT_FILE, DEBUG_STATE_FILE } from "../config";
import type { DebugSnapshot } from "./types";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function downloadScreenshot(game: Phaser.Game): void {
  game.renderer.snapshot((snapshot) => {
    if (!(snapshot instanceof HTMLImageElement)) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = snapshot.width;
    canvas.height = snapshot.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.drawImage(snapshot, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, DEBUG_SCREENSHOT_FILE);
      }
    }, "image/png");
  }, "image/png");
}

/** F9 downloads debug-state.json and a PNG screenshot (DEBUG-F9). */
export function installDebugKey(
  game: Phaser.Game,
  snapshot: () => DebugSnapshot,
): void {
  window.addEventListener("keydown", (event) => {
    if (event.key !== "F9" || event.repeat) {
      return;
    }
    event.preventDefault();
    const json = JSON.stringify(snapshot(), null, 2);
    downloadBlob(
      new Blob([json], { type: "application/json" }),
      DEBUG_STATE_FILE,
    );
    downloadScreenshot(game);
  });
}
