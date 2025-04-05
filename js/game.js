import * as THREE from 'three';

/**
 * Manages the game state, objects, and logic.
 */
class Game {
    /**
     * Initializes the game world.
     * @param {Renderer} renderer - The renderer instance.
     * @param {InputHandler} input - The input handler instance.
     */
    constructor(renderer, input) {
        this.renderer = renderer;
        this.input = input;
        this.clock = new THREE.Clock();
        this.gameObjects = []; // Store all game objects (hero, houses, etc.)

        this.hero = null;
        this.heroSpeed = 5.0; // Units per second

        this._createMap();
        this._createHero();
        this._createEnvironment();
    }

    /**
     * Creates the ground plane for the map.
     */
    _createMap() {
        const mapSize = 100; // Size of the map plane
        const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
        // Simple green color for grass placeholder
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate plane to be horizontal
        ground.position.y = 0; // Position at the base level
        ground.receiveShadow = false; // Not casting or receiving shadows for now
        this.renderer.addObject(ground);
        this.gameObjects.push(ground); // Add to game objects if needed for collision later
    }

    /**
     * Creates the main hero character.
     */
    _createHero() {
        const heroGeometry = new THREE.BoxGeometry(1, 2, 1); // Simple box placeholder
        const heroMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red color
        this.hero = new THREE.Mesh(heroGeometry, heroMaterial);
        this.hero.position.set(0, 1, 0); // Position slightly above the ground
        this.hero.castShadow = false;
        this.renderer.addObject(this.hero);
        this.gameObjects.push(this.hero);
    }

    /**
     * Populates the map with placeholder houses and landscape elements.
     */
    _createEnvironment() {
        const houseGeometry = new THREE.BoxGeometry(4, 3, 5);
        const houseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color

        const housePositions = [
            new THREE.Vector3(10, 1.5, 10),
            new THREE.Vector3(-15, 1.5, 5),
            new THREE.Vector3(5, 1.5, -12),
        ];

        housePositions.forEach(pos => {
            const house = new THREE.Mesh(houseGeometry, houseMaterial);
            house.position.copy(pos);
            house.castShadow = false;
            this.renderer.addObject(house);
            this.gameObjects.push(house);
        });

        // Example landscape elements (e.g., "trees" as green cylinders)
        const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
        const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 }); // Dark green

        const treePositions = [
            new THREE.Vector3(20, 2, -15),
            new THREE.Vector3(-10, 2, -20),
            new THREE.Vector3(15, 2, 25),
             new THREE.Vector3(-25, 2, 15),
        ];

        treePositions.forEach(pos => {
             const tree = new THREE.Mesh(treeGeometry, treeMaterial);
             tree.position.copy(pos);
             tree.castShadow = false;
             this.renderer.addObject(tree);
             this.gameObjects.push(tree);
        });
    }

    /**
     * Updates the game state for the current frame.
     * @param {number} deltaTime - Time elapsed since the last frame in seconds.
     */
    update(deltaTime) {
        // Get movement input
        const moveVector = this.input.getMovementVector();

        // Update hero position based on input and speed
        if (this.hero) {
            const moveX = moveVector.x * this.heroSpeed * deltaTime;
            const moveZ = moveVector.z * this.heroSpeed * deltaTime;

            this.hero.position.x += moveX;
            this.hero.position.z += moveZ;

             // Basic boundary check (optional, based on map size)
             const mapBoundary = 49; // Slightly less than half map size
             this.hero.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, this.hero.position.x));
             this.hero.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, this.hero.position.z));


            // Update camera to follow hero
            this.renderer.updateCameraTarget(this.hero.position);
        }

        // Handle camera zoom input
        const zoomDelta = this.input.getZoomDelta();
         if (zoomDelta !== 0) {
             // Pass delta directly, renderer handles direction/speed
             this.renderer.zoomCamera(zoomDelta);
         }

        // Update other game logic here (e.g., animations, AI)
    }

    /**
     * Starts the game loop.
     */
    start() {
        // Use requestAnimationFrame for smooth animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            const deltaTime = this.clock.getDelta();
            this.update(deltaTime); // Update game logic
            this.renderer.render();   // Render the scene
        };
        animate(); // Start the loop
    }
}

export { Game };
