import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Game } from './game.js';

/**
 * Main entry point for the game.
 * Initializes necessary components and starts the game loop.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get the container element
    const container = document.getElementById('game-container');
    if (!container) {
        console.error("Game container not found!");
        return;
    }

    // Initialize core components
    const renderer = new Renderer(container);
    const input = new InputHandler();
    const game = new Game(renderer, input);

    // Start the game
    game.start();

    // Log device type for debugging
    console.log(`Touch device detected: ${input.isTouchDevice}`);
});
