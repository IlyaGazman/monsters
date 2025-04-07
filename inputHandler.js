/**
 * inputHandler.js
 * Manages user input from touch, keyboard, and mouse.
 */

import * as GameLogic from './gameLogic.js';
import * as CONSTANTS from './constants.js';

let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let isDragging = false;
let dropButtonPressed = false; // Flag for dedicated drop button if implemented

const gameContainer = document.getElementById('game-container');
const shapeSelectionArea = document.getElementById('shape-selection-area');
const gameOverMessage = document.getElementById('game-over-message');

/**
 * Initializes input event listeners based on device type.
 */
export function initInputHandling() {
    // Prevent default touch behaviors like scrolling/zooming on the game container
    gameContainer.addEventListener('touchstart', preventDefault, { passive: false });
    gameContainer.addEventListener('touchmove', preventDefault, { passive: false });
    gameContainer.addEventListener('touchend', preventDefault, { passive: false });
    gameContainer.addEventListener('touchcancel', preventDefault, { passive: false });

    // --- Touch Controls ---
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameContainer.addEventListener('touchend', handleTouchEnd);

    // --- Keyboard Controls (Desktop Fallback) ---
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp); // For detecting release of fast drop key

    // --- Mouse/Click Controls (for Shape Selection & Restart) ---
    shapeSelectionArea.addEventListener('click', handleShapeSelectionClick);
    gameOverMessage.addEventListener('click', handleRestartClick);

     // Add visual feedback for shape selection clicks/taps
     shapeSelectionArea.addEventListener('touchstart', (e) => {
        const target = e.target.closest('.shape-preview-container');
        if (target) {
            target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; // Highlight on press
        }
     }, { passive: true });
     shapeSelectionArea.addEventListener('touchend', (e) => {
        const target = e.target.closest('.shape-preview-container');
         if (target) {
             target.style.backgroundColor = ''; // Remove highlight on release
         }
         // Also handle selection logic here for touch taps
         handleShapeSelectionClick(e);
     });


    console.log("Input handler initialized.");
}

/**
 * Prevents default browser behavior for an event.
 * @param {Event} e - The event object.
 */
function preventDefault(e) {
    // Only prevent default if the touch is within the game or UI areas, not general page scroll if exists outside
     if (e.target.closest('#game-container')) {
        e.preventDefault();
     }
}

// --- Touch Handlers ---

function handleTouchStart(e) {
    // Ignore multi-touch gestures
    if (e.touches.length > 1) {
        isDragging = false;
        return;
    }
     // Check if touch is on shape selection area
     if (e.target.closest('.shape-preview-container')) {
         isDragging = false; // Don't drag if starting on selection
         // Selection handled by touchend/click
         return;
     }

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchCurrentX = touchStartX;
    isDragging = true; // Assume dragging starts, will be refined in move/end
    dropButtonPressed = false; // Reset drop state
}

function handleTouchMove(e) {
     if (!isDragging || e.touches.length > 1 || GameLogic.getGameState() !== CONSTANTS.GAME_STATE.PLAYING || !GameLogic.getCurrentPiece()) {
        return; // Only process drag if active, single touch, playing, and piece exists
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchCurrentX;
    const deltaY = touch.clientY - touchStartY; // Check vertical movement for swipe down

    // Horizontal Movement (Threshold to avoid accidental moves)
    if (Math.abs(deltaX) > CONSTANTS.TOUCH_MOVE_THRESHOLD) {
        if (deltaX > 0) {
            GameLogic.movePieceHorizontal(1); // Move right
        } else {
            GameLogic.movePieceHorizontal(-1); // Move left
        }
        // Update reference point for next move calculation to prevent rapid multi-moves per single drag segment
        touchCurrentX = touch.clientX;
    }

    // Vertical Swipe Down for Fast Drop (Threshold)
    if (deltaY > CONSTANTS.TOUCH_SWIPE_THRESHOLD && !dropButtonPressed) {
        console.log("Swipe down detected");
        GameLogic.setFastDropping(true);
        dropButtonPressed = true; // Latch drop state until touch end
         isDragging = false; // Stop horizontal movement if swiped down
    }
}

function handleTouchEnd(e) {
     // If it was a swipe down, the drop state is handled, just reset flags.
     if (dropButtonPressed) {
        GameLogic.setFastDropping(false); // Stop fast drop on release
     } else if (isDragging) {
        // If it wasn't a significant drag or swipe, consider it a tap for hard drop? (Optional)
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) < CONSTANTS.TOUCH_MOVE_THRESHOLD * 2 && Math.abs(deltaY) < CONSTANTS.TOUCH_MOVE_THRESHOLD * 2) {
             // Could potentially trigger hard drop on tap, but might be confusing.
             // For now, tap doesn't do anything on the main area.
             // console.log("Tap detected");
             // GameLogic.hardDropPiece(); // Example: Hard drop on tap
        }
     }

    // Reset dragging state
    isDragging = false;
    dropButtonPressed = false;
}

// --- Keyboard Handlers ---

function handleKeyDown(e) {
    if (GameLogic.getGameState() !== CONSTANTS.GAME_STATE.PLAYING) return;
    
    // If left/right arrow keys, let camera controls handle them
    // Other keys (like drop or move horizontally) would be handled here.
    // (Implementation not shown in this snippet)
}

function handleKeyUp(e) {
    // Implementation details for key up events if required.
}

function handleShapeSelectionClick(e) {
    // Implementation for shape selection click event.
}

function handleRestartClick(e) {
    // Implementation for restart click event.
}
