import { TILE } from "../config";

/** The subset of the Tiled JSON format the game reads. */
export interface TiledObject {
  id: number;
  name?: string;
  type?: string;
  class?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TiledLayer {
  name: string;
  type: "tilelayer" | "objectgroup";
  width?: number;
  height?: number;
  data?: number[];
  objects?: TiledObject[];
}

export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
}

export interface LevelObject {
  id: number;
  type: string;
  /** Pixel rectangle in level coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  id: string;
  widthTiles: number;
  heightTiles: number;
  objects: LevelObject[];
  raw: TiledMap;
  /** True when the `ground` layer has a stone tile at (x, row). */
  solidAt(x: number, row: number): boolean;
}

function isTiledMap(json: unknown): json is TiledMap {
  if (typeof json !== "object" || json === null) {
    return false;
  }
  const map = json as Partial<TiledMap>;
  return (
    typeof map.width === "number" &&
    typeof map.height === "number" &&
    Array.isArray(map.layers)
  );
}

export function parseLevel(id: string, json: unknown): LevelData {
  if (!isTiledMap(json)) {
    throw new Error(`Level ${id} is not a Tiled JSON map`);
  }
  if (json.tilewidth !== TILE || json.tileheight !== TILE) {
    throw new Error(`Level ${id} must use ${TILE} x ${TILE} px tiles`);
  }
  const ground = json.layers.find(
    (layer) => layer.type === "tilelayer" && layer.name === "ground",
  );
  if (!ground || !ground.data) {
    throw new Error(`Level ${id} has no "ground" tile layer`);
  }
  const data = ground.data;
  const width = json.width;
  const height = json.height;
  if (data.length !== width * height) {
    throw new Error(`Level ${id}: ground layer has ${data.length} tiles`);
  }
  const objectLayer = json.layers.find(
    (layer) => layer.type === "objectgroup" && layer.name === "objects",
  );
  const objects: LevelObject[] = (objectLayer?.objects ?? []).map((object) => ({
    id: object.id,
    type: object.type ?? object.class ?? "",
    x: object.x,
    y: object.y,
    width: object.width ?? 0,
    height: object.height ?? 0,
  }));
  return {
    id,
    widthTiles: width,
    heightTiles: height,
    objects,
    raw: json,
    solidAt(x: number, row: number): boolean {
      if (x < 0 || x >= width || row < 0 || row >= height) {
        return false;
      }
      return (data[row * width + x] ?? 0) !== 0;
    },
  };
}

export function objectsOfType(level: LevelData, type: string): LevelObject[] {
  return level.objects.filter((object) => object.type === type);
}

/** The single object of `type`; throws when there is not exactly one. */
export function singleObject(level: LevelData, type: string): LevelObject {
  const found = objectsOfType(level, type);
  if (found.length !== 1) {
    throw new Error(
      `Level ${level.id} must have exactly 1 "${type}" object, has ${found.length}`,
    );
  }
  return found[0]!;
}

/**
 * Height of the ground in tiles above the bottom edge for each column:
 * the topmost stone tile decides. A column without stone is a pit (0).
 */
export function groundHeights(level: LevelData): number[] {
  const heights: number[] = [];
  for (let x = 0; x < level.widthTiles; x += 1) {
    let top = level.heightTiles;
    for (let row = 0; row < level.heightTiles; row += 1) {
      if (level.solidAt(x, row)) {
        top = row;
        break;
      }
    }
    heights.push(level.heightTiles - top);
  }
  return heights;
}

export interface Pit {
  x: number;
  width: number;
}

/** Runs of columns without any stone. */
export function pits(level: LevelData): Pit[] {
  const heights = groundHeights(level);
  const result: Pit[] = [];
  let current: Pit | null = null;
  heights.forEach((height, x) => {
    if (height === 0) {
      if (current) {
        current.width += 1;
      } else {
        current = { x, width: 1 };
        result.push(current);
      }
    } else {
      current = null;
    }
  });
  return result;
}

/** How far a jump reaches horizontally, in columns (2.4 tiles rounded up). */
export const JUMP_REACH_COLUMNS = 3;

export interface Step {
  x: number;
  rise: number;
}

/**
 * Climbs along the way: for each column with ground, the rise above the
 * highest ground within the previous JUMP_REACH_COLUMNS columns.
 */
export function steps(level: LevelData): Step[] {
  const heights = groundHeights(level);
  const result: Step[] = [];
  for (let x = 1; x < heights.length; x += 1) {
    const height = heights[x]!;
    if (height === 0) {
      continue;
    }
    let from = 0;
    for (let back = 1; back <= JUMP_REACH_COLUMNS && x - back >= 0; back += 1) {
      from = Math.max(from, heights[x - back]!);
    }
    if (height > from) {
      result.push({ x, rise: height - from });
    }
  }
  return result;
}
