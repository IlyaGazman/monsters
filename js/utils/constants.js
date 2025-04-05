/**
 * @fileoverview Defines constants used throughout the game.
 */

export const TILE_SIZE = 1; // Size of one tile in world units
export const PLAYER_SPEED = 2.0; // World units per second
export const RENDER_DISTANCE = 50; // View distance for the camera
export const GRID_DIMENSIONS = { width: 50, height: 50 }; // Example map size in tiles

// Input key mappings
export const KEY_MAP = {
    UP: ['ArrowUp', 'w', 'W'],
    DOWN: ['ArrowDown', 's', 'S'],
    LEFT: ['ArrowLeft', 'a', 'A'],
    RIGHT: ['ArrowRight', 'd', 'D'],
    ACTION_A: ['Enter', ' '], // Spacebar or Enter for A
    ACTION_B: ['Escape', 'Shift'], // Escape or Shift for B
};

// Touch control IDs
export const TOUCH_CONTROLS = {
    UP: 'dpad-up',
    DOWN: 'dpad-down',
    LEFT: 'dpad-left',
    RIGHT: 'dpad-right',
    A: 'button-a',
    B: 'button-b',
};

// Game states (example)
export const GAME_STATE = {
    LOADING: 'loading',
    WORLD: 'world',
    BATTLE: 'battle',
    MENU: 'menu',
};
