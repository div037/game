import Phaser from "phaser";

/** Space is ignored for this long after a screen appears (controls spec). */
export const SPACE_LOCK_MS = 500;

/**
 * Base of the title, level complete and game over screens: space moves on,
 * but only after SPACE_LOCK_MS of game time.
 */
export abstract class ScreenScene extends Phaser.Scene {
  protected elapsed = 0;
  private spacePressed = false;

  create(): void {
    this.elapsed = 0;
    this.spacePressed = false;
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is not available");
    }
    // A keydown event is remembered until the next step, so even a press
    // shorter than one step counts. Presses before this screen appeared
    // are not seen: the listener starts here.
    const onSpace = (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.spacePressed = true;
      }
    };
    keyboard.on("keydown-SPACE", onSpace);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off("keydown-SPACE", onSpace);
    });
    this.build();
  }

  update(_time: number, delta: number): void {
    this.elapsed += delta;
    const pressed = this.spacePressed;
    this.spacePressed = false;
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
