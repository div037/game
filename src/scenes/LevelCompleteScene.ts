import { LEVEL_COMPLETE_TEXT } from "../config";
import { ScreenScene } from "./ScreenScene";

export interface LevelCompleteData {
  collected: number;
  total: number;
}

export class LevelCompleteScene extends ScreenScene {
  private data_: LevelCompleteData = { collected: 0, total: 0 };

  constructor() {
    super("LevelComplete");
  }

  init(data: LevelCompleteData): void {
    this.data_ = data;
  }

  protected build(): void {
    this.centeredText(220, LEVEL_COMPLETE_TEXT, 56);
    this.centeredText(
      300,
      `Monety: ${this.data_.collected} z ${this.data_.total}`,
      32,
      "#f3c13a",
    );
  }

  protected next(): void {
    this.scene.start("Title");
  }
}
