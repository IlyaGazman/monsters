/**
 * @fileoverview Manages the Three.js scene, camera, renderer, and rendering loop updates.
 */

import * as THREE from 'three';
import { TILE_SIZE, RENDER_DISTANCE, GRID_DIMENSIONS } from '../utils/constants.js';

let scene, camera, renderer;
let playerMesh; // Reference to the player's visual representation
let gameMapMeshes = []; // Array to hold map tile meshes

/**
 * Initializes the Three.js environment.
 * @param {HTMLElement} container - The DOM element to render the canvas into.
 */
function init(container) {
    // --- Basic Scene Setup ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    scene.fog = new THREE.Fog(0x87CEEB, RENDER_DISTANCE * 0.5, RENDER_DISTANCE); // Add fog for depth

    // --- Camera Setup ---
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, RENDER_DISTANCE * 1.5);
    // Position camera slightly above and behind the potential player start position
    camera.position.set(0, TILE_SIZE * 1.5, TILE_SIZE * 2.5);
    camera.lookAt(0, 0, 0); // Look towards the center initially

    // --- Renderer Setup ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Sun-like light
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Initial Scene Content ---
    createInitialMap();
    createPlayerPlaceholder();

    // --- Resize Handling ---
    window.addEventListener('resize', () => onWindowResize(container), false);
}

/**
 * Creates a placeholder visual representation for the player.
 * Uses simple geometry as per requirements (vector-based).
 */
function createPlayerPlaceholder() {
    const geometry = new THREE.BoxGeometry(TILE_SIZE * 0.8, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
    // Simple red color, reminiscent of the player character's hat/theme
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    playerMesh = new THREE.Mesh(geometry, material);
    // Initial position slightly above the ground plane
    playerMesh.position.set(0, TILE_SIZE * 0.4, 0);
    scene.add(playerMesh);
}

/**
 * Creates a basic grid-based map using simple geometry.
 */
function createInitialMap() {
    const mapWidth = GRID_DIMENSIONS.width * TILE_SIZE;
    const mapHeight = GRID_DIMENSIONS.height * TILE_SIZE;

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90, side: THREE.DoubleSide }); // Light green
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    groundPlane.position.y = 0; // Place at Y=0
    scene.add(groundPlane);
    gameMapMeshes.push(groundPlane);

    // Example Obstacle (simple cube)
    const obstacleGeometry = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(TILE_SIZE * 3, TILE_SIZE * 0.5, TILE_SIZE * 2); // Position relative to grid
    scene.add(obstacle);
    gameMapMeshes.push(obstacle); // Add to map meshes for potential interaction/cleanup
    // Add more map elements like buildings, grass patches etc. using simple geometries
}

/**
 * Updates the player's visual representation position.
 * @param {THREE.Vector3} position - The new position vector.
 */
function updatePlayerPosition(position) {
    if (playerMesh) {
        // Lerp for smoother movement (optional, can be direct set)
        playerMesh.position.lerp(position.clone().setY(TILE_SIZE * 0.4), 0.1);
       // playerMesh.position.set(position.x, TILE_SIZE * 0.4, position.z); // Direct set

        // Update camera to follow the player
        updateCameraFollow();
    }
}

/**
 * Updates the camera to follow the player mesh smoothly.
 */
function updateCameraFollow() {
    if (playerMesh && camera) {
        const targetPosition = new THREE.Vector3();
        // Camera offset from player
        const offset = new THREE.Vector3(0, TILE_SIZE * 3, TILE_SIZE * 4);
        targetPosition.copy(playerMesh.position).add(offset);

        // Smoothly move camera towards the target position
        camera.position.lerp(targetPosition, 0.05);
        // Always look at the player's current position slightly adjusted upwards
        const lookAtTarget = playerMesh.position.clone().add(new THREE.Vector3(0, TILE_SIZE * 0.5, 0));
        camera.lookAt(lookAtTarget);
    }
}


/**
 * Handles window resize events to update camera aspect ratio and renderer size.
 * @param {HTMLElement} container - The game container element.
 */
function onWindowResize(container) {
    if (camera && renderer && container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

/**
 * Renders the current scene with the camera.
 */
function render() {
    if (renderer && scene && camera) {
        // Update camera follow in each frame if needed
         updateCameraFollow();
        renderer.render(scene, camera);
    }
}

export const Renderer = {
    init,
    render,
    updatePlayerPosition,
    // Expose scene if needed by other modules (e.g., for adding dynamic elements)
    getScene: () => scene,
    getPlayerMesh: () => playerMesh, // Allow game logic to access player mesh if needed
};
