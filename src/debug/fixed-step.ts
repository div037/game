import type Phaser from "phaser";
import {
  MAX_STEPS_PER_FRAME_FACTOR,
  STEP_MS,
  TIME_SCALE_MAX,
  TIME_SCALE_MIN,
} from "../config";

/**
 * Drives the game with steps of exactly STEP_MS. Real time only decides how
 * many steps run per browser frame; tests can pause the loop and run steps
 * one by one.
 */
export class FixedStepLoop {
  private game: Phaser.Game;
  private accumulator = 0;
  private _time = 0;
  private _paused = false;
  private _timeScale = 1;

  constructor(game: Phaser.Game) {
    this.game = game;
    // Phaser installs its own callback in Game.start, after READY, so the
    // replacement happens inside the first frame. Phaser keeps handling
    // requestAnimationFrame and tab visibility; we decide how many fixed
    // steps run per frame.
    game.events.once("prestep", () => {
      game.loop.callback = (_time: number, delta: number) =>
        this.onFrame(delta);
    });
  }

  get time(): number {
    return this._time;
  }

  get paused(): boolean {
    return this._paused;
  }

  get timeScale(): number {
    return this._timeScale;
  }

  pause(): void {
    this._paused = true;
    this.accumulator = 0;
  }

  resume(): void {
    this._paused = false;
    this.accumulator = 0;
  }

  setTimeScale(k: number): void {
    if (!Number.isFinite(k)) {
      throw new Error(`timeScale must be a number, got ${k}`);
    }
    this._timeScale = Math.min(TIME_SCALE_MAX, Math.max(TIME_SCALE_MIN, k));
  }

  /** Runs n steps immediately; the display shows the state after the last. */
  step(n: number): void {
    this._paused = true;
    this.accumulator = 0;
    const count = Math.max(0, Math.floor(n));
    for (let i = 0; i < count; i += 1) {
      this.runStep(i === count - 1);
    }
  }

  private onFrame(delta: number): void {
    if (this._paused) {
      // Keep the picture fresh (e.g. after a resize) without advancing time.
      this.render();
      return;
    }
    this.accumulator += delta * this._timeScale;
    const maxSteps = Math.ceil(MAX_STEPS_PER_FRAME_FACTOR * this._timeScale);
    let steps = Math.floor(this.accumulator / STEP_MS);
    if (steps > maxSteps) {
      steps = maxSteps;
      this.accumulator = 0;
    } else {
      this.accumulator -= steps * STEP_MS;
    }
    if (steps === 0) {
      this.render();
      return;
    }
    for (let i = 0; i < steps; i += 1) {
      this.runStep(i === steps - 1);
    }
  }

  private runStep(render: boolean): void {
    this._time += STEP_MS;
    if (render) {
      this.game.step(this._time, STEP_MS);
    } else {
      this.game.headlessStep(this._time, STEP_MS);
    }
  }

  /** Repaints the current state without running scene updates or input. */
  private render(): void {
    const game = this.game;
    const renderer = game.renderer;
    renderer.preRender();
    game.events.emit("prerender", renderer, this._time, 0);
    game.scene.render(renderer);
    renderer.postRender();
    game.events.emit("postrender", renderer, this._time, 0);
  }
}
