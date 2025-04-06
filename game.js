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
        this.animatingCubes = false; // Flag for cube drop animation

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
        // Save a base camera position to adjust zoom each level
        this.cameraBasePosition = new THREE.Vector3(5, 4, 5);
        this.camera.position.copy(this.cameraBasePosition);
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
                if (this.isProcessingAnswer || this.animatingCubes) return; // Ignore clicks if processing

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
        
        // Adjust camera to zoom out a little and shift to show bottom cubes.
        // The higher the level, the further the camera steps back.
        let zoomFactor = 1 + 0.1 * (this.level - 1); // Increase distance by 10% per level
        let newCamPos = this.cameraBasePosition.clone().multiplyScalar(zoomFactor);
        // Lower the camera slightly to show more of the bottom of the piles.
        newCamPos.y -= (this.level - 1) * 0.3;
        this.camera.position.copy(newCamPos);
        this.camera.lookAt(0, 0.5, 0);

        this.renderCubes();
        this.updateUI();
    }

    /**
     * Generate parameters for the current level.
     */
    generateLevel() {
        // Cube count limit for current level (max number of cubes = level number)
        const maxCubesForLevel = this.level;
        
        // Generate random cube distributions for three piles,
        // but ensure the total doesn't exceed the level number
        let totalCubes = 0;
        let pile00Count = 0;
        let pile01Count = 0;
        let pile10Count = 0;

        // If level is 1, we must have exactly 1 cube total
        if (this.level === 1) {
            // Place the single cube randomly in one of the piles
            const randomPile = Math.floor(Math.random() * 3);
            if (randomPile === 0) pile00Count = 1;
            else if (randomPile === 1) pile01Count = 1;
            else pile10Count = 1;
            totalCubes = 1;
        } else {
            // For levels 2+, distribute cubes randomly but ensure total <= level number
            // We need at least one cube
            pile00Count = Math.ceil(Math.random() * Math.min(this.level, 3));
            totalCubes = pile00Count;
            
            // Add to other piles if we haven't reached the max for the level
            if (totalCubes < maxCubesForLevel) {
                pile01Count = Math.floor(Math.random() * (maxCubesForLevel - totalCubes + 1));
                totalCubes += pile01Count;
            }
            
            if (totalCubes < maxCubesForLevel) {
                pile10Count = Math.min(maxCubesForLevel - totalCubes, Math.floor(Math.random() * 3) + 1);
                totalCubes += pile10Count;
            }
        }

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
        const gap = 0.0; // No gap between cubes in a column
        // Set pileSpacing equal to cubeSize for adjacent columns with no gap.
        const pileSpacing = cubeSize;

        // Create materials with outlines for better visibility
        const outlineColor = 0x000000; // Black outline
        const outlineThickness = 0.02; // Outline thickness
        
        // Define materials for each pile (with outline effect)
        const materials = [
            [
                new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Red for pile 0,0
                new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 2 })
            ],
            [
                new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // Green for pile 0,1
                new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 2 })
            ],
            [
                new THREE.MeshStandardMaterial({ color: 0x0000ff }), // Blue for pile 1,0
                new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 2 })
            ]
        ];

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const edgesGeometry = new THREE.EdgesGeometry(geometry); // For outline

        // Function to create a single pile with animation
        const createPile = (count, materials, offsetX, offsetZ) => {
            const [cubeMaterial, edgeMaterial] = materials;
            const pileCubes = [];
            
            for (let i = 0; i < count; i++) {
                // Create cube with outline
                const cube = new THREE.Mesh(geometry, cubeMaterial);
                const edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
                cube.add(edges); // Add outline to cube
                
                // Starting position (high above final position for animation)
                const finalY = (cubeSize / 2) + i * (cubeSize + gap); // Final stacked position with no gap
                cube.position.set(
                    offsetX,
                    finalY + 10, // Start higher for drop animation
                    offsetZ
                );
                
                // Add slight random rotation for visual interest
                cube.rotation.x = Math.random() * 0.1 - 0.05;
                cube.rotation.y = Math.random() * 0.1 - 0.05;
                cube.rotation.z = Math.random() * 0.1 - 0.05;
                
                // Animation properties
                cube.userData = {
                    finalY: finalY,
                    animationDelay: 100 * i, // Stagger animation
                    animationStartTime: null,
                    animationDuration: 500, // 500ms animation (half second)
                    isAnimating: true
                };
                
                this.cubeGroup.add(cube);
                pileCubes.push(cube);
            }
            
            return pileCubes;
        };

        // Create all the cubes for animation
        this.animatingCubes = true;
        this.cubesToAnimate = [
            ...createPile(this.pileCounts['00'], materials[0], 0, 0),                    // Pile 0,0 at origin
            ...createPile(this.pileCounts['01'], materials[1], 0, -pileSpacing),         // Pile 0,1 behind
            ...createPile(this.pileCounts['10'], materials[2], pileSpacing, 0)           // Pile 1,0 to the right
        ];

        // Start animation timers
        this.animationStartTime = performance.now();

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

        // Animate cubes dropping
        const currentTime = performance.now();
        
        if (this.animatingCubes && this.cubesToAnimate) {
            let allAnimationsComplete = true;
            
            this.cubesToAnimate.forEach(cube => {
                if (cube.userData.isAnimating) {
                    // Start the animation if not already started
                    if (cube.userData.animationStartTime === null) {
                        if (currentTime >= this.animationStartTime + cube.userData.animationDelay) {
                            cube.userData.animationStartTime = currentTime;
                        }
                    }
                    
                    // Continue animation if it has started
                    if (cube.userData.animationStartTime !== null) {
                        const elapsed = currentTime - cube.userData.animationStartTime;
                        const progress = Math.min(elapsed / cube.userData.animationDuration, 1);
                        
                        // Easing function for smoother animation (ease-out)
                        const easedProgress = 1 - Math.pow(1 - progress, 3);
                        
                        // Update position
                        const startY = cube.userData.finalY + 10;
                        const targetY = cube.userData.finalY;
                        cube.position.y = startY - (startY - targetY) * easedProgress;
                        
                        // Animation complete
                        if (progress >= 1) {
                            cube.userData.isAnimating = false;
                            cube.position.y = targetY; // Ensure exact final position
                        } else {
                            allAnimationsComplete = false;
                        }
                    } else {
                        allAnimationsComplete = false;
                    }
                }
            });
            
            // All animations complete
            if (allAnimationsComplete) {
                this.animatingCubes = false;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new CubeCounterGame('game-container');
});
