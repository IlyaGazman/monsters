import * as THREE from 'three';

// Constants for rendering
const BLOCK_SIZE = 1; // Size of one block in 3D space
const BLOCK_MARGIN = 0.05; // Margin between blocks
const EFFECTIVE_BLOCK_SIZE = BLOCK_SIZE + BLOCK_MARGIN;
const BOARD_COLOR = 0x333333;
const GRID_LINE_COLOR = 0x555555;

// Shape colors (adjust as needed)
const COLORS = [
    0xff0000, // Red
    0x00ff00, // Lime
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff, // Cyan
    0xffa500, // Orange
];

/**
 * Manages the Three.js rendering of the game.
 */
class Renderer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.boardGroup = new THREE.Group(); // Group for static board elements
        this.fallingPieceGroup = new THREE.Group(); // Group for the falling piece
        this.previewGroup = new THREE.Group(); // Group for preview shapes
        this.blockGeometry = null;
        this.blockMaterials = {}; // Cache materials by color hex
        this.gridWidth = 10; // Default, sync with Game logic
        this.gridHeight = 20; // Default, sync with Game logic
        this.previewAreaBounds = { x: 0, y: 0, width: 0, height: 0 }; // Screen coords for preview selection
    }

    /**
     * Initializes the Three.js scene, camera, and renderer.
     */
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        // Camera (Orthographic for 2D-like view)
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 25; // Adjust based on desired view scale
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,
            1000
        );
        // Position camera to view the board centered (adjust Y based on grid height)
        this.camera.position.set(
            (this.gridWidth * EFFECTIVE_BLOCK_SIZE) / 2 - EFFECTIVE_BLOCK_SIZE / 2,
            (this.gridHeight * EFFECTIVE_BLOCK_SIZE) / 2 - EFFECTIVE_BLOCK_SIZE / 2,
            10
        );
        this.camera.lookAt(this.scene.position); // Look towards origin initially, adjust later

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Reusable Block Geometry
        this.blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Add groups to scene
        this.scene.add(this.boardGroup);
        this.scene.add(this.fallingPieceGroup);
        this.scene.add(this.previewGroup);

        // Initial draw (e.g., grid)
        this.drawGrid();

        // Adjust camera view after knowing grid dimensions
        this.adjustCameraView();
    }

    /**
     * Creates or retrieves a cached material for a given color.
     * @param {number} colorHex - The hexadecimal color value.
     * @returns {THREE.Material} The material.
     */
    getMaterial(colorHex) {
        if (!this.blockMaterials[colorHex]) {
            this.blockMaterials[colorHex] = new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: 0.7,
                metalness: 0.1,
            });
        }
        return this.blockMaterials[colorHex];
    }

    /**
     * Creates a single block mesh.
     * @param {number} x - Grid x position.
     * @param {number} y - Grid y position.
     * @param {number} colorHex - The hexadecimal color value.
     * @returns {THREE.Mesh} The block mesh.
     */
    createBlockMesh(x, y, colorHex) {
        const material = this.getMaterial(colorHex);
        const mesh = new THREE.Mesh(this.blockGeometry, material);
        mesh.position.set(
            x * EFFECTIVE_BLOCK_SIZE,
            y * EFFECTIVE_BLOCK_SIZE,
            0
        );
        return mesh;
    }

    /**
     * Draws the grid lines and background.
     */
    drawGrid() {
        // Clear previous grid if any
        this.boardGroup.clear();

        // Optional: Add a background plane
        const boardWidth = this.gridWidth * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN;
        const boardHeight = this.gridHeight * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN;
        const planeGeometry = new THREE.PlaneGeometry(boardWidth, boardHeight);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: BOARD_COLOR, side: THREE.DoubleSide });
        const boardPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        // Center the plane visually behind the grid cells
        boardPlane.position.set(
             boardWidth / 2 - EFFECTIVE_BLOCK_SIZE / 2,
             boardHeight / 2 - EFFECTIVE_BLOCK_SIZE / 2,
             -BLOCK_SIZE / 2 // Place slightly behind blocks
        );
        this.boardGroup.add(boardPlane);

        // Grid Lines (optional, can make it look busy)
        const material = new THREE.LineBasicMaterial({ color: GRID_LINE_COLOR });
        // Vertical lines
        for (let i = 0; i <= this.gridWidth; i++) {
            const points = [];
            points.push(new THREE.Vector3(i * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN / 2, -BLOCK_MARGIN / 2, 0.1));
            points.push(new THREE.Vector3(i * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN / 2, this.gridHeight * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN / 2, 0.1));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.boardGroup.add(line);
        }
        // Horizontal lines
         for (let i = 0; i <= this.gridHeight; i++) {
             const points = [];
             points.push(new THREE.Vector3(-BLOCK_MARGIN / 2, i * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN / 2, 0.1));
             points.push(new THREE.Vector3(this.gridWidth * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN / 2, i * EFFECTIVE_BLOCK_SIZE - BLOCK_MARGIN / 2, 0.1));
             const geometry = new THREE.BufferGeometry().setFromPoints(points);
             const line = new THREE.Line(geometry, material);
             this.boardGroup.add(line);
         }
    }

     /**
     * Adjusts the camera to view the entire game area (board + preview).
     */
     adjustCameraView() {
        const boardWidth = this.gridWidth * EFFECTIVE_BLOCK_SIZE;
        const boardHeight = this.gridHeight * EFFECTIVE_BLOCK_SIZE;

        // Estimate extra space needed for preview (e.g., 5 blocks wide)
        const previewWidth = 6 * EFFECTIVE_BLOCK_SIZE;
        const totalWidth = boardWidth + previewWidth;
        const totalHeight = boardHeight; // Keep height based on board

        // Center the view on the combined area
        const centerX = (boardWidth / 2) + previewWidth / 4; // Shift center right slightly
        const centerY = boardHeight / 2;

        this.camera.position.set(centerX - EFFECTIVE_BLOCK_SIZE/2, centerY - EFFECTIVE_BLOCK_SIZE/2, 10); // Z far enough
        this.camera.lookAt(centerX - EFFECTIVE_BLOCK_SIZE/2, centerY - EFFECTIVE_BLOCK_SIZE/2, 0);

        // Adjust orthographic frustum size to fit everything
        const requiredFrustumHeight = totalHeight * 1.1; // Add some padding
        const requiredFrustumWidth = totalWidth * 1.1; // Add some padding

        const aspect = this.container.clientWidth / this.container.clientHeight;
        let frustumSize;

        // Determine limiting dimension
        if (requiredFrustumWidth / aspect >= requiredFrustumHeight) {
            // Width is the limiting factor
            frustumSize = requiredFrustumWidth / aspect;
        } else {
            // Height is the limiting factor
            frustumSize = requiredFrustumHeight;
        }

        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;

        this.camera.updateProjectionMatrix();
    }


    /**
     * Clears and redraws the blocks currently placed on the board.
     * @param {Array<Array<number>>} board - The game board state.
     */
    drawBoard(board) {
        // Efficiently update static blocks - only if board content changes significantly
        // For simplicity here, we clear and redraw. Optimization: Diff the board state.
        this.boardGroup.children = this.boardGroup.children.filter(child => !(child instanceof THREE.Mesh) || child.geometry instanceof THREE.PlaneGeometry ); // Keep non-block meshes (like grid/plane)

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x] > 0) { // Assuming 0 is empty, > 0 is color index + 1
                    const colorIndex = board[y][x] - 1;
                    const color = COLORS[colorIndex % COLORS.length];
                    const blockMesh = this.createBlockMesh(x, y, color);
                    this.boardGroup.add(blockMesh);
                }
            }
        }
    }

    /**
     * Draws the currently falling piece.
     * @param {object} piece - The piece definition (shape, colorIndex).
     * @param {object} position - The current {x, y} position of the piece's pivot on the grid.
     */
    drawFallingPiece(piece, position) {
        this.fallingPieceGroup.clear(); // Clear previous frame's falling piece

        if (!piece || !position) return;

        const color = COLORS[piece.colorIndex % COLORS.length];
        const shapeCoords = piece.shape; // Array of [dx, dy] relative to pivot

        shapeCoords.forEach(([dx, dy]) => {
            const blockMesh = this.createBlockMesh(position.x + dx, position.y + dy, color);
            this.fallingPieceGroup.add(blockMesh);
        });
    }

     /**
     * Draws the preview shapes.
     * @param {Array<object>} nextShapes - Array of the next shape objects.
     */
     drawPreview(nextShapes) {
        this.previewGroup.clear();

        // Define preview area position (e.g., to the right of the board)
        const previewStartX = this.gridWidth * EFFECTIVE_BLOCK_SIZE + 1 * EFFECTIVE_BLOCK_SIZE;
        const previewStartY = this.gridHeight * EFFECTIVE_BLOCK_SIZE - 3 * EFFECTIVE_BLOCK_SIZE; // Align top near board top
        const previewSpacingY = 5 * EFFECTIVE_BLOCK_SIZE; // Vertical spacing between previews

        // Store screen bounds for input detection
        const previewWorldPositions = [];


        nextShapes.forEach((piece, index) => {
            if (!piece) return;
            const color = COLORS[piece.colorIndex % COLORS.length];
            const shapeCoords = piece.shape;
            const group = new THREE.Group(); // Group for each preview shape

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

            shapeCoords.forEach(([dx, dy]) => {
                const blockMesh = this.createBlockMesh(dx, dy, color); // Use relative coords first
                group.add(blockMesh);
                 minX = Math.min(minX, dx);
                 maxX = Math.max(maxX, dx);
                 minY = Math.min(minY, dy);
                 maxY = Math.max(maxY, dy);
            });

            // Center the group within its preview slot
            const shapeWidth = (maxX - minX + 1) * EFFECTIVE_BLOCK_SIZE;
            const shapeHeight = (maxY - minY + 1) * EFFECTIVE_BLOCK_SIZE;
            group.position.set(
                previewStartX - minX * EFFECTIVE_BLOCK_SIZE, // Adjust based on minX
                previewStartY - index * previewSpacingY - minY * EFFECTIVE_BLOCK_SIZE, // Adjust based on minY
                0
            );

            this.previewGroup.add(group);

             // Calculate approx world bounds for this preview item for clicking later
             const previewItemCenterWorld = new THREE.Vector3(
                previewStartX + (shapeWidth / 2) - (EFFECTIVE_BLOCK_SIZE/2),
                previewStartY - index * previewSpacingY + (shapeHeight/2) - (EFFECTIVE_BLOCK_SIZE/2),
                0
             );
             previewWorldPositions.push({
                 center: previewItemCenterWorld,
                 width: shapeWidth + EFFECTIVE_BLOCK_SIZE, // Add padding
                 height: shapeHeight + EFFECTIVE_BLOCK_SIZE, // Add padding
                 index: index
             });

        });

        // Calculate screen coordinates for input manager (needs camera projection)
        this.updatePreviewAreaBounds(previewWorldPositions);
    }

     /**
      * Updates the screen-space bounds for the preview area click detection.
      * @param {Array<object>} worldPositions - Array of objects with center, width, height, index for each preview item in world space.
      */
    updatePreviewAreaBounds(worldPositions) {
        // If renderer/camera isn't ready, skip
        if (!this.renderer || !this.camera || !this.renderer.domElement) {
            this.previewAreaBounds = []; // Reset
            return;
        }

        const canvas = this.renderer.domElement;
        const canvasRect = canvas.getBoundingClientRect(); // Get canvas position and size relative to viewport

        this.previewAreaBounds = worldPositions.map(item => {
            // Project world center to Normalized Device Coordinates (NDC)
            const centerNDC = item.center.clone().project(this.camera);

            // Convert NDC (-1 to +1) to screen coordinates (pixels)
            const screenX = ((centerNDC.x + 1) / 2) * canvas.width + canvasRect.left;
            const screenY = ((-centerNDC.y + 1) / 2) * canvas.height + canvasRect.top;

            // Estimate screen width/height (this is approximate, perspective distorts size)
            // For orthographic, we can project corner points or use a scale factor.
            // Let's approximate based on world size and camera zoom/frustum.
            // Project two points representing width/height in world space to screen space
             const p1 = item.center.clone().add(new THREE.Vector3(-item.width/2, 0, 0)).project(this.camera);
             const p2 = item.center.clone().add(new THREE.Vector3(item.width/2, 0, 0)).project(this.camera);
             const p3 = item.center.clone().add(new THREE.Vector3(0, -item.height/2, 0)).project(this.camera);
             const p4 = item.center.clone().add(new THREE.Vector3(0, item.height/2, 0)).project(this.camera);

             const screenP1X = ((p1.x + 1) / 2) * canvas.width;
             const screenP2X = ((p2.x + 1) / 2) * canvas.width;
             const screenP3Y = ((-p3.y + 1) / 2) * canvas.height;
             const screenP4Y = ((-p4.y + 1) / 2) * canvas.height;

             const screenWidth = Math.abs(screenP2X - screenP1X);
             const screenHeight = Math.abs(screenP4Y - screenP3Y);


            return {
                index: item.index,
                x: screenX - screenWidth / 2,
                y: screenY - screenHeight / 2,
                width: screenWidth,
                height: screenHeight,
            };
        });
        // console.log("Updated Preview Bounds:", this.previewAreaBounds);
    }


    /**
     * Renders the scene.
     * @param {object} gameState - The current state of the game (board, fallingPiece, position, nextShapes).
     */
    render(gameState) {
        if (!this.renderer || !this.scene || !this.camera) return;

        // Update dynamic elements based on game state
        this.drawBoard(gameState.board); // Update placed blocks
        this.drawFallingPiece(gameState.currentPiece, gameState.currentPosition); // Update falling piece
        this.drawPreview(gameState.nextShapes); // Update preview shapes

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handles window resize. Updates renderer size and camera aspect ratio.
     */
    updateSize() {
        if (!this.renderer || !this.camera) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.renderer.setSize(width, height);

        const aspect = width / height;
        // Adjust camera frustum based on new aspect ratio
        // Keep the vertical frustum size constant, adjust horizontal
        this.camera.left = this.camera.bottom * aspect;
        this.camera.right = this.camera.top * aspect;

        // Re-adjust camera view/zoom to ensure everything fits
        this.adjustCameraView();

        this.camera.updateProjectionMatrix();
        // Re-calculate preview bounds after resize
         this.updatePreviewAreaBounds( this.previewAreaBounds.map(b => ({ // Use existing indices and find corresponding world positions if possible
             // This might need recalculating world positions based on layout logic
             // For now, trigger re-render which calls drawPreview -> updatePreviewAreaBounds
             index: b.index,
             // placeholder world pos, will be updated in next render cycle
             center: new THREE.Vector3(), width:0, height:0
         })));
    }

    /**
     * Returns the current configuration of the grid for game logic.
     */
    getGridConfig() {
        return {
            width: this.gridWidth,
            height: this.gridHeight,
        };
    }

     /**
     * Provides the screen bounds of the preview shapes for input handling.
     * @returns {Array<object>} Array of {index, x, y, width, height} for each preview slot.
     */
     getPreviewAreaBounds() {
         return this.previewAreaBounds;
     }

     /**
      * Gets the main camera object.
      * @returns {THREE.Camera} The main camera.
      */
     getCamera() {
         return this.camera;
     }
}

export default Renderer;
