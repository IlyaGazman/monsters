/**
 * @fileoverview Main entry point for the Pokémon Red 3D game.
 * Initializes modules and runs the game loop.
 */

import * as THREE from 'three'; // Ensure THREE is accessible if needed globally or for debugging
import { Renderer } from './modules/renderer.js';
import { Input } from './modules/input.js';
import { Game } from './modules/game.js';
import { UI } from './modules/ui.js';
import { GAME_STATE } from './utils/constants.js';

// --- Global Variables ---
let gameContainer;
let clock; // For tracking delta time

/**
 * Initializes all game components.
 */
function initializeGame() {
    console.log("Initializing Pokémon Red 3D...");

    gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error("Fatal Error: Game container not found.");
        return;
    }

    // Initialize Clock
    clock = new THREE.Clock();

    // Initialize Modules
    UI.init(); // Initialize UI first for potential loading screens/messages
    Renderer.init(gameContainer); // Initialize Three.js rendering
    Input.init();          // Initialize input handlers
    Game.init();           // Initialize game logic and state

    console.log("Game initialization complete. Starting game loop.");

    // Start the game loop
    gameLoop();
}

/**
 * The main game loop, called recursively via requestAnimationFrame.
 */
function gameLoop() {
    // Request the next frame
    requestAnimationFrame(gameLoop);

    // Calculate delta time for frame-rate independent updates
    const deltaTime = clock.getDelta();

    // --- Update Phase ---
    // Order matters: process input, update game logic, then render
    // Note: Input state is updated via event listeners asynchronously,
    // Game.update reads the latest state.
    Game.update(deltaTime); // Update game logic based on input and time

    // --- Render Phase ---
    Renderer.render(); // Render the scene

}

// --- Start the game ---
// Ensure DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// --- Cleanup ---
// Optional: Add cleanup logic if the game needs to be stopped dynamically
function cleanupGame() {
    console.log("Cleaning up game resources...");
    Input.destroy(); // Remove event listeners
    // Add cleanup for Renderer (dispose geometries, materials, renderer context) if necessary
    // Add cleanup for Game state if necessary
    // Cancel animation frame? (Usually not needed if the script context is destroyed)
}

// Example: Listen for page unload to attempt cleanup
// window.addEventListener('beforeunload', cleanupGame);
