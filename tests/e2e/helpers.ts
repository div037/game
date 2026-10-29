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
