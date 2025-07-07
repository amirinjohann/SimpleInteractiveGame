// Local woman sprite loader and renderer
// Usage: call loadLocalWomanSprite() once, then drawLocalWomanSprite(ctx, x, y, direction, frame)

const LOCAL_WOMAN_SPRITE_PATH = 'local_woman.jpg';
const LOCAL_WOMAN_SPRITE_SIZE = 32; // Adjust if needed
const LOCAL_WOMAN_SPRITE_FRAMES = 1; // Only 1 frame if static
const LOCAL_WOMAN_SPRITE_DIRECTIONS = 1; // Only 1 direction if static

let localWomanSpriteImg = null;
let localWomanSpriteLoaded = false;

function loadLocalWomanSprite(callback) {
  localWomanSpriteImg = new Image();
  localWomanSpriteImg.src = LOCAL_WOMAN_SPRITE_PATH;
  localWomanSpriteImg.onload = () => {
    localWomanSpriteLoaded = true;
    if (callback) callback();
  };
}

/**
 * Draws the local woman sprite at the given position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - X position in pixels
 * @param {number} y - Y position in pixels
 * @param {number} direction - ignored if only 1 direction
 * @param {number} frame - ignored if only 1 frame
 */
function drawLocalWomanSprite(ctx, x, y, direction = 0, frame = 0) {
  if (!localWomanSpriteLoaded) return;
  // Draw the whole image, scaled to 32x32 (or LOCAL_WOMAN_SPRITE_SIZE)
  ctx.drawImage(
    localWomanSpriteImg,
    0, 0, localWomanSpriteImg.width, localWomanSpriteImg.height, // source: full image
    x, y, LOCAL_WOMAN_SPRITE_SIZE, LOCAL_WOMAN_SPRITE_SIZE      // dest: scale to 32x32
  );
}

// Export for use in game.js
window.loadLocalWomanSprite = loadLocalWomanSprite;
window.drawLocalWomanSprite = drawLocalWomanSprite; 