import * as THREE from 'three';

/**
 * Handles the rendering setup and loop using three.js.
 */
class Renderer {
    /**
     * Initializes the renderer, scene, camera, and lights.
     * @param {HTMLElement} container - The container element for the canvas.
     */
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Camera setup (Orthographic for top-down view)
        const aspect = window.innerWidth / window.innerHeight;
        // Frustum size - larger number means more visible area (zoomed out)
        this.frustumSize = 20;
        this.camera = new THREE.OrthographicCamera(
            this.frustumSize * aspect / -2,
            this.frustumSize * aspect / 2,
            this.frustumSize / 2,
            this.frustumSize / -2,
            1, // Near plane
            1000 // Far plane
        );
        this.camera.position.set(0, 50, 0); // Positioned directly above the center
        this.camera.lookAt(this.scene.position); // Look down at the origin

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Soft white light
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50); // Angle the light
        directionalLight.castShadow = false; // Shadows disabled for performance on simple shapes
        this.scene.add(directionalLight);

        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    /**
     * Updates renderer size and camera aspect ratio on window resize.
     */
    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = this.frustumSize * aspect / -2;
        this.camera.right = this.frustumSize * aspect / 2;
        this.camera.top = this.frustumSize / 2;
        this.camera.bottom = this.frustumSize / -2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Renders the scene from the camera's perspective.
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Adjusts the camera zoom level (orthographic size).
     * @param {number} delta - Change in zoom level (positive for zoom in, negative for zoom out).
     */
    zoomCamera(delta) {
        const zoomSpeed = 0.1;
        this.frustumSize -= delta * this.frustumSize * zoomSpeed;
        // Clamp zoom level to avoid inverting or extreme zoom
        this.frustumSize = Math.max(5, Math.min(100, this.frustumSize));
        this.onWindowResize(); // Update camera projection matrix
    }

    /**
     * Updates the camera position to follow a target object.
     * @param {THREE.Vector3} targetPosition - The position of the object to follow.
     */
    updateCameraTarget(targetPosition) {
         // Keep the camera directly above the target, maintaining its height
        this.camera.position.x = targetPosition.x;
        this.camera.position.z = targetPosition.z;
        // Ensure camera continues looking down
        this.camera.lookAt(targetPosition.x, 0, targetPosition.z);
    }

    /**
     * Adds an object to the scene.
     * @param {THREE.Object3D} object - The object to add.
     */
    addObject(object) {
        this.scene.add(object);
    }

    /**
     * Removes an object from the scene.
     * @param {THREE.Object3D} object - The object to remove.
     */
    removeObject(object) {
        this.scene.remove(object);
    }
}

export { Renderer };
