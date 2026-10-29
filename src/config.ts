// Numbers from the Tuning tables of the specifications.

export const TILE = 32;
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Gravity in px/s² (physics spec). */
export const GRAVITY = 1200;

/** Fixed step of game logic and physics, in ms (debug spec). */
export const STEP_MS = 1000 / 60;
export const PHYSICS_FPS = 60;
export const MAX_STEPS_PER_FRAME_FACTOR = 20;
export const TIME_SCALE_MIN = 0.1;
export const TIME_SCALE_MAX = 20;

export const DEBUG_STATE_FILE = "debug-state.json";
export const DEBUG_SCREENSHOT_FILE = "debug-screenshot.png";

export const TITLE_TEXT = "Platformówka";
export const PRESS_SPACE_TEXT = "Naciśnij spację, aby zagrać";
export const LEVEL_COMPLETE_TEXT = "Poziom ukończony!";
export const GAME_OVER_TEXT = "Koniec gry";
export const FIRST_LEVEL = "ruins-1";
