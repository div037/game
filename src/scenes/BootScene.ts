import Phaser from "phaser";
import { createTextures } from "../textures";
import { loadSave } from "../save/save";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    createTextures(this);
    const save = loadSave(window.localStorage);
    this.registry.set("coins", save.coins);
    this.scene.start("Title");
  }
}
