import Phaser from "phaser";

/** Space is ignored for this long after a screen appears (controls spec). */
export const SPACE_LOCK_MS = 500;

/**
 * Base of the title, level complete and game over screens: space moves on,
 * but only after SPACE_LOCK_MS of game time.
 */
export abstract class ScreenScene extends Phaser.Scene {
  protected elapsed = 0;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  create(): void {
    this.elapsed = 0;
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is not available");
    }
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // Drop a press that happened before this screen appeared.
    Phaser.Input.Keyboard.JustDown(this.spaceKey);
    this.build();
  }

  update(_time: number, delta: number): void {
    this.elapsed += delta;
    const pressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if (pressed && this.elapsed >= SPACE_LOCK_MS) {
      this.next();
    }
    this.tick();
  }

  protected abstract build(): void;
  protected abstract next(): void;
  protected tick(): void {}

  protected centeredText(
    y: number,
    text: string,
    size: number,
    color = "#fff1e8",
  ): Phaser.GameObjects.Text {
    return this.add
      .text(this.scale.width / 2, y, text, {
        fontFamily: "sans-serif",
        fontSize: `${size}px`,
        color,
      })
      .setOrigin(0.5);
  }
}
