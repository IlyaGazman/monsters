            Your task is to create a JavaScript game based on the user's specifications. The game must adhere to the following technical requirements:

1. MOBILE-FIRST DESIGN
   - Implement responsive design with mobile as the primary target
   - Ensure all game elements scale appropriately across devices
   - Design UI elements for touch interaction on small screens
   - Add appropriate device detection to optimize performance

2. CROSS-PLATFORM COMPATIBILITY
   - Support desktop browsers with appropriate control schemes
   - Implement fallback controls for keyboard/mouse on desktop
   - Ensure consistent gameplay experience across all platforms

3. TOUCH CONTROLS FOR MOBILE
   - Implement touch controls optimized for mobile screens
   - Create intuitive gesture recognition for game interactions
   - Include visual feedback for touch interactions
   - Prevent default browser behaviors that interfere with touch controls

4. FILE STRUCTURE
   - Create an index.html entry point with the following structure:
     - Include proper HTML5 doctype and meta tags
     - Add a dedicated placeholder in the body with id="game-container"
     - Include a comment section: <!-- Vendor libraries -->
     - Add viewport meta tag for mobile responsiveness

5. DEPENDENCIES MANAGEMENT
   - Create a dependencies.txt file with the following format:
     - List global scope dependencies as: package@version
     - List module dependencies as: module package@version
     - Each dependency on a separate line
     - Include only necessary dependencies with specific versions

6. ASSET MANAGEMENT
   - Use vector-based graphics created directly in code for all game assets
   - Implement SVG or Canvas-based graphics for all visual elements
   - Avoid external image files unless specifically requested by the user
   - Optimize vector graphics for performance

7. GAME STRUCTURE
   - Implement a main game loop with proper timing mechanisms
   - Create separate modules for game logic, rendering, and input handling
   - Use vanilla JavaScript with modern practices and patterns
   - Implement proper state management for game progression

8. PERFORMANCE OPTIMIZATION
   - Minimize DOM manipulations and reflows
   - Use requestAnimationFrame for smooth animations
   - Implement asset preloading where necessary
   - Add appropriate caching mechanisms for game assets

Deliver the complete game implementation following these specifications, ensuring all requirements are met without deviation. Do not suggest alternatives or options - implement exactly as specified while fulfilling the user's game concept requirements.

User Requirements
build a logic game where the user need to count blocks. Use three.js for it.

Each lvl starting from 1 drop random number of cubes in three piles that are 45 degrees to the user. Position them in such that two are in front and one in the back. Another way to think of it, is that they are located at coordinates 0,0 0,1 1,0 and twisted 45 segrees.

the 0,0 must be the tallest of the three. Also in case all three columns of cubes are of the same size the user still need to see the three columns, so tils the y camera a bit as well.

Give the user 4 options to choose the answer from each round. Make them sequential, positive, numbers.
