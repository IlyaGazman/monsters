// --- Game Constants ---
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const PREVIEW_COUNT = 3;
const BASE_FALL_SPEED = 0.8; // Seconds per step
const FAST_FALL_SPEED = 0.05; // Seconds per step when dropping
const LEVEL_UP_LINES = 10; // Lines to clear for next level
const SPEED_INCREASE_FACTOR = 0.9; // Multiplier for fall speed per level
const SCORE_PER_LINE = [0, 100, 300, 500, 800]; // Score for 0, 1, 2, 3, 4 lines cleared at once

// --- Shape Definitions (No Rotation) ---
// Each shape is an array of [dx, dy] coordinates relative to a pivot point (usually [0,0])
const SHAPES = [
    { shape: [[0, 0], [-1, 0], [1, 0], [2, 0]], colorIndex: 0 },  // I shape (line)
    { shape: [[0, 0], [1, 0], [0, 1], [1, 1]], colorIndex: 1 },  // O shape (square)
    { shape: [[0, 0], [-1, 0], [1, 0], [0, 1]], colorIndex: 2 },  // T shape
    { shape: [[0, 0], [-1, 0], [0, -1], [1, -1]], colorIndex: 3 }, // S shape (using common Tetris orientation)
    { shape: [[0, 0], [1, 0], [0, -1], [-1, -1]], colorIndex: 4 }, // Z shape (using common Tetris orientation)
    { shape: [[0, 0], [-1, 0], [1, 0], [-1, 1]], colorIndex: 5 }, // J shape
    { shape: [[0, 0], [-1, 0], [1, 0], [1, 1]], colorIndex: 6 },  // L shape
];

// --- Game State ---
const GameState = {
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
    // PAUSED: 'PAUSED' // Could be added later
};

/**
 * Manages the core game logic, state, and rules.
 */
class Game {
    constructor(gridConfig) {
        this.gridWidth = gridConfig.width || GRID_WIDTH;
        this.gridHeight = gridConfig.height || GRID_HEIGHT;

        // Initialize properties in init()
        this.board = [];
        this.currentPiece = null;
        this.currentPosition = { x: 0, y: 0 };
        this.nextShapes = [];
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.fallTimer = 0;
        this.currentFallSpeed = BASE_FALL_SPEED;
        this.isDropping = false;
        this.gameState = GameState.PLAYING;
    }

    /**
     * Initializes or resets the game state.
     */
    init() {
        // Create empty board
        this.board = Array.from({ length: this.gridHeight }, () =>
            Array(this.gridWidth).fill(0)
        );

        // Reset game variables
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.currentFallSpeed = BASE_FALL_SPEED;
        this.isDropping = false;
        this.fallTimer = 0;
        this.gameState = GameState.PLAYING;

        // Generate initial preview shapes
        this.nextShapes = [];
        for (let i = 0; i < PREVIEW_COUNT; i++) {
            this.nextShapes.push(this.generateRandomShape());
        }

        // Select the first piece (no choice initially)
        this.selectShape(0); // Automatically takes the first previewed shape

        console.log("Game logic initialized.");
    }

    /**
     * Generates a new random shape definition.
     * @returns {object} A new shape object { shape: coords, colorIndex: number }.
     */
    generateRandomShape() {
        const randomIndex = Math.floor(Math.random() * SHAPES.length);
        // Return a copy to prevent mutation issues if needed later
        return { ...SHAPES[randomIndex] };
    }

    /**
     * Selects one of the preview shapes to be the next falling piece.
     * @param {number} index - The index (0, 1, or 2) of the shape to select from `nextShapes`.
     */
    selectShape(index) {
        if (index < 0 || index >= this.nextShapes.length || !this.nextShapes[index]) {
            console.warn(`Invalid shape selection index: ${index}`);
            // Optionally default to index 0 if invalid
            index = 0;
            if (!this.nextShapes[index]) return; // Still no valid shape
        }

        this.currentPiece = this.nextShapes.splice(index, 1)[0]; // Remove selected shape
        this.nextShapes.push(this.generateRandomShape()); // Add a new shape to the preview

        this.spawnNewPiece();
    }

    /**
     * Spawns the `currentPiece` onto the board.
     */
    spawnNewPiece() {
        this.isDropping = false; // Reset drop state
        this.fallTimer = 0; // Reset fall timer

        // Calculate starting position (center horizontally, near top)
        this.currentPosition = {
            x: Math.floor(this.gridWidth / 2),
            y: this.gridHeight - 1 // Start high (adjust based on shape height later)
        };

        // Adjust y position based on the highest block in the shape to prevent immediate collision
        let maxY = 0;
         if(this.currentPiece) {
            this.currentPiece.shape.forEach(([_, dy]) => {
                if (dy > maxY) maxY = dy;
            });
            this.currentPosition.y = this.gridHeight - 1 - maxY;
         }


        // Check for game over condition immediately upon spawn
        if (!this.isValidMove(this.currentPiece, this.currentPosition)) {
            this.gameState = GameState.GAME_OVER;
            this.currentPiece = null; // Stop rendering the invalid piece
            console.log("Game Over - Cannot spawn new piece.");
        }
    }

    /**
     * Checks if a piece at a given position is valid (within bounds and not colliding).
     * @param {object} piece - The piece object.
     * @param {object} position - The {x, y} position to check.
     * @returns {boolean} True if the move is valid, false otherwise.
     */
    isValidMove(piece, position) {
        if (!piece) return false; // No piece to check

        for (const [dx, dy] of piece.shape) {
            const checkX = position.x + dx;
            const checkY = position.y + dy;

            // Check boundaries
            if (checkX < 0 || checkX >= this.gridWidth || checkY < 0) {
                 // Allow collision above grid top (y >= gridHeight) during spawn/movement
                if(checkY >= this.gridHeight) continue;
                return false;
            }

            // Check collision with existing blocks on the board
             // Only check cells within the board's height
             if (checkY < this.gridHeight && this.board[checkY] && this.board[checkY][checkX] !== 0) {
                 return false;
             }
        }
        return true;
    }

    /**
     * Attempts to move the current piece horizontally.
     * @param {number} direction - -1 for left, 1 for right.
     */
    moveHorizontal(direction) {
        if (this.gameState !== GameState.PLAYING || !this.currentPiece) return;

        const newPosition = { ...this.currentPosition, x: this.currentPosition.x + direction };
        if (this.isValidMove(this.currentPiece, newPosition)) {
            this.currentPosition = newPosition;
            this.fallTimer = 0; // Reset fall timer slightly on move
        }
    }

    /**
     * Attempts to move the current piece down by one step.
     * Handles placing the piece if it cannot move down further.
     */
    moveDown() {
        if (this.gameState !== GameState.PLAYING || !this.currentPiece) return;

        const newPosition = { ...this.currentPosition, y: this.currentPosition.y - 1 };

        if (this.isValidMove(this.currentPiece, newPosition)) {
            this.currentPosition = newPosition;
        } else {
            // Cannot move down, place the piece
            this.placePiece();
            // After placing, player needs to select next shape
            // Reset current piece until selection happens
            this.currentPiece = null;
        }
         this.fallTimer = 0; // Reset timer after manual or automatic step down
    }

    /**
     * Activates fast dropping for the current piece.
     */
    startDropping() {
        if (this.gameState === GameState.PLAYING && this.currentPiece) {
            this.isDropping = true;
        }
    }

    /**
     * Locks the current piece onto the board grid.
     */
    placePiece() {
        if (!this.currentPiece) return;

        this.currentPiece.shape.forEach(([dx, dy]) => {
            const boardX = this.currentPosition.x + dx;
            const boardY = this.currentPosition.y + dy;
            // Ensure placement is within board bounds (important for pieces spawning high)
            if (boardY >= 0 && boardY < this.gridHeight && boardX >= 0 && boardX < this.gridWidth) {
                 // Use colorIndex + 1 to avoid storing 0 (empty)
                this.board[boardY][boardX] = this.currentPiece.colorIndex + 1;
            }
        });

        this.clearLines(); // Check for line clears after placing

        // Piece is placed, reset state for next selection/spawn
        this.currentPiece = null;
        this.isDropping = false; // Stop dropping state

        // Note: The next piece isn't spawned here automatically.
        // It waits for the player to select one from the preview via input.
    }

    /**
     * Checks for and clears completed lines, updating score and level.
     */
    clearLines() {
        let linesClearedCount = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            // Check if row 'y' is full
            if (this.board[y].every(cell => cell !== 0)) {
                linesClearedCount++;
                // Remove the full row
                this.board.splice(y, 1);
                // Add a new empty row at the top
                this.board.push(Array(this.gridWidth).fill(0));
                // Decrement y to re-check the new row at the same index
                y--;
            }
        }

        if (linesClearedCount > 0) {
            // Update score based on lines cleared at once
            this.score += SCORE_PER_LINE[linesClearedCount] * this.level;
            this.linesCleared += linesClearedCount;

            // Check for level up
            const newLevel = Math.floor(this.linesCleared / LEVEL_UP_LINES) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                // Increase speed
                this.currentFallSpeed = Math.max(FAST_FALL_SPEED, BASE_FALL_SPEED * Math.pow(SPEED_INCREASE_FACTOR, this.level - 1));
                console.log(`Level Up! Level: ${this.level}, Speed: ${this.currentFallSpeed.toFixed(2)}s`);
            }
            console.log(`Cleared ${linesClearedCount} lines. Score: ${this.score}`);
        }
    }

    /**
     * Main game loop update function.
     * @param {number} deltaTime - Time elapsed since the last frame in seconds.
     * @param {object} inputs - Object containing player input actions for this frame.
     */
    update(deltaTime, inputs) {
        if (this.gameState !== GameState.PLAYING) return;

        // Handle shape selection FIRST if no piece is falling
        if (!this.currentPiece && inputs.selectShape !== null) {
             console.log(`Player selected shape index: ${inputs.selectShape}`);
             this.selectShape(inputs.selectShape); // This will spawn the selected piece
             // Don't process other inputs in the same frame as selection/spawn
             return;
        }

        // Handle piece movement inputs only if a piece is falling
        if (this.currentPiece) {
            if (inputs.moveLeft) {
                this.moveHorizontal(-1);
            }
            if (inputs.moveRight) {
                this.moveHorizontal(1);
            }
            if (inputs.drop) {
                this.startDropping();
            }

             // Update fall timer
            this.fallTimer += deltaTime;
            const speed = this.isDropping ? FAST_FALL_SPEED : this.currentFallSpeed;

            // Move piece down based on timer or drop state
            if (this.fallTimer >= speed) {
                this.moveDown();
                // If moveDown resulted in placing the piece, currentPiece becomes null
                // The next update cycle will wait for selection input
            }
        }

        // Note: Game over is checked during spawnNewPiece
    }

    /**
     * Returns the current game state for rendering.
     * @returns {object} Contains board, currentPiece, currentPosition, nextShapes.
     */
    getGameState() {
        return {
            board: this.board,
            currentPiece: this.currentPiece,
            currentPosition: this.currentPosition,
            nextShapes: this.nextShapes,
            // Add other state info if needed by renderer (e.g., score, level)
        };
    }

    /**
     * Checks if the game is over.
     * @returns {boolean} True if the game is over, false otherwise.
     */
    isGameOver() {
        return this.gameState === GameState.GAME_OVER;
    }

     /**
     * Gets the current score.
     * @returns {number} The current score.
     */
     getScore() {
        return this.score;
     }
}

export default Game;
