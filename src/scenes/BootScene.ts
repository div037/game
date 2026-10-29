import Phaser from "phaser";
import { createTextures } from "../textures";
import { gameStorage, loadSave } from "../save/save";
import { FIRST_LEVEL } from "../config";
import { loadLevelData } from "../levels/level-loader";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    createTextures(this);
    const save = loadSave(gameStorage());
    this.registry.set("coins", save.coins);
    // Warm the level cache so the title screen can start the game at once.
    void loadLevelData(FIRST_LEVEL).catch(() => undefined);
    this.scene.start("Title");
  }
}
