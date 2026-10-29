import Phaser from "phaser";
import { TILE } from "./config";

// All graphics are simple shapes drawn in code: there is no CC0 pack in
// assets/packs/ yet. Texture keys follow openspec/project.md (hero, coin,
// heart, tiles, portal).

type Draw = (context: CanvasRenderingContext2D) => void;

function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: Draw,
): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    throw new Error(`Could not create texture ${key}`);
  }
  draw(texture.context);
  texture.refresh();
}

function drawStone(
  context: CanvasRenderingContext2D,
  x: number,
  mossy: boolean,
) {
  context.fillStyle = "#6b6b7a";
  context.fillRect(x, 0, TILE, TILE);
  context.strokeStyle = "#4a4a58";
  context.lineWidth = 2;
  context.strokeRect(x + 1, 1, TILE - 2, TILE - 2);
  context.beginPath();
  context.moveTo(x, TILE / 2);
  context.lineTo(x + TILE, TILE / 2);
  context.moveTo(x + TILE / 2, 0);
  context.lineTo(x + TILE / 2, TILE / 2);
  context.moveTo(x + TILE / 4, TILE / 2);
  context.lineTo(x + TILE / 4, TILE);
  context.moveTo(x + (3 * TILE) / 4, TILE / 2);
  context.lineTo(x + (3 * TILE) / 4, TILE);
  context.stroke();
  if (mossy) {
    context.fillStyle = "#4f9d4a";
    context.fillRect(x, 0, TILE, 5);
    context.fillRect(x + 6, 5, 6, 3);
    context.fillRect(x + 20, 5, 8, 3);
  }
}

function drawVine(context: CanvasRenderingContext2D, x: number) {
  context.strokeStyle = "#3f8a3a";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x + 10, 0);
  context.quadraticCurveTo(x + 2, TILE / 2, x + 14, TILE);
  context.moveTo(x + 22, 0);
  context.quadraticCurveTo(x + 30, TILE / 2, x + 18, TILE);
  context.stroke();
  context.fillStyle = "#5cb85c";
  for (const [lx, ly] of [
    [6, 8],
    [24, 14],
    [10, 22],
    [26, 26],
  ] as const) {
    context.beginPath();
    context.ellipse(x + lx, ly, 4, 2.5, 0.6, 0, Math.PI * 2);
    context.fill();
  }
}

function drawCrack(context: CanvasRenderingContext2D, x: number) {
  context.strokeStyle = "#3a3a46";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + 8, 2);
  context.lineTo(x + 14, 12);
  context.lineTo(x + 10, 20);
  context.lineTo(x + 18, 30);
  context.moveTo(x + 14, 12);
  context.lineTo(x + 22, 16);
  context.stroke();
}

export function createTextures(scene: Phaser.Scene): void {
  // Tileset: 1 stone, 2 mossy stone top, 3 vine (decor), 4 crack (decor).
  canvasTexture(scene, "tiles", TILE * 4, TILE, (context) => {
    drawStone(context, 0, false);
    drawStone(context, TILE, true);
    drawVine(context, TILE * 2);
    drawCrack(context, TILE * 3);
  });

  // The hero: a blue creature, 32 x 32 px, looking right.
  canvasTexture(scene, "hero", TILE, TILE, (context) => {
    context.fillStyle = "#2f7de1";
    context.beginPath();
    context.roundRect(4, 2, 24, 30, 8);
    context.fill();
    context.fillStyle = "#1b4f9c";
    context.fillRect(6, 26, 8, 6);
    context.fillRect(18, 26, 8, 6);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(19, 12, 4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#101828";
    context.beginPath();
    context.arc(20.5, 12, 2, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#1b4f9c";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(14, 20);
    context.lineTo(22, 20);
    context.stroke();
  });

  canvasTexture(scene, "coin", TILE, TILE, (context) => {
    context.fillStyle = "#f3c13a";
    context.beginPath();
    context.arc(16, 16, 11, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#b8860b";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#fff1b0";
    context.beginPath();
    context.arc(12, 12, 3, 0, Math.PI * 2);
    context.fill();
  });

  canvasTexture(scene, "heart", TILE, TILE, (context) => {
    context.fillStyle = "#e0343c";
    context.beginPath();
    context.moveTo(16, 28);
    context.bezierCurveTo(2, 18, 2, 6, 10, 6);
    context.bezierCurveTo(14, 6, 16, 10, 16, 12);
    context.bezierCurveTo(16, 10, 18, 6, 22, 6);
    context.bezierCurveTo(30, 6, 30, 18, 16, 28);
    context.fill();
  });

  canvasTexture(scene, "portal", TILE, TILE * 2, (context) => {
    context.fillStyle = "#1b3a8a";
    context.beginPath();
    context.ellipse(16, 32, 15, 31, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#3b82f6";
    context.beginPath();
    context.ellipse(16, 32, 10, 24, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#bfdbfe";
    context.beginPath();
    context.ellipse(16, 32, 4, 12, 0, 0, Math.PI * 2);
    context.fill();
  });
}
