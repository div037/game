import Phaser from "phaser";
import { GAME_HEIGHT, STEP_MS, TILE } from "../config";
import type { CameraState, LevelState, PlayerState } from "../debug/types";
import {
  objectsOfType,
  singleObject,
  type LevelData,
  type LevelObject,
} from "../levels/level-data";
import { Player } from "../player/Player";
import {
  collectCoin,
  collectedIn,
  loadSave,
  writeSave,
  type SaveData,
} from "../save/save";
import type { LevelCompleteData } from "./LevelCompleteScene";

// Numbers from the player and levels Tuning tables.
export const START_HEARTS = 3;
export const PIT_HEARTS_LOST = 1;
export const RESPAWN_MS = 500;
export const RESPAWN_STEPS = Math.round(RESPAWN_MS / STEP_MS);

export interface GameSceneData {
  level: LevelData;
}

interface Keys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
}

const JUMP_EVENTS = ["keydown-SPACE", "keydown-UP", "keydown-W"];

export class GameScene extends Phaser.Scene {
  hearts = START_HEARTS;
  private level!: LevelData;
  private player!: Player;
  private keys!: Keys;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private coinsTotal = 0;
  private save: SaveData = { coins: 0, collected: {} };
  private start!: LevelObject;
  private respawnStepsLeft: number | null = null;
  private jumpPressed = false;
  private finished = false;

  constructor() {
    super("Game");
  }

  init(data: GameSceneData): void {
    if (!data || !data.level) {
      throw new Error("The Game scene needs a level");
    }
    this.level = data.level;
    this.hearts = START_HEARTS;
    this.respawnStepsLeft = null;
    this.jumpPressed = false;
    this.finished = false;
  }

  create(): void {
    const level = this.level;
    this.save = loadSave(window.localStorage);
    this.registry.set("coins", this.save.coins);
    this.registry.set("hearts", this.hearts);

    const widthPx = level.widthTiles * TILE;
    const heightPx = level.heightTiles * TILE;

    const cacheKey = `level:${level.id}`;
    if (this.cache.tilemap.has(cacheKey)) {
      this.cache.tilemap.remove(cacheKey);
    }
    this.cache.tilemap.add(cacheKey, {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: level.raw,
    });
    const map = this.make.tilemap({ key: cacheKey });
    const tileset = map.addTilesetImage("ruins", "tiles");
    if (!tileset) {
      throw new Error("Tileset 'ruins' is missing in the level");
    }
    if (map.getLayerIndexByName("decor") !== null) {
      map.createLayer("decor", tileset);
    }
    const ground = map.createLayer("ground", tileset);
    if (!ground) {
      throw new Error("Layer 'ground' is missing in the level");
    }
    ground.setCollisionByExclusion([-1]);

    // Left and right edges stop the player; the player may fall below the
    // bottom edge (that is the pit).
    this.physics.world.setBounds(0, 0, widthPx, heightPx + 4 * GAME_HEIGHT);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.start = singleObject(level, "player-start");
    this.player = new Player(this, 0, 0);
    this.placePlayerAtStart();
    this.physics.add.collider(this.player, ground);

    this.createCoins(level);
    this.createPortal(level);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, widthPx, heightPx);
    camera.startFollow(this.player, true, 1, 1);
    // The camera keeps the player centered horizontally (well inside the
    // 6-tile band of the levels spec) and never scrolls vertically unless
    // the player leaves the screen, so a level of 17 tiles shows its top.
    camera.setDeadzone(0, GAME_HEIGHT);
    // startFollow snaps the camera to the player and clamps to the bounds,
    // which scrolls a 17-tile level down by 4 px; show the top instead.
    camera.setScroll(camera.scrollX, 0);
    camera.setBackgroundColor("#1d2b53");

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is not available");
    }
    const codes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: keyboard.addKey(codes.LEFT),
      right: keyboard.addKey(codes.RIGHT),
      a: keyboard.addKey(codes.A),
      d: keyboard.addKey(codes.D),
    };
    // Jump presses are remembered until the next step, so a tap shorter
    // than one step still jumps.
    const onJump = (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.jumpPressed = true;
      }
    };
    for (const name of JUMP_EVENTS) {
      keyboard.on(name, onJump);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const name of JUMP_EVENTS) {
        keyboard.off(name, onJump);
      }
    });

    // Input is read before the physics step of the same fixed step, so a
    // key held during step(n) moves the player for all n steps.
    this.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.readInput, this);
    this.scene.launch("Hud");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.readInput, this);
      this.scene.stop("Hud");
    });
  }

  private createCoins(level: LevelData): void {
    const collected = collectedIn(this.save, level.id);
    const coinObjects = objectsOfType(level, "coin");
    this.coinsTotal = coinObjects.length;
    this.coins = this.physics.add.staticGroup();
    for (const object of coinObjects) {
      if (collected.includes(object.id)) {
        continue;
      }
      const coin = this.coins.create(
        object.x + object.width / 2,
        object.y + object.height / 2,
        "coin",
      ) as Phaser.Physics.Arcade.Image;
      coin.setData("id", object.id);
    }
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      this.collect(coin as Phaser.Physics.Arcade.Image);
    });
  }

  private createPortal(level: LevelData): void {
    const object = singleObject(level, "exit-portal");
    const portal = this.physics.add.staticImage(
      object.x + object.width / 2,
      object.y + object.height / 2,
      "portal",
    );
    this.physics.add.overlap(this.player, portal, () => this.finishLevel());
  }

  private collect(coin: Phaser.Physics.Arcade.Image): void {
    if (!coin.active) {
      return;
    }
    const id = Number(coin.getData("id"));
    coin.destroy();
    this.save = collectCoin(this.save, this.level.id, id);
    writeSave(window.localStorage, this.save);
    this.registry.set("coins", this.save.coins);
  }

  private finishLevel(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    const data: LevelCompleteData = {
      collected: collectedIn(this.save, this.level.id).length,
      total: this.coinsTotal,
    };
    this.scene.start("LevelComplete", data);
  }

  private placePlayerAtStart(): void {
    const body = this.player.arcadeBody();
    this.player.placeBodyCenter(
      this.start.x + this.start.width / 2,
      this.start.y + this.start.height - body.height / 2,
    );
    this.player.facing = "right";
    this.player.setFlipX(false);
  }

  /** Runs before the physics step: input and the respawn after a pit. */
  private readInput(): void {
    const jump = this.jumpPressed;
    this.jumpPressed = false;
    if (this.finished) {
      return;
    }
    if (this.respawnStepsLeft !== null) {
      this.respawnStepsLeft -= 1;
      if (this.respawnStepsLeft <= 0) {
        this.respawnStepsLeft = null;
        this.player.setVisible(true);
        this.player.arcadeBody().enable = true;
        this.placePlayerAtStart();
      }
      return;
    }
    const keys = this.keys;
    this.player.control({
      left: keys.left.isDown || keys.a.isDown,
      right: keys.right.isDown || keys.d.isDown,
      jump,
    });
  }

  /** Runs after the physics step. */
  update(): void {
    if (this.finished || this.respawnStepsLeft !== null) {
      return;
    }
    if (this.player.arcadeBody().top > this.level.heightTiles * TILE) {
      this.fallIntoPit();
    }
  }

  private fallIntoPit(): void {
    this.hearts = Math.max(0, this.hearts - PIT_HEARTS_LOST);
    this.registry.set("hearts", this.hearts);
    if (this.hearts === 0) {
      this.finished = true;
      this.scene.start("GameOver");
      return;
    }
    this.player.setVisible(false);
    this.player.arcadeBody().stop();
    this.player.arcadeBody().enable = false;
    this.respawnStepsLeft = RESPAWN_STEPS;
  }

  setPlayerPosition(x: number, y: number): void {
    this.player.placeBodyCenter(x, y);
  }

  debugLevel(): LevelState {
    return {
      id: this.level.id,
      widthTiles: this.level.widthTiles,
      heightTiles: this.level.heightTiles,
      coinsTotal: this.coinsTotal,
      coinsRemaining: this.coins.countActive(true),
    };
  }

  debugPlayer(): PlayerState {
    return this.player.debugState();
  }

  debugCamera(): CameraState {
    const camera = this.cameras.main;
    return { x: camera.scrollX, y: camera.scrollY };
  }
}
