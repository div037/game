// Contract of window.__game, specified in openspec/specs/debug/spec.md
// (private repository div037/game-platform). Units: px, px/s, ms.

export type SceneKey =
  "Boot" | "Title" | "Game" | "LevelComplete" | "GameOver" | "";

export interface LevelState {
  id: string;
  widthTiles: number;
  heightTiles: number;
  coinsTotal: number;
  coinsRemaining: number;
}

export interface PlayerState {
  /** Center of the collision box, px from the top-left corner of the level. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Velocity in px/s. */
  vx: number;
  vy: number;
  onGround: boolean;
  facing: "left" | "right";
}

export interface CameraState {
  /** Top-left corner of the visible area, px in level coordinates. */
  x: number;
  y: number;
}

export interface TextState {
  text: string;
  /** Top-left corner of the text on screen, px. */
  x: number;
  y: number;
}

export interface HudState {
  /** Top-left corner of the coin icon on screen, px. */
  x: number;
  y: number;
  /** Number shown next to the coin icon. */
  coins: number;
  /** Number of visible heart icons. */
  hearts: number;
}

export interface DebugSnapshot {
  version: string;
  time: number;
  seed: string;
  scene: SceneKey;
  level: LevelState | null;
  player: PlayerState | null;
  coins: number;
  hearts: number | null;
  camera: CameraState | null;
}

export interface GameHook extends DebugSnapshot {
  readonly paused: boolean;
  readonly timeScale: number;
  readonly texts: TextState[];
  readonly hud: HudState | null;
  setSeed(seed: string): void;
  random(): number;
  pause(): void;
  resume(): void;
  step(n: number): void;
  setTimeScale(k: number): void;
  loadLevel(id: string): Promise<void>;
  setPlayerPosition(x: number, y: number): void;
  resetSave(): void;
  snapshot(): DebugSnapshot;
}
