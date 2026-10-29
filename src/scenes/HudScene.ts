import Phaser from "phaser";
import type { HudState } from "../debug/types";

/** Distance of the counters from the top-left corner of the screen (ui spec). */
export const HUD_MARGIN = 16;
export const HUD_ICON = 32;

export class HudScene extends Phaser.Scene {
  private coinIcon!: Phaser.GameObjects.Image;
  private coinText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("Hud");
  }

  create(): void {
    this.coinIcon = this.add
      .image(HUD_MARGIN, HUD_MARGIN, "coin")
      .setOrigin(0, 0);
    this.coinText = this.add
      .text(HUD_MARGIN + HUD_ICON + 8, HUD_MARGIN + HUD_ICON / 2, "0", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#fff1e8",
      })
      .setOrigin(0, 0.5);
    this.hearts = [];
    for (let i = 0; i < 3; i += 1) {
      this.hearts.push(
        this.add
          .image(
            HUD_MARGIN + i * (HUD_ICON + 4),
            HUD_MARGIN + HUD_ICON + 8,
            "heart",
          )
          .setOrigin(0, 0),
      );
    }
    this.refresh();
    this.registry.events.on("changedata", this.refresh, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off("changedata", this.refresh, this);
    });
  }

  private refresh(): void {
    const coins = Number(this.registry.get("coins") ?? 0);
    const hearts = Number(this.registry.get("hearts") ?? 0);
    this.coinText.setText(String(coins));
    this.hearts.forEach((heart, index) => heart.setVisible(index < hearts));
  }

  debugHud(): HudState {
    return {
      x: this.coinIcon.x,
      y: this.coinIcon.y,
      coins: Number(this.coinText.text),
      hearts: this.hearts.filter((heart) => heart.visible).length,
    };
  }
}
