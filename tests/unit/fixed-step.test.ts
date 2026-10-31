import type Phaser from "phaser";
import { describe, expect, it } from "vitest";
import { STEP_MS } from "../../src/config";
import { FixedStepLoop } from "../../src/debug/fixed-step";

type FrameCallback = (time: number, delta: number) => void;

/**
 * The parts of Phaser.Game that FixedStepLoop touches. Phaser passes its
 * loop callback a smoothed delta, clamped to one 1/60 s step while the page
 * is out of focus or cooling down; `rawDelta` is the real time since the
 * last frame.
 */
function fakeGame() {
  const fake = {
    steps: 0,
    loop: { callback: null as FrameCallback | null, rawDelta: 0 },
    events: {
      once: (_name: string, handler: () => void) => handler(),
      emit: () => true,
    },
    step: () => {
      fake.steps += 1;
    },
    headlessStep: () => {
      fake.steps += 1;
    },
    input: { keyboard: null },
    renderer: { preRender: () => {}, postRender: () => {} },
    scene: { render: () => {} },
  };
  return fake;
}

/** Runs one browser frame: real time `raw` ms, Phaser's smoothed `smoothed`. */
function frame(
  game: ReturnType<typeof fakeGame>,
  raw: number,
  smoothed: number,
) {
  game.loop.rawDelta = raw;
  game.loop.callback!(0, smoothed);
}

describe("FixedStepLoop", () => {
  it("DEBUG-STEP-03 follows real time at 20 fps even when Phaser clamps the delta", () => {
    const game = fakeGame();
    const loop = new FixedStepLoop(game as unknown as Phaser.Game);
    for (let i = 0; i < 20; i += 1) {
      frame(game, 50, STEP_MS);
    }
    expect(loop.time).toBeGreaterThan(1000 - 2 * STEP_MS);
    expect(loop.time).toBeLessThanOrEqual(1000 + 1e-6);
  });

  it("DEBUG-TIME-SCALE-01 runs ten times faster than real time at 20 fps", () => {
    const game = fakeGame();
    const loop = new FixedStepLoop(game as unknown as Phaser.Game);
    loop.setTimeScale(10);
    for (let i = 0; i < 20; i += 1) {
      frame(game, 50, STEP_MS);
    }
    expect(loop.time).toBeGreaterThan(10000 - 2 * STEP_MS);
    expect(loop.time).toBeLessThanOrEqual(10000 + 1e-6);
  });

  it("caps a long frame at 20 x timeScale steps and drops the rest", () => {
    const game = fakeGame();
    const loop = new FixedStepLoop(game as unknown as Phaser.Game);
    frame(game, 5000, STEP_MS);
    expect(game.steps).toBe(20);
    frame(game, 0, 0);
    expect(game.steps).toBe(20);
    expect(loop.time).toBeCloseTo(20 * STEP_MS, 6);
  });

  it("does not advance time while paused", () => {
    const game = fakeGame();
    const loop = new FixedStepLoop(game as unknown as Phaser.Game);
    loop.pause();
    frame(game, 50, 50);
    expect(loop.time).toBe(0);
  });
});
