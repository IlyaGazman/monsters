/**
 * Handles user input from keyboard, mouse, and touch controls.
 */
class InputHandler {
    constructor() {
        this.keys = {}; // Store keyboard key states
        this.touch = {
            active: false,
            x: 0,
            y: 0,
            dx: 0, // Change in x from joystick center
            dy: 0, // Change in y from joystick center
            zoomDelta: 0 // Touch-based zoom change
        };
        this.mouseWheelDelta = 0;
        this.isTouchDevice = this._detectTouchDevice();

        this._addEventListeners();
        this._setupTouchUI();
    }

    /**
     * Detects if the device supports touch events.
     * @returns {boolean} True if it's likely a touch device, false otherwise.
     */
    _detectTouchDevice() {
        return (('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0));
    }

    /**
     * Sets up visibility of touch UI elements based on device type.
     */
    _setupTouchUI() {
        const joystick = document.getElementById('joystick-container');
        const zoomControls = document.getElementById('zoom-controls');
        if (this.isTouchDevice) {
            if (joystick) joystick.style.display = 'block';
            if (zoomControls) zoomControls.style.display = 'flex'; // Use flex as set in HTML
        } else {
            // Hide touch controls on non-touch devices
             if (joystick) joystick.style.display = 'none';
             if (zoomControls) zoomControls.style.display = 'none';
        }
    }

    /**
     * Adds event listeners for keyboard, mouse wheel, and touch.
     */
    _addEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Mouse wheel for zooming on desktop
        window.addEventListener('wheel', this._handleMouseWheel.bind(this), { passive: false });

        // Touch events (if applicable)
        if (this.isTouchDevice) {
            const joystickThumb = document.getElementById('joystick-thumb');
            const joystickContainer = document.getElementById('joystick-container');
            const zoomInButton = document.getElementById('zoom-in');
            const zoomOutButton = document.getElementById('zoom-out');

            if (joystickThumb && joystickContainer) {
                joystickThumb.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
                joystickThumb.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
                joystickThumb.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: false });
                joystickThumb.addEventListener('touchcancel', this._handleTouchEnd.bind(this), { passive: false });

                 // Prevent default scroll/zoom behavior on the joystick itself
                joystickContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            }

             if (zoomInButton) {
                 zoomInButton.addEventListener('touchstart', (e) => { e.preventDefault(); this.touch.zoomDelta = 1; });
                 zoomInButton.addEventListener('touchend', (e) => { e.preventDefault(); this.touch.zoomDelta = 0; });
             }
             if (zoomOutButton) {
                 zoomOutButton.addEventListener('touchstart', (e) => { e.preventDefault(); this.touch.zoomDelta = -1; });
                 zoomOutButton.addEventListener('touchend', (e) => { e.preventDefault(); this.touch.zoomDelta = 0; });
             }

             // Prevent default gestures on the whole page for a better game feel
             // Be cautious with this, as it can disable useful browser features.
             // document.body.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
             // document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        }
         // Prevent default browser behavior for arrow keys and space
         window.addEventListener('keydown', (e) => {
            if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        }, false);
    }

    /**
     * Handles mouse wheel events for zooming.
     * @param {WheelEvent} event - The wheel event object.
     */
    _handleMouseWheel(event) {
        event.preventDefault(); // Prevent page scrolling
        // Normalize wheel delta across browsers
        this.mouseWheelDelta = Math.sign(event.deltaY) * -1; // Invert for intuitive zoom
    }

    /**
     * Handles the start of a touch event on the joystick.
     * @param {TouchEvent} event - The touch event object.
     */
    _handleTouchStart(event) {
        event.preventDefault();
        this.touch.active = true;
        const touch = event.touches[0];
        this._updateJoystick(touch.clientX, touch.clientY);
    }

    /**
     * Handles touch movement on the joystick.
     * @param {TouchEvent} event - The touch event object.
     */
    _handleTouchMove(event) {
        event.preventDefault();
        if (!this.touch.active) return;
        const touch = event.touches[0];
        this._updateJoystick(touch.clientX, touch.clientY);
    }

     /**
     * Updates the joystick position and input values based on touch coordinates.
     * @param {number} clientX - The clientX coordinate of the touch.
     * @param {number} clientY - The clientY coordinate of the touch.
     */
    _updateJoystick(clientX, clientY) {
        const joystickContainer = document.getElementById('joystick-container');
        const joystickThumb = document.getElementById('joystick-thumb');
        const rect = joystickContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;

        // Limit movement within the joystick container radius
        const maxDistance = rect.width / 2 - joystickThumb.offsetWidth / 2; // Max distance from center
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }

        // Update thumb position visually
        joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;

        // Normalize dx, dy to range [-1, 1] for game input
        this.touch.dx = dx / maxDistance;
         // Invert dy because screen Y is downwards, but game world Y/Z is often upwards/forwards
        this.touch.dy = -dy / maxDistance;
    }

    /**
     * Handles the end of a touch event on the joystick.
     * @param {TouchEvent} event - The touch event object.
     */
    _handleTouchEnd(event) {
        // Don't prevent default here if you want other elements to potentially handle touchend
        if (!this.touch.active) return;

        this.touch.active = false;
        this.touch.dx = 0;
        this.touch.dy = 0;

        // Reset thumb position visually
        const joystickThumb = document.getElementById('joystick-thumb');
        if (joystickThumb) {
            joystickThumb.style.transform = `translate(0px, 0px)`;
        }
    }

    /**
     * Gets the current movement vector based on active inputs.
     * @returns {{x: number, z: number}} - Normalized movement vector.
     */
    getMovementVector() {
        let x = 0;
        let z = 0; // Use Z for depth/forward in 3D space

        // Keyboard input (WASD and Arrow Keys)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1; // Move forward (negative Z)
        if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1; // Move backward (positive Z)

        // Touch input (Overrides keyboard if active)
        if (this.touch.active) {
            x = this.touch.dx;
            z = this.touch.dy; // dy maps to forward/backward (Z)
        }

        // Normalize the vector if needed (diagonal movement isn't faster)
        const length = Math.sqrt(x * x + z * z);
        if (length > 1) {
            x /= length;
            z /= length;
        }

        return { x, z };
    }

    /**
     * Gets the current zoom delta from mouse wheel or touch buttons.
     * Resets mouse wheel delta after reading.
     * @returns {number} - Zoom delta (-1, 0, or 1).
     */
    getZoomDelta() {
        if (this.isTouchDevice) {
            return this.touch.zoomDelta; // Continuous zoom while button held
        } else {
            const delta = this.mouseWheelDelta;
            this.mouseWheelDelta = 0; // Reset after reading
            return delta;
        }
    }
}

export { InputHandler };
