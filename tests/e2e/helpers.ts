import { expect, type Page } from "@playwright/test";
import type { DebugSnapshot, GameHook, SceneKey } from "../../src/debug/types";

export const TILE = 32;
export const STEP_MS = 1000 / 60;

export type HookFields = DebugSnapshot & {
  paused: boolean;
  timeScale: number;
  texts: GameHook["texts"];
  hud: GameHook["hud"];
};

function hook(): GameHook {
  const game = window.__game;
  if (!game) {
    throw new Error("window.__game is not available");
  }
  return game;
}

/** Opens the game and waits for the title screen. */
export async function openGame(page: Page, query = ""): Promise<void> {
  await page.goto(`./${query}`);
  await expect
    .poll(() => page.evaluate(() => window.__game?.scene ?? null), {
      timeout: 10_000,
    })
    .toBe("Title");
}

/** Reads every field of the hook in one round trip. */
export async function readState(page: Page): Promise<HookFields> {
  return page.evaluate(() => {
    const game = window.__game;
    if (!game) {
      throw new Error("window.__game is not available");
    }
    return {
      ...game.snapshot(),
      paused: game.paused,
      timeScale: game.timeScale,
      texts: game.texts,
      hud: game.hud,
    };
  });
}

export async function scene(page: Page): Promise<SceneKey> {
  return page.evaluate(() => window.__game?.scene ?? "");
}

export async function loadLevel(page: Page, id: string): Promise<void> {
  await page.evaluate((levelId) => window.__game!.loadLevel(levelId), id);
}

export async function pause(page: Page): Promise<void> {
  await page.evaluate(() => window.__game!.pause());
}

export async function resume(page: Page): Promise<void> {
  await page.evaluate(() => window.__game!.resume());
}

export async function step(page: Page, n: number): Promise<void> {
  await page.evaluate((count) => window.__game!.step(count), n);
}

/** Steps the game in chunks until `done` is true or `maxSteps` were taken. */
export async function stepUntil(
  page: Page,
  done: (state: HookFields) => boolean,
  maxSteps: number,
  chunk = 1,
): Promise<{ steps: number; state: HookFields }> {
  let steps = 0;
  let state = await readState(page);
  while (!done(state) && steps < maxSteps) {
    await step(page, chunk);
    steps += chunk;
    state = await readState(page);
  }
  return { steps, state };
}

export async function player(page: Page) {
  const state = await readState(page);
  if (!state.player) {
    throw new Error(`No player in scene ${state.scene}`);
  }
  return state.player;
}

export async function setPlayerPosition(
  page: Page,
  x: number,
  y: number,
): Promise<void> {
  await page.evaluate(
    ({ px, py }) => window.__game!.setPlayerPosition(px, py),
    { px: x, py: y },
  );
}

/** Opens the game, clears the save, loads a level and pauses the game. */
export async function startLevel(page: Page, id: string): Promise<void> {
  await openGame(page);
  await page.evaluate(() => window.__game!.resetSave());
  await loadLevel(page, id);
  await pause(page);
}

/** Holds `key` for `steps` fixed steps while the game is paused. */
export async function holdKey(
  page: Page,
  key: string,
  steps: number,
): Promise<void> {
  await page.keyboard.down(key);
  await step(page, steps);
  await page.keyboard.up(key);
}

export function hasText(state: HookFields, text: string): boolean {
  return state.texts.some((entry) => entry.text === text);
}

export const seconds = (s: number): number => Math.round(s * 60);
export { hook };

export const FLOOR_TOP_Y = 15 * TILE;
/** Center y of the player's collision box while standing on the floor. */
export const STANDING_Y = FLOOR_TOP_Y - 15;
export const BODY_HALF_WIDTH = 12;

export interface LevelGeometry {
  /** Center x of a pit in px (teleport target). */
  pitX: number;
  /** Left edge of the portal in px. */
  portalLeft: number;
}

export const GEOMETRY: Record<string, LevelGeometry> = {
  "test/flat-ground": { pitX: NaN, portalLeft: 37 * TILE },
  "test/pit": { pitX: 13 * TILE, portalLeft: 37 * TILE },
  "test/coins": { pitX: 21 * TILE, portalLeft: 37 * TILE },
  "ruins-1": { pitX: 79 * TILE, portalLeft: 114 * TILE },
};

/**
 * Drops the player into the pit at `pitX` and steps until a heart is lost
 * or the scene changes. Returns the number of steps taken after the fall
 * was detected (0) so callers can wait for the respawn themselves.
 */
export async function fallIntoPit(page: Page, pitX: number): Promise<void> {
  const before = await readState(page);
  await setPlayerPosition(page, pitX, 300);
  await stepUntil(
    page,
    (state) => state.scene !== "Game" || state.hearts !== before.hearts,
    120,
  );
}

/** Puts the player 1 tile before the portal and runs right until it ends. */
export async function completeLevel(
  page: Page,
  portalLeft: number,
): Promise<void> {
  await setPlayerPosition(
    page,
    portalLeft - TILE - BODY_HALF_WIDTH,
    STANDING_Y,
  );
  await page.keyboard.down("ArrowRight");
  await stepUntil(page, (state) => state.scene === "LevelComplete", 120);
  await page.keyboard.up("ArrowRight");
}

/** Writes a save file the way the game does (DEBUG-SAVE). */
export async function writeSaveFile(
  page: Page,
  coins: number,
  collected: Record<string, number[]>,
): Promise<void> {
  await page.evaluate(
    (save) => localStorage.setItem("game-save", JSON.stringify(save)),
    { coins, collected },
  );
}

export interface BotResult {
  steps: number;
  state: HookFields;
}

/**
 * A simple player that never stops: holds the right key and jumps in front
 * of walls, pits and coins hanging above. Runs inside the page so a step
 * costs no round trip. `groundHeights` is the ground height per column in
 * tiles (0 for a pit), `coinsAbove` lists [x, y] centers of coins in px.
 */
export async function runBot(
  page: Page,
  groundHeights: number[],
  coins: [number, number][],
  maxSteps: number,
): Promise<BotResult> {
  const steps = await page.evaluate(
    ({ heights, coinList, limit, tile, bodyHalfWidth, bodyHalfHeight }) => {
      const game = window.__game!;
      const press = (
        type: "keydown" | "keyup",
        code: string,
        key: string,
        keyCode: number,
      ) =>
        window.dispatchEvent(
          new KeyboardEvent(type, { code, key, keyCode, bubbles: true }),
        );
      const levelHeightPx = (game.level?.heightTiles ?? 0) * tile;
      press("keydown", "ArrowRight", "ArrowRight", 39);
      let taken = 0;
      let jumpHeld = false;
      while (taken < limit && game.scene === "Game") {
        const player = game.player;
        if (!player) {
          break;
        }
        const feet = player.y + bodyHalfHeight;
        const feetHeight = Math.round((levelHeightPx - feet) / tile);
        const right = player.x + bodyHalfWidth;
        const column = Math.floor(right / tile);
        let wantJump = false;
        // A wall ahead within 40 px that rises above the feet.
        for (let c = column; c <= column + 2; c += 1) {
          const height = heights[c];
          if (height === undefined) {
            continue;
          }
          const distance = c * tile - right;
          if (height > feetHeight && distance >= 0 && distance <= 40) {
            wantJump = true;
          }
        }
        // A pit starting within 3 px of the right edge: a 2-tile pit needs
        // a jump from the very edge, because the far ledge must be overlapped
        // by more than one step of falling (8 px) to count as a landing.
        // While a pit is close ahead, only the pit decides when to jump.
        const nextColumn = column + 1;
        const nextHeight = heights[nextColumn];
        if (nextHeight === 0 && nextColumn * tile - right <= 3) {
          wantJump = true;
        }
        let pitAhead = false;
        for (let c = column + 1; c <= column + 4; c += 1) {
          if (heights[c] === 0) {
            pitAhead = true;
          }
        }
        // A coin above and ahead.
        if (!pitAhead) {
          for (const [cx, cy] of coinList) {
            if (
              cx >= player.x &&
              cx - player.x <= 48 &&
              cy < player.y - bodyHalfHeight
            ) {
              wantJump = true;
            }
          }
        }
        if (wantJump && player.onGround && !jumpHeld) {
          press("keydown", "Space", " ", 32);
          jumpHeld = true;
        } else if (jumpHeld) {
          press("keyup", "Space", " ", 32);
          jumpHeld = false;
        }
        game.step(1);
        taken += 1;
      }
      press("keyup", "ArrowRight", "ArrowRight", 39);
      if (jumpHeld) {
        press("keyup", "Space", " ", 32);
      }
      return taken;
    },
    {
      heights: groundHeights,
      coinList: coins,
      limit: maxSteps,
      tile: TILE,
      bodyHalfWidth: BODY_HALF_WIDTH,
      bodyHalfHeight: 15,
    },
  );
  return { steps, state: await readState(page) };
}
