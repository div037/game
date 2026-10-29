import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create(): void {
    const centerX = this.scale.width / 2;

    this.add
      .text(centerX, 240, "Gra", {
        fontFamily: "sans-serif",
        fontSize: "64px",
        color: "#fff1e8",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 320, `wersja ${__APP_VERSION__}`, {
        fontFamily: "sans-serif",
        fontSize: "24px",
        color: "#c2c3c7",
      })
      .setOrigin(0.5);
  }
}
