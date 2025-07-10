// Strange man sprite loader and renderer
// Usage: call loadStrangeManSprite() once, then drawStrangeManSprite(ctx, x, y, direction, frame)

const STRANGE_MAN_SPRITE_PATH = 'strange_man.jpg';
const STRANGE_MAN_SPRITE_SIZE = 56; // Slightly smaller than before, between 48 and 64
const STRANGE_MAN_SPRITE_FRAMES = 1; // Only 1 frame if static
const STRANGE_MAN_SPRITE_DIRECTIONS = 1; // Only 1 direction if static

let strangeManSpriteImg = null;
let strangeManSpriteLoaded = false;

function loadStrangeManSprite(callback) {
  strangeManSpriteImg = new Image();
  strangeManSpriteImg.src = STRANGE_MAN_SPRITE_PATH;
  strangeManSpriteImg.onload = () => {
    strangeManSpriteLoaded = true;
    if (callback) callback();
  };
}

/**
 * Draws the strange man sprite at the given position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - X position in pixels
 * @param {number} y - Y position in pixels
 * @param {number} direction - ignored if only 1 direction
 * @param {number} frame - ignored if only 1 frame
 */
function drawStrangeManSprite(ctx, x, y, direction = 0, frame = 0) {
  if (!strangeManSpriteLoaded) return;
  // Draw the whole image, scaled to 32x32 (or STRANGE_MAN_SPRITE_SIZE)
  ctx.drawImage(
    strangeManSpriteImg,
    0, 0, strangeManSpriteImg.width, strangeManSpriteImg.height, // source: full image
    x, y, STRANGE_MAN_SPRITE_SIZE, STRANGE_MAN_SPRITE_SIZE      // dest: scale to 32x32
  );
}

// Export for use in game.js
window.loadStrangeManSprite = loadStrangeManSprite;
window.drawStrangeManSprite = drawStrangeManSprite; 