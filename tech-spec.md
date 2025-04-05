Your task is to create a JavaScript game based on the user's specifications. The game must adhere to the following technical requirements:

**User Game Concept:**
Create a Tetris-like game using `three.js`. The core gameplay involves pieces falling onto a grid. Key differences from standard Tetris:
1.  **No Rotation:** Shapes cannot be rotated by the player.
2.  **Shape Selection:** The player is presented with 3 upcoming shapes simultaneously and must choose one to place on the game matrix. After placing one, the selection area refills or updates according to the game rules.
3.  **Placement:** The player controls the horizontal position and drops the chosen shape onto the game matrix.
4.  **Line Clearing:** Implement standard Tetris line clearing logic when a horizontal row is completely filled.
5.  **Goal:** Score points by clearing lines and survive as long as possible.

**Technical Requirements:**

1.  **MOBILE-FIRST DESIGN**
    *   Implement responsive design with mobile as the primary target.
    *   Ensure all game elements scale appropriately across devices.
    *   Design UI elements for touch interaction on small screens (e.g., selecting one of the three shapes, moving the selected shape horizontally, dropping the shape).
    *   Add appropriate device detection to optimize performance.

2.  **CROSS-PLATFORM COMPATIBILITY**
    *   Support desktop browsers with appropriate control schemes.
    *   Implement fallback controls for keyboard/mouse on desktop (e.g., keyboard arrows for movement/dropping, mouse click or number keys for shape selection).
    *   Ensure consistent gameplay experience across all platforms.

3.  **TOUCH CONTROLS FOR MOBILE**
    *   Implement touch controls optimized for mobile screens (e.g., tap to select shape, drag horizontally to position, swipe down or tap dedicated button to drop).
    *   Create intuitive gesture recognition for game interactions.
    *   Include visual feedback for touch interactions.
    *   Prevent default browser behaviors (like scrolling or zooming) that interfere with touch controls within the game area.

4.  **FILE STRUCTURE**
    *   Create an `index.html` entry point with the following structure:
        ```html
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
            <title>Tetris Clone</title>
            <style>
                body { margin: 0; overflow: hidden; background-color: #000; }
                #game-container { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
            </style>
            <!-- Vendor libraries -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script> <!-- Example CDN link, adjust version as needed -->
        </head>
        <body>
            <div id="game-container">
                <!-- Canvas for three.js will be added here by script -->
            </div>
            <script type="module" src="main.js"></script> <!-- Assuming main entry point is main.js -->
        </body>
        </html>
        ```
        *   Include proper HTML5 doctype and meta tags (including viewport for mobile responsiveness as shown).
        *   Add a dedicated placeholder in the body with `id="game-container"`.
        *   Include a comment section: `<!-- Vendor libraries -->`. (Note: `three.js` added here as an example, can be loaded differently).

5.  **DEPENDENCIES MANAGEMENT**
    *   Create a `dependencies.txt` file with the following format:
        ```
        # Global scope dependencies (e.g., loaded via <script> tag)
        three@0.160.0 # Example version, use specific version

        # Module dependencies (e.g., imported via ES6 import)
        # module some-module@1.2.3 # Add module dependencies if any
        ```
    *   List global scope dependencies as: `package@version`.
    *   List module dependencies as: `module package@version`.
    *   Each dependency on a separate line.
    *   Include only necessary dependencies with specific versions (Ensure `three.js` is listed with its version).

6.  **ASSET MANAGEMENT**
    *   Use vector-based graphics created directly in code for all game assets (e.g., the Tetris shapes, grid).
    *   Implement `three.js` (which uses Canvas/WebGL) for rendering the visual elements. Create shapes using `three.js` geometries and materials directly in code.
    *   Avoid external image files unless specifically requested by the user (none requested here).
    *   Optimize `three.js` scene and rendering for performance, especially on mobile.

7.  **GAME STRUCTURE**
    *   Implement a main game loop using `requestAnimationFrame` for proper timing mechanisms.
    *   Create separate modules (JavaScript files) for game logic (state, rules, scoring), rendering (`three.js` scene setup, updates), and input handling (touch, keyboard, mouse). Use ES6 modules.
    *   Use vanilla JavaScript (aside from the required `three.js` library) with modern practices (ES6+, classes, modules) and patterns.
    *   Implement proper state management for game progression (e.g., main menu, playing, game over).

8.  **PERFORMANCE OPTIMIZATION**
    *   Minimize direct DOM manipulations and reflows; rely on the `three.js` canvas rendering.
    *   Use `requestAnimationFrame` for smooth animations and game loop updates.
    *   Implement asset preloading if necessary (though assets are code-generated here, consider any complex initial setup).
    *   Add appropriate caching mechanisms if applicable (e.g., reusing geometries/materials in `three.js`).

Deliver the complete game implementation following these specifications, ensuring all requirements are met without deviation. Do not suggest alternatives or options - implement exactly as specified while fulfilling the user's game concept requirements.