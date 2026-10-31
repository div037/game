import Phaser from "phaser";
import { GAME_IMAGES, type ImageKey } from "../assets";
import { FIRST_LEVEL } from "../config";
import { loadLevelData } from "../levels/level-loader";
import { gameStorage, loadSave } from "../save/save";

/** Animation keys shared by the scenes. */
export const ANIM = {
  heroIdle: "hero-idle",
  heroJump: "hero-jump",
  coinSpin: "coin-spin",
  portalLoop: "portal-loop",
} as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    for (const [key, image] of Object.entries(GAME_IMAGES) as [
      ImageKey,
      (typeof GAME_IMAGES)[ImageKey],
    ][]) {
      this.load.spritesheet(key, image.url, {
        frameWidth: image.frameWidth,
        frameHeight: image.frameHeight,
      });
    }
  }

  create(): void {
    // The portal is drawn at 2x, so keep its pixels sharp.
    this.textures.get("portal").setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.createAnimations();
    const save = loadSave(gameStorage());
    this.registry.set("coins", save.coins);
    // Warm the level cache so the title screen can start the game at once.
    void loadLevelData(FIRST_LEVEL).catch(() => undefined);
    this.scene.start("Title");
  }

  private createAnimations(): void {
    const anims = this.anims;
    if (anims.exists(ANIM.heroIdle)) {
      return;
    }
    anims.create({
      key: ANIM.heroIdle,
      frames: anims.generateFrameNumbers("hero", { start: 0, end: 2 }),
      frameRate: 4,
      repeat: -1,
      yoyo: true,
    });
    anims.create({
      key: ANIM.heroJump,
      frames: anims.generateFrameNumbers("hero", { start: 3, end: 6 }),
      frameRate: 8,
      repeat: 0,
    });
    anims.create({
      key: ANIM.coinSpin,
      frames: anims.generateFrameNumbers("coin", { start: 0, end: 11 }),
      frameRate: 12,
      repeat: -1,
    });
    anims.create({
      key: ANIM.portalLoop,
      frames: anims.generateFrameNumbers("portal", { start: 8, end: 11 }),
      frameRate: 6,
      repeat: -1,
    });
  }
}
