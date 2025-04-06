// Ensure THREE is available globally via the included script tag
const THREE = window.THREE;

/**
 * Game Initialization and State Management
 */
class CubeCounterGame {
    constructor(containerId = 'game-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id #${containerId} not found.`);
            return;
        }

        // Game State
        this.level = 1;
        this.correctAnswer = 0;
        this.options = [];
        this.isProcessingAnswer = false; // Prevent multiple clicks during feedback

        // Basic device check (presence of touch events)
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // UI Elements
        this.levelDisplay = document.getElementById('level-display');
        this.messageDisplay = document.getElementById('message-display');
        this.optionButtons = document.querySelectorAll('.option-button');

        this.initThree();
        this.initUI();
        this.startGame();
        this.animate();
    }

    /**
     * Initialize Three.js Scene, Camera, Renderer, and Lights.
     */
    initThree() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xabcdef); // Light blue background

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        // Position camera for a good view, slightly elevated and tilted down
        this.camera.position.set(5, 4, 5); // Position adjusted for better view
        this.camera.lookAt(0, 0.5, 0); // Look towards the center base of piles (adjust Y slightly up)


        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high DPI screens
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Brighter directional light
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Group to hold all cube piles for easier rotation/positioning
        this.cubeGroup = new THREE.Group();
        this.scene.add(this.cubeGroup);

        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    /**
     * Initialize UI elements and event listeners.
     */
    initUI() {
        this.optionButtons.forEach(button => {
            const eventType = this.isTouchDevice ? 'touchstart' : 'click';
            button.addEventListener(eventType, (e) => {
                // Prevent interfering browser actions on touch
                if (this.isTouchDevice) e.preventDefault();
                if (this.isProcessingAnswer) return; // Ignore clicks if processing

                const choiceIndex = parseInt(e.target.dataset.choice, 10);
                this.checkAnswer(this.options[choiceIndex], button);
            });
        });
    }

    /**
     * Start the game or proceed to the next level.
     */
    startGame() {
        this.isProcessingAnswer = false; // Allow input for new level
        this.generateLevel();
        this.renderCubes();
        this.updateUI();
    }

    /**
     * Generate parameters for the current level.
     */
    generateLevel() {
        // Determine the number of blocks for each pile
        const baseMax = 5; // Minimum blocks possible across piles increases slightly
        const levelMultiplier = 2; // How much max blocks increase per level
        const maxBlocksPerPile = Math.floor(baseMax + this.level * levelMultiplier / 3); // Approx max per pile

        // Ensure pile00 is the tallest (or equal)
        let pile00Count = Math.floor(Math.random() * maxBlocksPerPile) + 1; // Must have at least 1
        let pile01Count = Math.floor(Math.random() * (pile00Count)) + 1; // Max is pile00Count
        let pile10Count = Math.floor(Math.random() * (pile00Count)) + 1; // Max is pile00Count

        this.correctAnswer = pile00Count + pile01Count + pile10Count;
        this.pileCounts = { '00': pile00Count, '01': pile01Count, '10': pile10Count };

        // Generate answer options: one correct, three incorrect, sequential positive numbers
        this.options = this.generateOptions(this.correctAnswer);
    }

    /**
     * Generates 4 sequential, positive integer options including the correct answer.
     * @param {number} correctAnswer - The correct value.
     * @returns {number[]} - An array of 4 option values, shuffled.
     */
    generateOptions(correctAnswer) {
        const options = new Set(); // Use Set to avoid duplicates initially
        options.add(correctAnswer);

        // Decide starting point for sequential options
        // Ensure options stay positive
        let startValue = Math.max(1, correctAnswer - Math.floor(Math.random() * 3)); // Start 0-2 before correct answer

        for (let i = 0; options.size < 4; i++) {
             const potentialOption = startValue + i;
             if (potentialOption > 0) { // Ensure positivity
                 options.add(potentialOption);
             }
             // Safety break if something goes wrong
             if (i > 10) break;
        }


        // Convert Set to array and shuffle
        const optionsArray = Array.from(options);
        for (let i = optionsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
        }
        return optionsArray;
    }


    /**
     * Clears previous cubes and renders new ones based on pileCounts.
     */
    renderCubes() {
        // Clear previous cubes
        while (this.cubeGroup.children.length > 0) {
            this.cubeGroup.remove(this.cubeGroup.children[0]);
        }

        const cubeSize = 0.8; // Size of each cube
        const gap = 0.05; // Small gap between cubes
        const pileSpacing = 1.5; // Distance between pile centers

        // Define materials for each pile
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Red for pile 0,0
            new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // Green for pile 0,1
            new THREE.MeshStandardMaterial({ color: 0x0000ff })  // Blue for pile 1,0
        ];

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

        // Function to create a single pile
        const createPile = (count, material, offsetX, offsetZ) => {
            for (let i = 0; i < count; i++) {
                const cube = new THREE.Mesh(geometry, material);
                // Position cubes vertically, starting from slightly above ground (y=0)
                cube.position.set(
                    offsetX,
                    (cubeSize / 2) + i * (cubeSize + gap), // Stack vertically
                    offsetZ
                );
                 // Add slight random rotation to each cube for visual interest
                cube.rotation.x = Math.random() * 0.1 - 0.05;
                cube.rotation.y = Math.random() * 0.1 - 0.05;
                cube.rotation.z = Math.random() * 0.1 - 0.05;
                this.cubeGroup.add(cube);
            }
        };

        // Create piles based on counts and positions
        // Pile 0,0 (Tallest) at origin (relative to group)
        createPile(this.pileCounts['00'], materials[0], 0, 0);
        // Pile 0,1 (Back) at (0, 0, -pileSpacing)
        createPile(this.pileCounts['01'], materials[1], 0, -pileSpacing);
        // Pile 1,0 (Right) at (pileSpacing, 0, 0)
        createPile(this.pileCounts['10'], materials[2], pileSpacing, 0);


        // Rotate the entire group by -45 degrees (PI/4 radians) around the Y axis
        this.cubeGroup.rotation.y = -Math.PI / 4;

        // Center the group slightly to improve camera view
        this.cubeGroup.position.set(-pileSpacing / 2, 0, pileSpacing / 2);
    }


    /**
     * Update UI text elements.
     */
    updateUI() {
        this.levelDisplay.textContent = `Level: ${this.level}`;
        this.messageDisplay.textContent = "How many cubes in total?";
        this.optionButtons.forEach((button, index) => {
            button.textContent = this.options[index];
            button.style.backgroundColor = ''; // Reset background color
            button.disabled = false; // Re-enable button
        });
    }

    /**
     * Check the selected answer against the correct answer.
     * @param {number} selectedAnswer - The number chosen by the user.
     * @param {HTMLElement} buttonElement - The button element clicked.
     */
    checkAnswer(selectedAnswer, buttonElement) {
        this.isProcessingAnswer = true; // Prevent further input
        this.optionButtons.forEach(btn => btn.disabled = true); // Disable all buttons temporarily

        if (selectedAnswer === this.correctAnswer) {
            this.messageDisplay.textContent = "Correct!";
            buttonElement.style.backgroundColor = 'lightgreen'; // Visual feedback: Correct
            this.level++;
            // Proceed to next level after a short delay
            setTimeout(() => {
                 this.startGame(); // Setup next level
            }, 1000); // 1 second delay
        } else {
            this.messageDisplay.textContent = `Incorrect! The answer was ${this.correctAnswer}.`;
            buttonElement.style.backgroundColor = 'salmon'; // Visual feedback: Incorrect

             // Highlight the correct button
            this.optionButtons.forEach((btn, index) => {
                if (this.options[index] === this.correctAnswer) {
                     btn.style.backgroundColor = 'lightgreen';
                }
            });

            // Reset to same level or end game (Here, just retry level after delay)
             setTimeout(() => {
                 // For now, let's just restart the same level on incorrect
                 // this.level = 1; // Option: Reset to level 1
                 this.startGame(); // Regenerate the same level difficulty or next level
            }, 2000); // Longer delay for incorrect
        }
    }

    /**
     * Handle window resize events to keep the canvas responsive.
     */
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // Update pixel ratio if needed
    }

    /**
     * The main animation loop using requestAnimationFrame.
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Optional: Add subtle rotation or other animations here if desired
        // this.cubeGroup.rotation.y += 0.002; // Example: Slow rotation

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new CubeCounterGame('game-container');
});
