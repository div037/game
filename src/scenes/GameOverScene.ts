import { GAME_OVER_TEXT } from "../config";
import { ScreenScene } from "./ScreenScene";

export class GameOverScene extends ScreenScene {
  constructor() {
    super("GameOver");
  }

  protected build(): void {
    this.centeredText(260, GAME_OVER_TEXT, 64, "#e0343c");
  }

  protected next(): void {
    this.scene.start("Title");
  }
}
