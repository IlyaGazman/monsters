/**
 * @fileoverview Manages the core game logic, state, and player interactions.
 */

import * as THREE from 'three';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { TILE_SIZE, PLAYER_SPEED, GAME_STATE, GRID_DIMENSIONS } from '../utils/constants.js';

// --- Game State ---
let currentState = GAME_STATE.LOADING;
let playerPosition = new THREE.Vector3(0, 0, 0); // Logical player position (center base)
let targetPosition = new THREE.Vector3(0, 0, 0); // Where the player is moving towards
let isMoving = false;
const movementQueue = []; // Stores intended moves (e.g., ['up', 'left'])

// Basic collision map (true = blocked, false = open)
// Should ideally be loaded from map data
const collisionMap = Array(GRID_DIMENSIONS.width).fill(null).map(() => Array(GRID_DIMENSIONS.height).fill(false));

/**
 * Initializes the game state and logic components.
 */
function init() {
    console.log("Initializing game logic...");
    // Set initial player position (e.g., center of the map or a defined start point)
    const startX = Math.floor(GRID_DIMENSIONS.width / 2);
    const startZ = Math.floor(GRID_DIMENSIONS.height / 2);
    playerPosition.set(startX * TILE_SIZE, 0, startZ * TILE_SIZE);
    targetPosition.copy(playerPosition);

    // Example: Mark the obstacle from renderer as blocked
    // Note: Y-coord ignored for collision map, positions are grid indices
    const obstacleGridX = 3;
    const obstacleGridZ = 2;
    if (obstacleGridX >= 0 && obstacleGridX < GRID_DIMENSIONS.width &&
        obstacleGridZ >= 0 && obstacleGridZ < GRID_DIMENSIONS.height) {
        collisionMap[obstacleGridX][obstacleGridZ] = true;
        console.log(`Collision added at grid [${obstacleGridX}, ${obstacleGridZ}]`);
    }


    currentState = GAME_STATE.WORLD; // Switch to world state after init
    console.log("Game logic initialized. State:", currentState);
}

/**
 * Checks if a target grid cell is valid and not blocked.
 * @param {number} gridX - Target X grid coordinate.
 * @param {number} gridZ - Target Z grid coordinate.
 * @returns {boolean} - True if the cell is walkable, false otherwise.
 */
function isWalkable(gridX, gridZ) {
    // Check boundaries
    if (gridX < 0 || gridX >= GRID_DIMENSIONS.width || gridZ < 0 || gridZ >= GRID_DIMENSIONS.height) {
        return false;
    }
    // Check collision map
    return !collisionMap[gridX][gridZ];
}


/**
 * Updates the game state based on input and time delta.
 * @param {number} deltaTime - Time elapsed since the last frame in seconds.
 */
function update(deltaTime) {
    if (currentState !== GAME_STATE.WORLD) {
        // Only process world movement in the world state
        return;
    }

    const input = Input.getState();

    // --- Handle Movement Input ---
    // Only accept new movement input if not currently moving to the next tile
    if (!isMoving) {
        let moveX = 0;
        let moveZ = 0;

        if (input.up) moveZ = -1;
        else if (input.down) moveZ = 1;
        else if (input.left) moveX = -1;
        else if (input.right) moveX = 1;

        if (moveX !== 0 || moveZ !== 0) {
            const currentGridX = Math.round(playerPosition.x / TILE_SIZE);
            const currentGridZ = Math.round(playerPosition.z / TILE_SIZE);
            const targetGridX = currentGridX + moveX;
            const targetGridZ = currentGridZ + moveZ;

            if (isWalkable(targetGridX, targetGridZ)) {
                targetPosition.set(targetGridX * TILE_SIZE, 0, targetGridZ * TILE_SIZE);
                isMoving = true;
            }
        }
    }

    // --- Process Movement ---
    if (isMoving) {
        const distanceToTarget = playerPosition.distanceTo(targetPosition);

        if (distanceToTarget < 0.05) { // Threshold to snap to target
            playerPosition.copy(targetPosition);
            isMoving = false;
            // Check for encounters or events on the new tile
            checkTileEvents(Math.round(playerPosition.x / TILE_SIZE), Math.round(playerPosition.z / TILE_SIZE));
        } else {
            const moveDirection = targetPosition.clone().sub(playerPosition).normalize();
            const moveDistance = PLAYER_SPEED * TILE_SIZE * deltaTime; // Speed scaled by TILE_SIZE
            playerPosition.add(moveDirection.multiplyScalar(Math.min(moveDistance, distanceToTarget)));
        }
        // Update the visual representation in the renderer
        // Send the logical player position (base center)
         Renderer.updatePlayerPosition(playerPosition);
    }


    // --- Handle Action Input ---
    if (input.actionA) {
        // TODO: Implement interaction logic (e.g., talk to NPC, read sign)
         console.log("Action A pressed");
         // Consume the input if needed (e.g., set input.actionA = false in Input module or here)
         // For simplicity, continuous press is allowed for now.
    }
    if (input.actionB) {
        // TODO: Implement cancel/menu logic
         console.log("Action B pressed");
    }

}

/**
 * Checks for events on the tile the player just moved to.
 * @param {number} gridX - The player's current grid X coordinate.
 * @param {number} gridZ - The player's current grid Z coordinate.
 */
function checkTileEvents(gridX, gridZ) {
    console.log(`Player moved to tile [${gridX}, ${gridZ}]`);
    // Example: Trigger a "battle" (placeholder) on a specific tile
    if (gridX === 5 && gridZ === 5) {
        startPlaceholderBattle();
    }
    // Example: Simple random encounter chance (e.g., in "grass")
    // Assume tiles X=10-15, Z=10-15 are grass
    if(gridX >= 10 && gridX <= 15 && gridZ >= 10 && gridZ <= 15) {
        if (Math.random() < 0.1) { // 10% chance per step in grass
             startPlaceholderBattle();
        }
    }
}

/**
 * Placeholder function to simulate starting a battle.
 */
function startPlaceholderBattle() {
    if (currentState === GAME_STATE.WORLD) { // Prevent triggering multiple times
        console.log("ENCOUNTER! Starting battle (placeholder)...");
        // currentState = GAME_STATE.BATTLE; // Change state
        // TODO: Transition to a battle scene/UI
        UI.showMessage("Wild Pokémon Appeared!", 3000);
        // For now, just show a message and stay in world state
    }
}


/**
 * Gets the current game state.
 * @returns {string} The current state enum value.
 */
function getCurrentState() {
    return currentState;
}

export const Game = {
    init,
    update,
    getCurrentState,
    // Expose player position if needed by other modules
    getPlayerPosition: () => playerPosition,
};
