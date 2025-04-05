Your task is to create a JavaScript game based on the user's specifications. The game must adhere to the following technical requirements:

**User Requirements:**
Build the Pokémon Red game with three.js.

**Technical Requirements:**

1.  **MOBILE-FIRST DESIGN**
    *   Implement responsive design with mobile as the primary target.
    *   Ensure all game elements scale appropriately across devices.
    *   Design UI elements for touch interaction on small screens.
    *   Add appropriate device detection to optimize performance.

2.  **CROSS-PLATFORM COMPATIBILITY**
    *   Support desktop browsers with appropriate control schemes.
    *   Implement fallback controls for keyboard/mouse on desktop.
    *   Ensure consistent gameplay experience across all platforms.

3.  **TOUCH CONTROLS FOR MOBILE**
    *   Implement touch controls optimized for mobile screens.
    *   Create intuitive gesture recognition for game interactions (e.g., virtual D-pad, A/B buttons).
    *   Include visual feedback for touch interactions.
    *   Prevent default browser behaviors that interfere with touch controls (e.g., scrolling, zooming).

4.  **FILE STRUCTURE**
    *   Create an `index.html` entry point with the following structure:
        *   Include proper HTML5 doctype and meta tags (`<!DOCTYPE html>`, `<meta charset="UTF-8">`).
        *   Add a dedicated placeholder in the body with `id="game-container"`.
        *   Include a comment section: `<!-- Vendor libraries -->`.
        *   Add viewport meta tag for mobile responsiveness: `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">`.
    *   Link necessary JavaScript and CSS files appropriately.

5.  **DEPENDENCIES MANAGEMENT**
    *   Create a `dependencies.txt` file with the following format:
        *   List global scope dependencies as: `package@version`
        *   List module dependencies as: `module package@version`
        *   Each dependency on a separate line.
        *   Include only necessary dependencies with specific versions (e.g., `three@<specific_version>`).

6.  **ASSET MANAGEMENT**
    *   Use vector-based graphics created directly in code for all game assets where feasible within the context of three.js and the Pokémon Red aesthetic.
    *   Implement SVG or Canvas-based graphics for UI elements if appropriate alongside the three.js rendering context.
    *   Avoid external image files unless specifically requested by the user or essential for the chosen implementation style (e.g., textures in three.js if vector approach is insufficient).
    *   Optimize vector graphics/3D models for performance.

7.  **GAME STRUCTURE**
    *   Implement a main game loop using `requestAnimationFrame` for rendering updates driven by three.js.
    *   Create separate modules/classes for game logic (world state, character movement, battle system), rendering (scene setup, updates via three.js), and input handling (touch/keyboard).
    *   Use vanilla JavaScript with modern practices (ES6+ features like classes, modules) alongside the `three.js` library.
    *   Implement proper state management for game progression (e.g., player location, encountered Pokémon, inventory).

8.  **PERFORMANCE OPTIMIZATION**
    *   Minimize DOM manipulations and reflows, focusing rendering within the `three.js` canvas.
    *   Use `requestAnimationFrame` for smooth animations and game loop.
    *   Implement asset preloading where necessary (e.g., 3D models, critical data).
    *   Add appropriate caching mechanisms for game assets if applicable.
    *   Optimize `three.js` scene complexity, draw calls, and resource usage.

Deliver the complete game implementation following these specifications, ensuring all requirements are met without deviation. Do not suggest alternatives or options – implement exactly as specified while fulfilling the user's game concept requirements (Pokémon Red with three.js). Focus on recreating core mechanics like map exploration, turn-based battles (simplified if necessary), and Pokémon encounters within the `three.js` environment.