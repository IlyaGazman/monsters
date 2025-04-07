/**
 * Game Initialization and State Management
 */
 
// Ensure THREE is available globally via the included script tag
const THREE = window.THREE;

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

        // Camera rotation state
        this.cameraRotationAngle = 90; // Default rotation set to 90°
        this.angleDisplay = document.getElementById('angle-display');
        this.updateAngleDisplay();

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

        // Camera rotation controls
        const rotateLeftBtn = document.getElementById('rotate-left');
        const rotateRightBtn = document.getElementById('rotate-right');

        rotateLeftBtn.addEventListener('click', () => this.rotateCamera(-15));
        rotateRightBtn.addEventListener('click', () => this.rotateCamera(15));

        // Add touch events
        if (this.isTouchDevice) {
            rotateLeftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.rotateCamera(-15);
            });
            rotateRightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.rotateCamera(15);
            });
        }

        // Add keyboard controls for camera rotation
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.rotateCamera(-15);
            } else if (e.key === 'ArrowRight') {
                this.rotateCamera(15);
            }
        });
    }

    /**
     * Rotate the camera by the specified angle in degrees.
     * @param {number} angleDelta - The angle to rotate in degrees.
     */
    rotateCamera(angleDelta) {
        // Update the rotation angle
        this.cameraRotationAngle = (this.cameraRotationAngle + angleDelta) % 360;
        
        // Convert to radians for THREE.js
        const angleRadians = (this.cameraRotationAngle * Math.PI) / 180;
        
        // Update cube group rotation
        this.cubeGroup.rotation.y = angleRadians;
        
        // Update the angle display
        this.updateAngleDisplay();
    }

    /**
     * Update the angle display with the current rotation angle.
     */
    updateAngleDisplay() {
        this.angleDisplay.textContent = `Rotation: ${this.cameraRotationAngle}°`;
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
     * 
     * Modified Logic:
     * - The correct answer is a random integer between 1/3 * current level and the current level.
     * - The cubes are divided into three piles whose total sum equals the correct answer.
     * - For column 0,0: choose a random integer between ceil(correctAnswer/6) and floor(correctAnswer*2/3).
     * - For column 0,1: choose a random integer between ceil(correctAnswer/6) and (floor(correctAnswer*2/3) - p00).
     * - For column 1,0: assign the remaining cubes.
     * 
     * If the level is too small to allow this distribution (i.e., when constraints conflict),
     * all cubes are assigned to column 0,0.
     */
    generateLevel() {
        const L = this.level;
        
        // Generate a random number between 1/3 of level and the current level
        const minCubes = Math.max(1, Math.ceil(L / 3));
        this.correctAnswer = Math.floor(Math.random() * (L - minCubes + 1)) + minCubes;
        
        // For levels too small for a balanced random split
        if (this.correctAnswer < 6) {
            this.pileCounts = { '00': this.correctAnswer, '01': 0, '10': 0 };
            this.options = this.generateOptions(this.correctAnswer);
            return;
        }
        
        const min = Math.ceil(this.correctAnswer / 6);
        const max = Math.floor(this.correctAnswer * 2 / 3);
        let p00, p01, p10;
        
        // Ensure p00 is chosen so that there is room for p01:
        const maxForP00 = max - min; 
        if (min > maxForP00) {
            // Fallback when range is too narrow.
            this.pileCounts = { '00': this.correctAnswer, '01': 0, '10': 0 };
            this.options = this.generateOptions(this.correctAnswer);
            return;
        }
        // Randomly choose p00 between min and maxForP00 (inclusive)
        p00 = Math.floor(Math.random() * (maxForP00 - min + 1)) + min;
        
        // Upper bound for p01 is (max - p00); ensure that is at least min.
        const upperForP01 = max - p00;
        if (upperForP01 < min) {
            // If not possible, fallback to all cubes in pile "00"
            this.pileCounts = { '00': this.correctAnswer, '01': 0, '10': 0 };
            this.options = this.generateOptions(this.correctAnswer);
            return;
        }
        // Randomly choose p01 between min and upperForP01 (inclusive)
        p01 = Math.floor(Math.random() * (upperForP01 - min + 1)) + min;
        
        // Remaining cubes go to pile 1,0 (can be zero or more)
        p10 = this.correctAnswer - (p00 + p01);
        
        this.pileCounts = { '00': p00, '01': p01, '10': p10 };
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

        // Create all the cubes for animation.
        this.animatingCubes = true;
        this.cubesToAnimate = [
            ...createPile(this.pileCounts['00'], materials[0], 0, 0),                    // Pile 0,0 at origin
            ...createPile(this.pileCounts['01'], materials[1], 0, -pileSpacing),         // Pile 0,1 behind
            ...createPile(this.pileCounts['10'], materials[2], pileSpacing, 0)           // Pile 1,0 to the right
        ];

        // Start animation timers
        this.animationStartTime = performance.now();

        // Apply the current rotation angle to the cube group
        const angleRadians = (this.cameraRotationAngle * Math.PI) / 180;
        this.cubeGroup.rotation.y = angleRadians;

        // Center the group slightly to improve camera view and shift the cubes down.
        // The Y-offset here approximates moving the cubes 100 dp from the bottom.
        this.cubeGroup.position.set(-pileSpacing / 2, -1, pileSpacing / 2);
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
