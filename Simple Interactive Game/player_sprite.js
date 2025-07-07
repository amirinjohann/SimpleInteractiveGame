// Player sprite loader and renderer
// Usage: call loadPlayerSprite() once, then drawPlayerSprite(ctx, x, y, direction, frame)

const PLAYER_SPRITE_PATH = 'player_sprite.png';
const PLAYER_SPRITE_SIZE = 32; // Size of each frame (adjust if needed)
const PLAYER_SPRITE_FRAMES = 3; // Frames per direction
const PLAYER_SPRITE_DIRECTIONS = 4; // If your sheet has only 4 directions (down, left, right, up)

let playerSpriteImg = null;
let playerSpriteLoaded = false;

function loadPlayerSprite(callback) {
  playerSpriteImg = new Image();
  playerSpriteImg.src = PLAYER_SPRITE_PATH;
  playerSpriteImg.onload = () => {
    playerSpriteLoaded = true;
    if (callback) callback();
  };
}

/**
 * Draws the player sprite at the given position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - X position in pixels
 * @param {number} y - Y position in pixels
 * @param {number} direction - 0=down, 1=left, 2=right, 3=up, 4=down-left, 5=down-right, 6=up-left, 7=up-right
 * @param {number} frame - Animation frame (0, 1, 2)
 *
 * If your sprite sheet only has 4 directions, diagonals will use the closest cardinal direction.
 */
function drawPlayerSprite(ctx, x, y, direction = 0, frame = 1) {
  if (!playerSpriteLoaded) return;
  // Map 8 directions to 4 if needed
  let dir = direction;
  if (PLAYER_SPRITE_DIRECTIONS === 4) {
    // 0=down, 1=left, 2=right, 3=up
    // 4=down-left, 5=down-right, 6=up-left, 7=up-right
    if (direction === 4) dir = 1; // down-left -> left
    else if (direction === 5) dir = 2; // down-right -> right
    else if (direction === 6) dir = 3; // up-left -> up
    else if (direction === 7) dir = 3; // up-right -> up
  }
  ctx.drawImage(
    playerSpriteImg,
    frame * PLAYER_SPRITE_SIZE,
    dir * PLAYER_SPRITE_SIZE,
    PLAYER_SPRITE_SIZE,
    PLAYER_SPRITE_SIZE,
    x,
    y,
    PLAYER_SPRITE_SIZE,
    PLAYER_SPRITE_SIZE
  );
}

// Export for use in game.js
window.loadPlayerSprite = loadPlayerSprite;
window.drawPlayerSprite = drawPlayerSprite; 