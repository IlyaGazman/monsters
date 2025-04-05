/**
 * @fileoverview Manages UI elements, potentially overlays or integrated graphics.
 * For this version, it primarily ensures mobile controls visibility based on device detection.
 */

/**
 * Initializes the UI module.
 * Detects touch capabilities and adjusts UI visibility.
 */
function init() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    const uiControls = document.getElementById('ui-controls');

    if (isTouchDevice) {
        console.log("Touch device detected. Enabling mobile UI.");
        if (uiControls) {
            uiControls.style.display = 'block'; // Ensure visibility if CSS fails or is overridden
        }
        // Potentially hide desktop-specific hints here if added
    } else {
        console.log("Non-touch device detected. Hiding mobile UI.");
        if (uiControls) {
            uiControls.style.display = 'none'; // Ensure hidden
        }
        // Show desktop hints if applicable
    }

    // Example: Add a simple message overlay
    const messageOverlay = document.createElement('div');
    messageOverlay.id = 'message-overlay';
    messageOverlay.style.position = 'absolute';
    messageOverlay.style.top = '10px';
    messageOverlay.style.left = '10px';
    messageOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    messageOverlay.style.color = 'white';
    messageOverlay.style.padding = '5px 10px';
    messageOverlay.style.borderRadius = '5px';
    messageOverlay.style.display = 'none'; // Hidden by default
    messageOverlay.style.zIndex = '20'; // Above controls
    document.body.appendChild(messageOverlay);
}

/**
 * Shows a message on the screen.
 * @param {string} message - The message text to display.
 * @param {number} [duration=3000] - How long to show the message in milliseconds.
 */
function showMessage(message, duration = 3000) {
    const messageOverlay = document.getElementById('message-overlay');
    if (messageOverlay) {
        messageOverlay.textContent = message;
        messageOverlay.style.display = 'block';

        // Hide after duration
        setTimeout(() => {
            messageOverlay.style.display = 'none';
        }, duration);
    }
}

/**
 * Hides the message overlay immediately.
 */
function hideMessage() {
     const messageOverlay = document.getElementById('message-overlay');
    if (messageOverlay) {
        messageOverlay.style.display = 'none';
    }
}


export const UI = {
    init,
    showMessage,
    hideMessage,
};
