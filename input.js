/**
 * Manages user input from keyboard, mouse, and touch events.
 */
class InputManager {
    constructor(touchElement, camera, initialPreviewBounds) {
        this.touchElement = touchElement; // Element for touch gestures (e.g., controls-layer)
        this.camera = camera; // Reference to the Three.js camera for potential raycasting/unprojection
        this.previewAreaBounds = initialPreviewBounds || []; // Screen coords for preview areas {index, x, y, width, height}

        // Input state reset each frame
        this.frameInputs = {
            moveLeft: false,
            moveRight: false,
            drop: false,
            selectShape: null, // Index (0, 1, 2) or null
        };

        // Persistent state for touch dragging
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.isDragging = false;
        this.touchStartTime = 0;
        this.dragThresholdX = 20; // Minimum pixels moved horizontally to count as drag intent
        this.swipeThresholdY = 50; // Minimum pixels moved vertically down fast enough
        this.swipeMaxTime = 300; // Max time in ms for a swipe action

        // Bind event listeners
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleClick = this._handleClick.bind(this); // Handle clicks for desktop preview selection
    }

    /**
     * Initializes event listeners.
     */
    init() {
        window.addEventListener('keydown', this._handleKeyDown);

        // Use the dedicated touch element for gestures
        this.touchElement.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        this.touchElement.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        this.touchElement.addEventListener('touchend', this._handleTouchEnd);
        this.touchElement.addEventListener('touchcancel', this._handleTouchEnd); // Treat cancel like end

        // Use click listener on the touch element for desktop preview selection fallback
        this.touchElement.addEventListener('click', this._handleClick);

        console.log("Input Manager initialized.");
    }

    /**
     * Removes event listeners.
     */
    destroy() {
        window.removeEventListener('keydown', this._handleKeyDown);
        this.touchElement.removeEventListener('touchstart', this._handleTouchStart);
        this.touchElement.removeEventListener('touchmove', this._handleTouchMove);
        this.touchElement.removeEventListener('touchend', this._handleTouchEnd);
        this.touchElement.removeEventListener('touchcancel', this._handleTouchEnd);
        this.touchElement.removeEventListener('click', this._handleClick);
    }

    /**
     * Updates the screen bounds for the preview areas.
     * @param {Array<object>} bounds - Array of {index, x, y, width, height}.
     */
    setPreviewAreaBounds(bounds) {
        this.previewAreaBounds = bounds || [];
    }


    /**
     * Resets the input state for the current frame. Should be called after processing inputs.
     */
    resetFrameState() {
        this.frameInputs = {
            moveLeft: false,
            moveRight: false,
            drop: false,
            selectShape: null,
        };
    }

    /**
     * Resets the entire input manager state (e.g., on game restart).
     */
    reset() {
        this.resetFrameState();
        this.isDragging = false;
        this.touchStartX = 0;
        this.touchCurrentX = 0;
         this.touchStartY = 0;
         this.touchCurrentY = 0;
         this.touchStartTime = 0;
    }

    /**
     * Gets the processed input actions for the current frame.
     * @returns {object} The frameInputs object.
     */
    getInputs() {
        return this.frameInputs;
    }

    // --- Event Handlers ---

    _handleKeyDown(event) {
        // Ignore inputs if a modifier key is pressed (e.g., during browser shortcuts)
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        // Prevent default browser behavior for handled keys
         let handled = false;
        switch (event.key) {
            case 'ArrowLeft':
            case 'a': // Common alternative
                this.frameInputs.moveLeft = true;
                handled = true;
                break;
            case 'ArrowRight':
            case 'd': // Common alternative
                this.frameInputs.moveRight = true;
                 handled = true;
                break;
            case 'ArrowDown':
            case ' ': // Space bar for drop
            case 's': // Common alternative
                this.frameInputs.drop = true;
                 handled = true;
                break;
            case '1':
                 this.frameInputs.selectShape = 0;
                 handled = true;
                 break;
            case '2':
                 this.frameInputs.selectShape = 1;
                 handled = true;
                 break;
            case '3':
                 this.frameInputs.selectShape = 2;
                 handled = true;
                 break;
        }
         if (handled) {
            event.preventDefault();
         }
    }

    _handleTouchStart(event) {
        // Prevent default scroll/zoom behavior
        event.preventDefault();

        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.touchStartX = touch.clientX;
            this.touchCurrentX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchCurrentY = touch.clientY;
            this.isDragging = true; // Assume dragging starts, will be confirmed on move
            this.touchStartTime = performance.now();

            // Check if touch start is within a preview area (for immediate selection)
            this._checkPreviewTap(touch.clientX, touch.clientY);
        }
    }

    _handleTouchMove(event) {
        // Prevent default scroll/zoom behavior
        event.preventDefault();

        if (!this.isDragging || event.touches.length === 0) return;

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchCurrentX;
        // const deltaY = touch.clientY - this.touchCurrentY; // Keep track for swipe detection

        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;

        // Check horizontal drag threshold to trigger movement
        const totalDeltaX = this.touchCurrentX - this.touchStartX;
        if (Math.abs(totalDeltaX) > this.dragThresholdX) {
             // Determine direction based on movement since last frame's update
             // Simple approach: if deltaX is significant, trigger move
             const moveSensitivity = 10; // Adjust sensitivity
             if (deltaX > moveSensitivity) {
                 this.frameInputs.moveRight = true;
             } else if (deltaX < -moveSensitivity) {
                 this.frameInputs.moveLeft = true;
             }

             // Alternative: Calculate total drag segments and issue moves
             // For simplicity, we trigger based on frame delta if threshold met
        }
    }

    _handleTouchEnd(event) {
         // Prevent default behavior if touch interactions occurred
        if (this.isDragging) {
           event.preventDefault(); // May not be needed on touchend, but good practice
        }

        if (!this.isDragging) return;

        const touchEndTime = performance.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;

        // Check for Swipe Down gesture
        if (
            deltaY > this.swipeThresholdY && // Moved down enough
            Math.abs(deltaX) < Math.abs(deltaY) * 0.8 && // Primarily vertical movement
            touchDuration < this.swipeMaxTime // Fast enough
        ) {
            this.frameInputs.drop = true;
             console.log("Swipe down detected (drop)");
        } else if (Math.abs(deltaX) < this.dragThresholdX && Math.abs(deltaY) < this.dragThresholdX && touchDuration < 200) {
            // If it wasn't a significant drag or swipe, treat as a Tap
            // We already checked for preview taps on touchstart, could re-check here
            // Or add logic for tapping the main game area (e.g., for a drop button zone)
            console.log("Tap detected (no action assigned here)");
        }

        // Reset dragging state
        this.isDragging = false;
    }

     _checkPreviewTap(clientX, clientY) {
         for (const area of this.previewAreaBounds) {
             if (
                 clientX >= area.x &&
                 clientX <= area.x + area.width &&
                 clientY >= area.y &&
                 clientY <= area.y + area.height
             ) {
                 this.frameInputs.selectShape = area.index;
                 console.log(`Tapped preview area index: ${area.index}`);
                 // Reset drag state if tap selects, prevent accidental drag motion
                 this.isDragging = false;
                 return true; // Tap handled
             }
         }
         return false; // No preview area tapped
     }


    // Handle clicks (primarily for desktop preview selection)
     _handleClick(event) {
         // We use the same logic as touch tap for preview selection
         if (!this._checkPreviewTap(event.clientX, event.clientY)) {
            // Click outside preview areas - could potentially trigger drop if in game area?
            // console.log("Clicked outside preview");
         }
     }
}

export default InputManager;
