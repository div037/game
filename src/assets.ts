// Images the game loads, copied from the CC0 packs in assets/packs/
// (see assets/CREDITS.md). Paths are relative to assets/images/.

export interface ImageAsset {
  /** Path relative to assets/images/. */
  file: string;
  /** URL resolved by Vite (served in dev, bundled in build). */
  url: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
}

export const GAME_IMAGES = {
  /** 7 frames: 3 standing, 4 jumping. */
  hero: {
    file: "player/hero-32x32.png",
    url: new URL("../assets/images/player/hero-32x32.png", import.meta.url)
      .href,
    frameWidth: 32,
    frameHeight: 32,
    columns: 7,
    rows: 1,
  },
  /** Tileset: 1 stone, 2 stone top edge, 3 vine, 4 column (decor). */
  tiles: {
    file: "tiles/ruins.png",
    url: new URL("../assets/images/tiles/ruins.png", import.meta.url).href,
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 1,
  },
  /** 12 frames of a spinning gold coin. */
  coin: {
    file: "items/coin-32x32.png",
    url: new URL("../assets/images/items/coin-32x32.png", import.meta.url).href,
    frameWidth: 32,
    frameHeight: 32,
    columns: 12,
    rows: 1,
  },
  heart: {
    file: "ui/heart.png",
    url: new URL("../assets/images/ui/heart.png", import.meta.url).href,
    frameWidth: 32,
    frameHeight: 32,
    columns: 1,
    rows: 1,
  },
  /** Stone arch with a ring: rows open the portal, row 3 (frames 8-11) loops. */
  portal: {
    file: "items/portal-32x40.png",
    url: new URL("../assets/images/items/portal-32x40.png", import.meta.url)
      .href,
    frameWidth: 32,
    frameHeight: 40,
    columns: 4,
    rows: 4,
  },
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof GAME_IMAGES;
