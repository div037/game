import Phaser from "phaser";
import type {
  CameraState,
  DebugSnapshot,
  GameHook,
  HudState,
  LevelState,
  PlayerState,
  SceneKey,
  TextState,
} from "./types";
import { FixedStepLoop } from "./fixed-step";
import { loadLevelData } from "../levels/level-loader";
import { gameStorage, resetSave } from "../save/save";
import { GameScene } from "../scenes/GameScene";
import { HudScene } from "../scenes/HudScene";
import { installDebugKey } from "./download";

const MAIN_SCENES: SceneKey[] = [
  "Boot",
  "Title",
  "Game",
  "LevelComplete",
  "GameOver",
];

/** True when the hook should be installed: dev server or `?debug=1`. */
export function debugEnabled(search: string): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return new URLSearchParams(search).get("debug") === "1";
}

export function installHook(game: Phaser.Game, version: string): GameHook {
  const loop = new FixedStepLoop(game);
  let seed = "";

  const activeMainScene = (): SceneKey => {
    for (const key of MAIN_SCENES) {
      const scene = game.scene.getScene(key);
      if (scene && scene.sys.isActive()) {
        return key;
      }
    }
    return "";
  };

  const gameScene = (): GameScene | null => {
    const scene = game.scene.getScene("Game");
    if (scene instanceof GameScene && scene.sys.isActive()) {
      return scene;
    }
    return null;
  };

  const hudScene = (): HudScene | null => {
    const scene = game.scene.getScene("Hud");
    if (scene instanceof HudScene && scene.sys.isActive()) {
      return scene;
    }
    return null;
  };

  const texts = (): TextState[] => {
    const result: TextState[] = [];
    for (const scene of game.scene.getScenes(true)) {
      if (!scene.sys.settings.visible) {
        continue;
      }
      const camera = scene.cameras.main;
      for (const child of scene.children.list) {
        if (!(child instanceof Phaser.GameObjects.Text)) {
          continue;
        }
        if (!child.visible || child.alpha <= 0) {
          continue;
        }
        const topLeft = child.getTopLeft<Phaser.Math.Vector2>();
        result.push({
          text: child.text,
          x: topLeft.x - camera.scrollX * child.scrollFactorX,
          y: topLeft.y - camera.scrollY * child.scrollFactorY,
        });
      }
    }
    return result;
  };

  const snapshot = (): DebugSnapshot => {
    const scene = gameScene();
    return {
      version,
      time: loop.time,
      seed,
      scene: activeMainScene(),
      level: scene ? scene.debugLevel() : null,
      player: scene ? scene.debugPlayer() : null,
      coins: Number(game.registry.get("coins") ?? 0),
      hearts: scene ? scene.hearts : null,
      camera: scene ? scene.debugCamera() : null,
    };
  };

  const LOAD_TIMEOUT_MS = 5000;

  const waitForGameScene = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const scene = game.scene.getScene("Game");
      const onCreate = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        scene.events.off(Phaser.Scenes.Events.CREATE, onCreate);
        reject(new Error("The Game scene did not start (see the console)"));
      }, LOAD_TIMEOUT_MS);
      scene.events.once(Phaser.Scenes.Events.CREATE, onCreate);
    });

  /**
   * Runs `steps` game steps: at once when paused, otherwise by waiting for
   * the real-time loop (and finishing with explicit steps if the loop gets
   * paused meanwhile).
   */
  const advance = (steps: number): Promise<void> => {
    if (loop.paused) {
      loop.step(steps);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let left = steps;
      const finish = () => {
        game.events.off(Phaser.Core.Events.POST_STEP, onStep);
        clearInterval(watchdog);
        resolve();
      };
      const onStep = () => {
        left -= 1;
        if (left <= 0) {
          finish();
        }
      };
      const watchdog = setInterval(() => {
        if (loop.paused) {
          loop.step(left);
          finish();
        }
      }, 50);
      game.events.on(Phaser.Core.Events.POST_STEP, onStep);
    });
  };

  const hook: GameHook = {
    get version() {
      return version;
    },
    get time() {
      return loop.time;
    },
    get seed() {
      return seed;
    },
    get scene() {
      return activeMainScene();
    },
    get level(): LevelState | null {
      return gameScene()?.debugLevel() ?? null;
    },
    get player(): PlayerState | null {
      return gameScene()?.debugPlayer() ?? null;
    },
    get coins() {
      return Number(game.registry.get("coins") ?? 0);
    },
    get hearts() {
      return gameScene()?.hearts ?? null;
    },
    get camera(): CameraState | null {
      return gameScene()?.debugCamera() ?? null;
    },
    get paused() {
      return loop.paused;
    },
    get timeScale() {
      return loop.timeScale;
    },
    get texts() {
      return texts();
    },
    get hud(): HudState | null {
      return hudScene()?.debugHud() ?? null;
    },
    setSeed(value: string) {
      seed = String(value);
      Phaser.Math.RND.sow([seed]);
    },
    random() {
      return Phaser.Math.RND.frac();
    },
    pause() {
      loop.pause();
    },
    resume() {
      loop.resume();
    },
    step(n: number) {
      loop.step(n);
    },
    setTimeScale(k: number) {
      loop.setTimeScale(k);
    },
    async loadLevel(id: string) {
      const level = await loadLevelData(id);
      const created = waitForGameScene();
      for (const key of MAIN_SCENES) {
        if (key && key !== "Game" && game.scene.isActive(key)) {
          game.scene.stop(key);
        }
      }
      if (game.scene.isActive("Game")) {
        game.scene.stop("Game");
      }
      game.scene.start("Game", { level });
      // The scene manager starts the scene inside the next step.
      const starting = advance(1);
      await Promise.all([created, starting]);
      // One more step so the player touches the ground after the first
      // physics step.
      await advance(1);
    },
    setPlayerPosition(x: number, y: number) {
      const scene = gameScene();
      if (!scene) {
        throw new Error("setPlayerPosition works only in the Game scene");
      }
      scene.setPlayerPosition(x, y);
    },
    resetSave() {
      resetSave(gameStorage());
      game.registry.set("coins", 0);
    },
    snapshot,
  };

  installDebugKey(game, snapshot);
  return hook;
}
