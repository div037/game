import Phaser from "phaser";
import type { PlayerState } from "../debug/types";

// Numbers from the player and physics Tuning tables.
export const RUN_SPEED = 96;
export const JUMP_SPEED = 480;
export const MAX_FALL_SPEED = 640;
export const BODY_WIDTH = 24;
export const BODY_HEIGHT = 30;

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: "left" | "right" = "right";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "hero");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.arcadeBody();
    body.setSize(BODY_WIDTH, BODY_HEIGHT);
    body.setOffset((this.width - BODY_WIDTH) / 2, this.height - BODY_HEIGHT);
    body.setMaxVelocityY(MAX_FALL_SPEED);
    body.setCollideWorldBounds(true);
  }

  arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get onGround(): boolean {
    return this.arcadeBody().blocked.down;
  }

  /** Places the center of the collision box at (x, y) and stops the player. */
  placeBodyCenter(x: number, y: number): void {
    const body = this.arcadeBody();
    this.setPosition(
      x - body.offset.x - BODY_WIDTH / 2 + this.displayOriginX,
      y - body.offset.y - BODY_HEIGHT / 2 + this.displayOriginY,
    );
    // Body.reset ignores the offset until the next physics step.
    body.reset(this.x, this.y);
    body.position.set(x - BODY_WIDTH / 2, y - BODY_HEIGHT / 2);
    body.prev.copy(body.position);
    body.updateCenter();
  }

  control(input: PlayerInput): void {
    const body = this.arcadeBody();
    if (input.left === input.right) {
      body.setVelocityX(0);
    } else if (input.left) {
      body.setVelocityX(-RUN_SPEED);
      this.facing = "left";
    } else {
      body.setVelocityX(RUN_SPEED);
      this.facing = "right";
    }
    this.setFlipX(this.facing === "left");
    if (input.jump && this.onGround) {
      body.setVelocityY(-JUMP_SPEED);
    }
  }

  debugState(): PlayerState {
    const body = this.arcadeBody();
    return {
      x: body.center.x,
      y: body.center.y,
      width: body.width,
      height: body.height,
      vx: body.velocity.x,
      vy: body.velocity.y,
      onGround: this.onGround,
      facing: this.facing,
    };
  }
}
