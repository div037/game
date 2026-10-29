import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY, PHYSICS_FPS } from "./config";
import { debugEnabled, installHook } from "./debug/hook";
import { BootScene } from "./scenes/BootScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { GameScene } from "./scenes/GameScene";
import { HudScene } from "./scenes/HudScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { TitleScene } from "./scenes/TitleScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game",
  backgroundColor: "#1d2b53",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: GRAVITY }, fps: PHYSICS_FPS },
  },
  scene: [
    BootScene,
    TitleScene,
    GameScene,
    HudScene,
    LevelCompleteScene,
    GameOverScene,
  ],
});

if (debugEnabled(window.location.search)) {
  window.__game = installHook(game, __APP_VERSION__);
}
