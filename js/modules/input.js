/**
 * @fileoverview Handles user input from keyboard and touch controls.
 */

import { KEY_MAP, TOUCH_CONTROLS } from '../utils/constants.js';

// State object to hold current input status
const inputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    actionA: false,
    actionB: false,
};

// --- Keyboard Input Handling ---

/**
 * Handles key down events.
 * @param {KeyboardEvent} event - The keyboard event object.
 */
function handleKeyDown(event) {
    // Prevent default browser behavior for game keys (e.g., arrow scrolling)
    if (Object.values(KEY_MAP).flat().includes(event.key)) {
        event.preventDefault();
    }

    if (KEY_MAP.UP.includes(event.key)) inputState.up = true;
    if (KEY_MAP.DOWN.includes(event.key)) inputState.down = true;
    if (KEY_MAP.LEFT.includes(event.key)) inputState.left = true;
    if (KEY_MAP.RIGHT.includes(event.key)) inputState.right = true;
    if (KEY_MAP.ACTION_A.includes(event.key)) inputState.actionA = true;
    if (KEY_MAP.ACTION_B.includes(event.key)) inputState.actionB = true;
}

/**
 * Handles key up events.
 * @param {KeyboardEvent} event - The keyboard event object.
 */
function handleKeyUp(event) {
    if (KEY_MAP.UP.includes(event.key)) inputState.up = false;
    if (KEY_MAP.DOWN.includes(event.key)) inputState.down = false;
    if (KEY_MAP.LEFT.includes(event.key)) inputState.left = false;
    if (KEY_MAP.RIGHT.includes(event.key)) inputState.right = false;
    if (KEY_MAP.ACTION_A.includes(event.key)) inputState.actionA = false;
    if (KEY_MAP.ACTION_B.includes(event.key)) inputState.actionB = false;
}

// --- Touch Input Handling ---

/**
 * Handles touch start events on control elements.
 * @param {TouchEvent} event - The touch event object.
 */
function handleTouchStart(event) {
    // Prevent default behaviors like scrolling or zooming
    event.preventDefault();

    for (const touch of event.changedTouches) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) continue;

        const elementId = element.id;
        setTouchState(elementId, true);

        // Add visual feedback class
        element.classList.add('active-touch');
    }
}

/**
 * Handles touch end events on control elements.
 * @param {TouchEvent} event - The touch event object.
 */
function handleTouchEnd(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
        // Find the element that was initially touched if possible,
        // otherwise check elements under the end point.
        // A more robust solution might track touch identifiers.
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

        // Check previously active elements as well
        const activeElements = document.querySelectorAll('.active-touch');

        // Combine potential elements and remove active state/class
        const potentialElements = [...elements, ...Array.from(activeElements)];

        potentialElements.forEach(element => {
            if (!element) return;
            const elementId = element.id;
            // Check if *any* remaining touch is still on this element
            let touchStillActive = false;
            for (const activeTouch of event.touches) {
                 const currentElement = document.elementFromPoint(activeTouch.clientX, activeTouch.clientY);
                 if(currentElement && currentElement.id === elementId) {
                    touchStillActive = true;
                    break;
                 }
            }

            if (!touchStillActive) {
                setTouchState(elementId, false);
                element.classList.remove('active-touch');
            }
        });

         // Ensure all active classes are removed if no touches remain
         if(event.touches.length === 0) {
             document.querySelectorAll('.active-touch').forEach(el => el.classList.remove('active-touch'));
         }
    }
}


/**
 * Updates the input state based on the touched element's ID.
 * @param {string} elementId - The ID of the DOM element touched.
 * @param {boolean} isActive - Whether the touch is starting (true) or ending (false).
 */
function setTouchState(elementId, isActive) {
    switch (elementId) {
        case TOUCH_CONTROLS.UP: inputState.up = isActive; break;
        case TOUCH_CONTROLS.DOWN: inputState.down = isActive; break;
        case TOUCH_CONTROLS.LEFT: inputState.left = isActive; break;
        case TOUCH_CONTROLS.RIGHT: inputState.right = isActive; break;
        case TOUCH_CONTROLS.A: inputState.actionA = isActive; break;
        case TOUCH_CONTROLS.B: inputState.actionB = isActive; break;
    }
}

/**
 * Initializes input event listeners.
 */
function init() {
    // Keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Touch listeners (attach to the controls container for delegation)
    const controlsContainer = document.getElementById('ui-controls');
    if (controlsContainer) {
        controlsContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        controlsContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        controlsContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false }); // Treat cancel like end

         // Prevent context menu on long press
        controlsContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    } else {
        console.warn("UI Controls container ('ui-controls') not found. Touch controls inactive.");
    }

    // Prevent scrolling and zooming on the body - crucial for mobile game feel
    document.body.addEventListener('touchstart', (e) => {
         // Allow touch events within the controls container
        if (e.target.closest('#ui-controls')) {
            return;
        }
        // Prevent default for touches outside the controls
        e.preventDefault();
    }, { passive: false });

     document.body.addEventListener('touchmove', (e) => {
          // Allow touch events within the controls container
        if (e.target.closest('#ui-controls')) {
            return;
        }
        // Prevent default for touches outside the controls
         e.preventDefault();
    }, { passive: false });


    console.log("Input system initialized.");
}

/**
 * Cleans up event listeners.
 */
function destroy() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    const controlsContainer = document.getElementById('ui-controls');
    if (controlsContainer) {
        controlsContainer.removeEventListener('touchstart', handleTouchStart);
        controlsContainer.removeEventListener('touchend', handleTouchEnd);
        controlsContainer.removeEventListener('touchcancel', handleTouchEnd);
        controlsContainer.removeEventListener('contextmenu', (e) => e.preventDefault());

    }
     // Remove body listeners if they were added
     // Note: Direct removal requires the same options object, simpler to just leave them
     // if the game scope is the entire page lifetime. If dynamically adding/removing game,
     // store the handler function reference for removal.
}

/**
 * Gets the current state of all inputs.
 * @returns {object} The current input state.
 */
function getState() {
    // Return a copy to prevent external modification
    return { ...inputState };
}

export const Input = {
    init,
    destroy,
    getState,
};
