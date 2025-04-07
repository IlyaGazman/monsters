            /**
 * Game Initialization and State Management
 */

// Ensure THREE is available globally via the included script tag
const THREE = window.THREE;

const GameState = {
    START_SCREEN: 'START_SCREEN',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
};

class CubeCounterGame {
    constructor(containerId = 'game-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id #${containerId} not found.`);
            return;
        }

        // Game State
        this.gameState = GameState.START_SCREEN;
        this.level = 1;
        this.correctAnswer = 0;
        this.options = [];
        this.isProcessingAnswer = false; // Prevent multiple clicks during feedback
        this.animatingCubes = false; // Flag for cube drop animation
        this.timer = 100; // Starting timer value
        this.timerInterval = null;
        this.score = 0;
        this.highScore = parseInt(this.getCookie('highScore') || '0', 10);

        // Camera rotation state
        this.cameraRotationAngle = 90; // Default rotation set to 90°
        this.angleDisplay = document.getElementById('angle-display');

        // Basic device check (presence of touch events)
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // UI Elements
        this.uiContainer = document.getElementById('ui-container');
        this.cameraControls = document.getElementById('camera-controls');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.playButton = document.getElementById('play-button');
        this.restartButton = document.getElementById('restart-button');
        this.startHighScoreDisplay = document.getElementById('start-high-score');
        this.gameOverHighScoreDisplay = document.getElementById('game-over-high-score');
        this.finalScoreDisplay = document.getElementById('final-score');

        this.levelDisplay = document.getElementById('level-display');
        this.messageDisplay = document.getElementById('message-display');
        this.optionButtons = document.querySelectorAll('.option-button');
        this.timerDisplay = document.getElementById('timer-display');
        this.scoreDisplay = document.getElementById('score-display');

        this.initThree();
        this.initUI();
        // Don't start game immediately, wait for play button
        this.updateAngleDisplay(); // Show initial angle
        this.showStartScreen(); // Show the start screen initially
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
        // Option Button Listeners
        this.optionButtons.forEach(button => {
            const eventType = this.isTouchDevice ? 'touchstart' : 'click';
            button.addEventListener(eventType, (e) => {
                if (this.isTouchDevice) e.preventDefault();
                if (this.isProcessingAnswer || this.animatingCubes || this.gameState !== GameState.PLAYING) return;

                const choiceIndex = parseInt(e.target.dataset.choice, 10);
                this.checkAnswer(this.options[choiceIndex], button);
            });
        });

        // Camera Rotation Button Listeners
        const rotateLeftBtn = document.getElementById('rotate-left');
        const rotateRightBtn = document.getElementById('rotate-right');
        rotateLeftBtn.addEventListener('click', () => this.rotateCamera(-15));
        rotateRightBtn.addEventListener('click', () => this.rotateCamera(15));
        if (this.isTouchDevice) {
            rotateLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.rotateCamera(-15); });
            rotateRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.rotateCamera(15); });
        }

        // Keyboard Rotation Listener
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== GameState.PLAYING) return;
            if (e.key === 'ArrowLeft') this.rotateCamera(-15);
            else if (e.key === 'ArrowRight') this.rotateCamera(15);
        });

        // Start and Restart Button Listeners
        this.playButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
    }

    /**
     * Show the Start Screen and hide other UI elements.
     */
    showStartScreen() {
        this.gameState = GameState.START_SCREEN;
        this.startHighScoreDisplay.textContent = `High Score: ${this.highScore}`;
        this.startScreen.classList.add('visible');
        this.gameOverScreen.classList.remove('visible');
        this.uiContainer.classList.remove('visible');
        this.cameraControls.classList.remove('visible');
        this.angleDisplay.classList.remove('visible');
        this.clearCubes(); // Clear any leftover cubes
    }

    /**
     * Show the Game Over Screen.
     */
    showGameOverScreen() {
        this.gameState = GameState.GAME_OVER;
        clearInterval(this.timerInterval); // Stop timer if running

        // Update high score if current score is higher
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.setCookie('highScore', this.highScore);
        }

        this.finalScoreDisplay.textContent = `Your Score: ${this.score}`;
        this.gameOverHighScoreDisplay.textContent = `High Score: ${this.highScore}`;
        this.gameOverScreen.classList.add('visible');
        this.startScreen.classList.remove('visible');
        this.uiContainer.classList.remove('visible');
        this.cameraControls.classList.remove('visible');
        this.angleDisplay.classList.remove('visible');
    }

    /**
     * Hide overlays and show the main game UI.
     */
    showGameUI() {
        this.startScreen.classList.remove('visible');
        this.gameOverScreen.classList.remove('visible');
        this.uiContainer.classList.add('visible');
        this.cameraControls.classList.add('visible');
        this.angleDisplay.classList.add('visible');
    }

    /**
     * Set cookie for persistent storage
     */
    setCookie(name, value, days = 365) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${d.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    }

    /**
     * Get cookie value by name
     */
    getCookie(name) {
        const cookieName = `${name}=`;
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return "";
    }

    /**
     * Start the timer for the current question
     */
    startTimer() {
        this.timer = 100;
        this.updateTimerDisplay();

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateTimerDisplay();

            if (this.timer <= 0) {
                this.handleTimeUp();
            }
        }, 100); // 100ms interval for countdown from 100 to 0 in 10 seconds
    }

    /**
     * Update the timer display
     */
    updateTimerDisplay() {
        this.timerDisplay.textContent = `Time: ${this.timer}`;
        this.timerDisplay.style.color = this.timer <= 20 ? 'red' : (this.timer <= 50 ? 'orange' : '');
    }

    /**
     * Handle when time is up - Game Over
     */
    handleTimeUp() {
        clearInterval(this.timerInterval);
        this.messageDisplay.textContent = `Time's up! The answer was ${this.correctAnswer}.`;
        this.isProcessingAnswer = true; // Prevent clicks during brief display
        this.optionButtons.forEach(btn => btn.disabled = true); // Disable buttons

        // Highlight correct answer briefly before game over
        this.optionButtons.forEach((btn, index) => {
            if (this.options[index] === this.correctAnswer) {
                btn.style.backgroundColor = 'lightgreen';
            }
        });

        setTimeout(() => {
            this.showGameOverScreen();
        }, 1500); // Show Game Over screen after delay
    }

    /**
     * Rotate the camera by the specified angle in degrees.
     * @param {number} angleDelta - The angle to rotate in degrees.
     */
    rotateCamera(angleDelta) {
        if (this.gameState !== GameState.PLAYING) return; // Only rotate while playing
        this.cameraRotationAngle = (this.cameraRotationAngle + angleDelta) % 360;
        const angleRadians = (this.cameraRotationAngle * Math.PI) / 180;
        this.cubeGroup.rotation.y = angleRadians;
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
        // Reset game state if starting from scratch (not next level)
        if (this.gameState !== GameState.PLAYING) {
            this.level = 1;
            this.score = 0;
            // High score is already loaded/updated
        }

        this.gameState = GameState.PLAYING;
        this.isProcessingAnswer = false;
        this.showGameUI(); // Make sure game UI is visible
        this.generateLevel();

        // Adjust camera based on level
        let zoomFactor = 1 + 0.1 * (this.level - 1);
        let newCamPos = this.cameraBasePosition.clone().multiplyScalar(zoomFactor);
        newCamPos.y -= (this.level - 1) * 0.3;
        this.camera.position.copy(newCamPos);
        this.camera.lookAt(0, 0.5, 0);

        this.renderCubes();
        this.updateUI();
        this.startTimer();
    }

    /**
     * Generate parameters for the current level.
     * (Logic remains the same as provided)
     */
    generateLevel() {
        const L = this.level;
        const minCubes = Math.max(1, Math.ceil(L / 3));
        this.correctAnswer = Math.floor(Math.random() * (L - minCubes + 1)) + minCubes;

        if (this.correctAnswer < 6) {
            this.pileCounts = { '00': this.correctAnswer, '01': 0, '10': 0 };
            this.options = this.generateOptions(this.correctAnswer);
            return;
        }

        const min = Math.ceil(this.correctAnswer / 6);
        const max = Math.floor(this.correctAnswer * 2 / 3);
        let p00, p01, p10;

        const maxForP00 = max - min;
        if (min > maxForP00) {
            this.pileCounts = { '00': this.correctAnswer, '01': 0, '10': 0 };
            this.options = this.generateOptions(this.correctAnswer);
            return;
        }
        p00 = Math.floor(Math.random() * (maxForP00 - min + 1)) + min;

        const upperForP01 = max - p00;
        if (upperForP01 < min) {
            this.pileCounts = { '00': this.correctAnswer, '01': 0, '10': 0 };
            this.options = this.generateOptions(this.correctAnswer);
            return;
        }
        p01 = Math.floor(Math.random() * (upperForP01 - min + 1)) + min;
        p10 = this.correctAnswer - (p00 + p01);

        this.pileCounts = { '00': p00, '01': p01, '10': p10 };
        this.options = this.generateOptions(this.correctAnswer);
    }

    /**
     * Generates 4 sequential, positive integer options including the correct answer.
     * (Logic remains the same as provided)
     */
    generateOptions(correctAnswer) {
        const options = new Set();
        options.add(correctAnswer);
        let startValue = Math.max(1, correctAnswer - Math.floor(Math.random() * 3));

        for (let i = 0; options.size < 4; i++) {
             const potentialOption = startValue + i;
             if (potentialOption > 0) {
                 options.add(potentialOption);
             }
             if (i > 10) break; // Safety break
        }

        const optionsArray = Array.from(options);
        for (let i = optionsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
        }
        return optionsArray;
    }

    /**
     * Clears all cubes from the scene.
     */
    clearCubes() {
        while (this.cubeGroup.children.length > 0) {
            this.cubeGroup.remove(this.cubeGroup.children[0]);
        }
        this.cubesToAnimate = []; // Clear animation array
    }

    /**
     * Clears previous cubes and renders new ones based on pileCounts.
     * (Logic for cube creation and animation remains the same as provided)
     */
    renderCubes() {
        this.clearCubes(); // Clear previous cubes first

        const cubeSize = 0.8;
        const gap = 0.0;
        const pileSpacing = cubeSize;
        const outlineColor = 0x000000;
        const outlineThickness = 0.02;

        const materials = [
            [new THREE.MeshStandardMaterial({ color: 0xff0000 }), new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 2 })],
            [new THREE.MeshStandardMaterial({ color: 0x00ff00 }), new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 2 })],
            [new THREE.MeshStandardMaterial({ color: 0x0000ff }), new THREE.LineBasicMaterial({ color: outlineColor, linewidth: 2 })]
        ];

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const edgesGeometry = new THREE.EdgesGeometry(geometry);

        const createPile = (count, materials, offsetX, offsetZ) => {
            const [cubeMaterial, edgeMaterial] = materials;
            const pileCubes = [];
            for (let i = 0; i < count; i++) {
                const cube = new THREE.Mesh(geometry, cubeMaterial);
                const edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
                cube.add(edges);
                const finalY = (cubeSize / 2) + i * (cubeSize + gap);
                cube.position.set(offsetX, finalY + 10, offsetZ);
                cube.rotation.x = Math.random() * 0.1 - 0.05;
                cube.rotation.y = Math.random() * 0.1 - 0.05;
                cube.rotation.z = Math.random() * 0.1 - 0.05;
                cube.userData = {
                    finalY: finalY,
                    animationDelay: 100 * i,
                    animationStartTime: null,
                    animationDuration: 500,
                    isAnimating: true
                };
                this.cubeGroup.add(cube);
                pileCubes.push(cube);
            }
            return pileCubes;
        };

        this.animatingCubes = true;
        this.cubesToAnimate = [
            ...createPile(this.pileCounts['00'], materials[0], 0, 0),
            ...createPile(this.pileCounts['01'], materials[1], 0, -pileSpacing),
            ...createPile(this.pileCounts['10'], materials[2], pileSpacing, 0)
        ];
        this.animationStartTime = performance.now();

        const angleRadians = (this.cameraRotationAngle * Math.PI) / 180;
        this.cubeGroup.rotation.y = angleRadians;
        this.cubeGroup.position.set(-pileSpacing / 2, -1, pileSpacing / 2);
    }

    /**
     * Update UI text elements for the playing state.
     */
    updateUI() {
        this.levelDisplay.textContent = `Level: ${this.level}`;
        this.messageDisplay.textContent = "How many cubes in total?";
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        // High score display removed from here
        this.optionButtons.forEach((button, index) => {
            button.textContent = this.options[index];
            button.style.backgroundColor = ''; // Reset color
            button.disabled = false; // Enable button
        });
    }

    /**
     * Check the selected answer against the correct answer.
     * @param {number} selectedAnswer - The number chosen by the user.
     * @param {HTMLElement} buttonElement - The button element clicked.
     */
    checkAnswer(selectedAnswer, buttonElement) {
        this.isProcessingAnswer = true;
        this.optionButtons.forEach(btn => btn.disabled = true);
        clearInterval(this.timerInterval); // Stop timer

        if (selectedAnswer === this.correctAnswer) {
            // Correct Answer
            const roundScore = this.timer;
            this.score += roundScore;
            this.messageDisplay.textContent = `Correct! +${roundScore} points`;
            buttonElement.style.backgroundColor = 'lightgreen';
            this.level++;
            this.scoreDisplay.textContent = `Score: ${this.score}`;

            // Proceed to next level after a short delay
            setTimeout(() => {
                if (this.gameState === GameState.PLAYING) { // Check if game hasn't ended for other reasons
                    this.startGame(); // Setup next level
                }
            }, 1000);

        } else {
            // Incorrect Answer - Game Over
            this.messageDisplay.textContent = `Incorrect! The answer was ${this.correctAnswer}.`;
            buttonElement.style.backgroundColor = 'salmon';

            // Highlight the correct button briefly
            this.optionButtons.forEach((btn, index) => {
                if (this.options[index] === this.correctAnswer) {
                    btn.style.backgroundColor = 'lightgreen';
                }
            });

            // Show Game Over screen after delay
            setTimeout(() => {
                this.showGameOverScreen();
            }, 2000); // Longer delay for incorrect
        }
    }

    /**
     * Handle window resize events to keep the canvas responsive.
     */
    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    /**
     * The main animation loop using requestAnimationFrame.
     * (Logic remains the same as provided)
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const currentTime = performance.now();
        if (this.animatingCubes && this.cubesToAnimate) {
            let allAnimationsComplete = true;
            this.cubesToAnimate.forEach(cube => {
                if (cube.userData.isAnimating) {
                    if (cube.userData.animationStartTime === null) {
                        if (currentTime >= this.animationStartTime + cube.userData.animationDelay) {
                            cube.userData.animationStartTime = currentTime;
                        }
                    }
                    if (cube.userData.animationStartTime !== null) {
                        const elapsed = currentTime - cube.userData.animationStartTime;
                        const progress = Math.min(elapsed / cube.userData.animationDuration, 1);
                        const easedProgress = 1 - Math.pow(1 - progress, 3);
                        const startY = cube.userData.finalY + 10;
                        const targetY = cube.userData.finalY;
                        cube.position.y = startY - (startY - targetY) * easedProgress;

                        if (progress >= 1) {
                            cube.userData.isAnimating = false;
                            cube.position.y = targetY;
                        } else {
                            allAnimationsComplete = false;
                        }
                    } else {
                        allAnimationsComplete = false;
                    }
                }
            });
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
