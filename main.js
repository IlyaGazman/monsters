import * as THREE from 'three'; // Required because we are using the global THREE object from the script tag
import Renderer from './renderer.js';
import Game from './game.js';
import InputManager from './input.js';

// Global game instance variables
let renderer, game, inputManager;
let lastTime = 0;
let gameLoopId = null;

// DOM Elements
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');
const gameOverMessage = document.getElementById('game-over-message');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const controlsLayer = document.getElementById('controls-layer'); // Touch control layer

/**
 * Initializes the game components.
 */
function init() {
    console.log("Initializing game...");

    // Create Renderer
    renderer = new Renderer(gameContainer);

    // Create Game Logic
    game = new Game(renderer.getGridConfig()); // Pass grid config if needed by game logic

    // Create Input Manager
    inputManager = new InputManager(controlsLayer, renderer.getCamera(), renderer.getPreviewAreaBounds());

    // Initial setup
    renderer.init();
    game.init();
    inputManager.init();

    // Add resize listener
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize(); // Set initial size

    // Add restart listener
    restartButton.addEventListener('click', restartGame);

    // Start the game loop
    lastTime = performance.now();
    startGameLoop();

    console.log("Game initialized and loop started.");
}

/**
 * Handles window resize events to keep the game responsive.
 */
function onWindowResize() {
    renderer.updateSize();
    // Update input manager areas if they depend on screen size/layout
    inputManager.setPreviewAreaBounds(renderer.getPreviewAreaBounds());
}

/**
 * The main game loop using requestAnimationFrame.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function gameLoop(currentTime) {
    gameLoopId = requestAnimationFrame(gameLoop);

    const deltaTime = (currentTime - lastTime) / 1000; // Delta time in seconds
    lastTime = currentTime;

    // Get input actions
    const inputs = inputManager.getInputs();

    // Update game state based on input and time
    game.update(deltaTime, inputs);

    // Update UI elements
    scoreDisplay.textContent = `Score: ${game.getScore()}`;

    // Render the current game state
    renderer.render(game.getGameState());

    // Handle game over state
    if (game.isGameOver()) {
        showGameOver();
        stopGameLoop();
    }

    // Reset input state for next frame
    inputManager.resetFrameState();
}

/**
 * Starts the game loop.
 */
function startGameLoop() {
    if (!gameLoopId) {
        console.log("Starting game loop...");
        lastTime = performance.now(); // Reset time before starting
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

/**
 * Stops the game loop.
 */
function stopGameLoop() {
     if (gameLoopId) {
        console.log("Stopping game loop...");
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

/**
 * Displays the game over message.
 */
function showGameOver() {
    finalScoreDisplay.textContent = game.getScore();
    gameOverMessage.style.display = 'block';
    // Ensure controls layer doesn't interfere with restart button
    controlsLayer.style.pointerEvents = 'none';
}

/**
 * Hides the game over message.
 */
function hideGameOver() {
    gameOverMessage.style.display = 'none';
    // Re-enable controls layer for touch input if needed
     controlsLayer.style.pointerEvents = 'auto';
}

/**
 * Restarts the game.
 */
function restartGame() {
    console.log("Restarting game...");
    hideGameOver();
    game.init(); // Reset game logic
    inputManager.reset(); // Reset input state
    startGameLoop(); // Start the loop again
}

// Initialize the game when the script loads
init();
