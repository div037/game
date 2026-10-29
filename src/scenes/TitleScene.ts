import { FIRST_LEVEL, PRESS_SPACE_TEXT, TITLE_TEXT } from "../config";
import { cachedLevelData, loadLevelData } from "../levels/level-loader";
import { ScreenScene } from "./ScreenScene";

/** The prompt toggles every BLINK_MS of game time (ui spec). */
export const BLINK_MS = 500;

export class TitleScene extends ScreenScene {
  private prompt!: Phaser.GameObjects.Text;
  private starting = false;

  constructor() {
    super("Title");
  }

  protected build(): void {
    this.starting = false;
    this.centeredText(200, TITLE_TEXT, 64);
    this.prompt = this.centeredText(300, PRESS_SPACE_TEXT, 28, "#c2c3c7");
    this.add
      .text(
        this.scale.width - 16,
        this.scale.height - 16,
        `v${__APP_VERSION__}`,
        {
          fontFamily: "sans-serif",
          fontSize: "20px",
          color: "#c2c3c7",
        },
      )
      .setOrigin(1, 1);
  }

  protected tick(): void {
    this.prompt.setVisible(Math.floor(this.elapsed / BLINK_MS) % 2 === 0);
  }

  protected next(): void {
    if (this.starting) {
      return;
    }
    this.starting = true;
    const cached = cachedLevelData(FIRST_LEVEL);
    if (cached) {
      this.scene.start("Game", { level: cached });
      return;
    }
    loadLevelData(FIRST_LEVEL)
      .then((level) => {
        if (this.scene.isActive()) {
          this.scene.start("Game", { level });
        }
      })
      .catch((error: unknown) => {
        this.starting = false;
        console.error(`Could not load level ${FIRST_LEVEL}`, error);
      });
  }
}
