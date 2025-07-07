const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load the player sprite image
loadPlayerSprite();
// Load the local woman sprite image
loadLocalWomanSprite();
// Load the strange man sprite image
loadStrangeManSprite();

// Tile size for pixel look
const TILE = 16;

// Room size
const room = { w: 80, h: 60 };

// Path/lake variables (define before player/NPC)
const PATH_WIDTH = 5;
const pathY = Math.floor(room.h / 2);
const pathBendX = Math.floor(room.w / 3);
const pathBottomY = room.h - 8;
const LAKE_CX = room.w - 16; // center x
const LAKE_CY = Math.floor(room.h / 2); // center y
const LAKE_RX = 10; // radius x
const LAKE_RY = 8; // radius y
const pathEndX = LAKE_CX - LAKE_RX - 2;

// Tile types
const TILE_TYPES = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  SHORE: 3,
  TREE: 4
};

// Dialogue system
let inDialogue = false;
let dialogueIndex = 0;
let selectedOption = 0;

// Scene state
let currentScene = 'forest'; // 'forest', 'deeperForest', 'abandonedTemple', 'seaShore', 'cave', 'abandonedHouse', 'cliff'

// Dialogue options for scene choice
const dialogues = [
  {
    text: "STRANGE MAN: You're finally awake. You've been expected.\n\n\"He turns into the woods without another word.\"\n\nSTRANGE MAN: Follow me... or don't. But there's no turning back.",
    options: [
      { text: "Follow The Strange Man", next: 1 },
      { text: "Refuse and walk the other way", next: 2 }
    ]
  },
  {
    text: "You agreed to follow the strange man",
    options: [ { text: "Continue", next: -10 } ] // -10: deeper forest intro done
  },
  {
    text: "Your gut is telling you to go the other way.",
    options: [ { text: "Continue", next: -2 } ]
  },
  {
    text: "You've begin to feel lost...Then, you saw a crooked sign, shows the direction to, Sea shore, Cave and Abandoned House. Where do you want to go?",
    options: [
      { text: "Sea Shore", next: -3 },
      { text: "Cave", next: -4 },
      { text: "Abandoned House", next: -5 }
    ]
  },
  // Deeper forest NPC dialogue (simplified)
  {
    text: "Are you ready?",
    options: [ { text: "Ready??", next: -11 } ] // -11: go to cliff
  },
  // Sea shore timed event (statement, no options)
  {
    text: "Waves crash violently. You hear shouting and turn to see shadows in the mist — pirates.\nBefore you can react, you're surrounded, bound, and thrown onto a rusted ship.",
    options: []
  },
  // Cave timed event (statement, no options)
  {
    text: "You descend into a narrow cove lit by phosphorescent moss. Whispering echoes in your mind.\nYour vision blurs. Time folds. You forget your hands.\nYou lose your mind.",
    options: []
  },
  // Abandoned house timed event PART 1
  {
    text: "The wooden floor creaks under your feet the minute you stepped in. Then you heard a footsteps approaching.",
    options: []
  },
  // Abandoned house timed event PART 2
  {
    text: "LOCAL WOMAN: Poor soul. You're safe now.\n\nShe wraps you in a warm blanket.",
    options: []
  },
  // Cliff scene NPC interaction
  {
    text: "He leads you to a high cliff edge. At this point you feel like you have made the wrong choice but its to late.\n The Stange man said 'Freedom lies in the fall. Jump!' ",
    options: [
      { text: "Run", next: 10 },
      { text: "Fight", next: 11 },
      { text: "Obey", next: 12 }
    ]
  },
  // Cliff option responses - all lead to being pushed off
  {
    text: "STRANGE MAN: Wrong choice!. You begin to run faster but he's faster...... He throw you down the cliff.",
    options: [ { text: "Continue", next: -13 } ]
  },
  {
    text: "You swing at him wildly. The man hisses and vanishes in a puff of smoke.\n You fall back, gasping — free.",
    options: [ { text: "Continue", next: -13 } ]
  },
  {
    text: "For some reason you've accept you fate. You close your eyes and step forward.\n\n Suddenly, you wake up — same forest, same moss, same time. STRANGE MAN: You're finally awake.......",
    options: [ { text: "Continue", next: -13 } ]
  }
];

// --- Scene Data ---
const scenes = {
  forest: {},
  deeperForest: {},
  abandonedTemple: {},
  seaShore: {},
  cave: {},
  abandonedHouse: {},
  cliff: {}
};

// Typewriter effect state for statement dialogue
let typewriterText = '';
let typewriterIndex = 0;
let typewriterTimer = null;
let typewriterDone = false;

function startTypewriterEffect(fullText) {
  typewriterText = '';
  typewriterIndex = 0;
  typewriterDone = false;
  if (typewriterTimer) clearInterval(typewriterTimer);
  typewriterTimer = setInterval(() => {
    typewriterIndex++;
    if (typewriterIndex >= fullText.length) {
      typewriterIndex = fullText.length;
      typewriterDone = true;
      clearInterval(typewriterTimer);
    }
    typewriterText = fullText.slice(0, typewriterIndex);
  }, 18); // ~55 chars/sec, similar to Undertale
}

function generateForestScene() {
  // Shared room size and tile types
  const room = { w: 80, h: 60 };
  const PATH_WIDTH = 5;
  const pathY = Math.floor(room.h / 2);
  const pathBendX = Math.floor(room.w / 3);
  const pathBottomY = room.h - 8;
  const LAKE_CX = room.w - 16;
  const LAKE_CY = Math.floor(room.h / 2);
  const LAKE_RX = 10;
  const LAKE_RY = 8;
  const pathEndX = LAKE_CX - LAKE_RX - 2;
  // Map
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  for (let y = 0; y < room.h; y++) {
    for (let x = 0; x < room.w; x++) {
      const dx = (x - LAKE_CX) / LAKE_RX;
      const dy = (y - LAKE_CY) / LAKE_RY;
      if (dx * dx + dy * dy <= 1) {
        map[y][x] = TILE_TYPES.WATER;
      }
    }
  }
  for (let y = 1; y < room.h - 1; y++) {
    for (let x = 1; x < room.w - 1; x++) {
      if (map[y][x] !== TILE_TYPES.WATER) {
        let adjWater = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (map[y + dy][x + dx] === TILE_TYPES.WATER) adjWater = true;
          }
        }
        if (adjWater) map[y][x] = TILE_TYPES.SHORE;
      }
    }
  }
  for (let x = 0; x <= pathBendX; x++) {
    for (let dy = -Math.floor(PATH_WIDTH/2); dy <= Math.floor(PATH_WIDTH/2); dy++) {
      const py = pathY + dy;
      if (py >= 0 && py < room.h) map[py][x] = TILE_TYPES.PATH;
    }
  }
  for (let y = pathY; y <= pathBottomY; y++) {
    for (let dx = -Math.floor(PATH_WIDTH/2); dx <= Math.floor(PATH_WIDTH/2); dx++) {
      const px = pathBendX + dx;
      if (px >= 0 && px < room.w) map[y][px] = TILE_TYPES.PATH;
    }
  }
  for (let x = pathBendX; x <= pathEndX; x++) {
    for (let dy = -Math.floor(PATH_WIDTH/2); dy <= Math.floor(PATH_WIDTH/2); dy++) {
      const py = pathBottomY + dy;
      if (py >= 0 && py < room.h) map[py][x] = TILE_TYPES.PATH;
    }
  }
  const player = { x: 2, y: pathY - 1, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  const npc = { x: pathEndX, y: pathBottomY - 1, color: '#fa4', w: 2, h: 2 };
  // Trees
  const demoTrees = [];
  const TREE_GRID_X = 12, TREE_GRID_Y = 10;
  const TREE_SPACING_X = 6, TREE_SPACING_Y = 5;
  const TREE_JITTER_X = 3, TREE_JITTER_Y = 2;
  for (let gx = 0; gx < TREE_GRID_X; gx++) {
    for (let gy = 0; gy < TREE_GRID_Y; gy++) {
      let tx = 2 + gx * TREE_SPACING_X + Math.floor((Math.random() - 0.5) * 2 * TREE_JITTER_X);
      let ty = 2 + gy * TREE_SPACING_Y + Math.floor((Math.random() - 0.5) * 2 * TREE_JITTER_Y);
      let valid = true;
      for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const lx = tx + dx;
          const ly = ty + dy;
          if (lx >= 0 && lx < room.w && ly >= 0 && ly < room.h) {
            if (
              map[ly][lx] === TILE_TYPES.PATH ||
              map[ly][lx] === TILE_TYPES.WATER ||
              map[ly][lx] === TILE_TYPES.SHORE
            ) {
              valid = false;
            }
          }
        }
      }
      if (valid) {
        const trunkX = tx + 18 / TILE;
        const trunkY = ty + 48 / TILE;
        const trunkW = 28 / TILE;
        const trunkH = 32 / TILE;
        for (const t of demoTrees) {
          const tTrunkX = t.x + 18 / TILE;
          const tTrunkY = t.y + 48 / TILE;
          const tTrunkW = 28 / TILE;
          const tTrunkH = 32 / TILE;
          if (
            trunkX < tTrunkX + tTrunkW && trunkX + trunkW > tTrunkX &&
            trunkY < tTrunkY + tTrunkH && trunkY + trunkH > tTrunkY
          ) {
            valid = false;
            break;
          }
        }
      }
      if (valid) demoTrees.push({ x: tx, y: ty });
    }
  }
  return { room, map, player, npc, demoTrees };
}

function generateDeeperForestScene() {
  // Similar to forest, but denser trees, no lake, winding path
  const room = { w: 80, h: 60 };
  const PATH_WIDTH = 3;
  const pathY = Math.floor(room.h / 2);
  const pathBendX = Math.floor(room.w / 2);
  const pathBottomY = room.h - 10;
  const pathEndX = room.w - 4;
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  // Winding path
  for (let x = 0; x <= pathBendX; x++) {
    for (let dy = -Math.floor(PATH_WIDTH/2); dy <= Math.floor(PATH_WIDTH/2); dy++) {
      const py = pathY + dy + Math.floor(Math.sin(x/8)*3);
      if (py >= 0 && py < room.h) map[py][x] = TILE_TYPES.PATH;
    }
  }
  for (let y = pathY; y <= pathBottomY; y++) {
    for (let dx = -Math.floor(PATH_WIDTH/2); dx <= Math.floor(PATH_WIDTH/2); dx++) {
      const px = pathBendX + dx;
      if (px >= 0 && px < room.w) map[y][px] = TILE_TYPES.PATH;
    }
  }
  for (let x = pathBendX; x <= pathEndX; x++) {
    for (let dy = -Math.floor(PATH_WIDTH/2); dy <= Math.floor(PATH_WIDTH/2); dy++) {
      const py = pathBottomY + dy;
      if (py >= 0 && py < room.h) map[py][x] = TILE_TYPES.PATH;
    }
  }
  const player = { x: 2, y: pathY - 1, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  const npc = { x: pathEndX, y: pathBottomY - 1, color: '#fa4', w: 2, h: 2 };
  // Denser trees
  const demoTrees = [];
  const TREE_GRID_X = 16, TREE_GRID_Y = 14;
  const TREE_SPACING_X = 5, TREE_SPACING_Y = 4;
  const TREE_JITTER_X = 2, TREE_JITTER_Y = 2;
  for (let gx = 0; gx < TREE_GRID_X; gx++) {
    for (let gy = 0; gy < TREE_GRID_Y; gy++) {
      let tx = 2 + gx * TREE_SPACING_X + Math.floor((Math.random() - 0.5) * 2 * TREE_JITTER_X);
      let ty = 2 + gy * TREE_SPACING_Y + Math.floor((Math.random() - 0.5) * 2 * TREE_JITTER_Y);
      let valid = true;
      for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const lx = tx + dx;
          const ly = ty + dy;
          if (lx >= 0 && lx < room.w && ly >= 0 && ly < room.h) {
            if (map[ly][lx] === TILE_TYPES.PATH) valid = false;
          }
        }
      }
      if (valid) demoTrees.push({ x: tx, y: ty });
    }
  }
  return { room, map, player, npc, demoTrees };
}

function generateAbandonedTempleScene() {
  // Temple in the center, less trees, stone path
  const room = { w: 80, h: 60 };
  const PATH_WIDTH = 4;
  const pathY = Math.floor(room.h / 2);
  const pathEndX = Math.floor(room.w / 2);
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  // Stone path to temple
  for (let x = 0; x <= pathEndX; x++) {
    for (let dy = -Math.floor(PATH_WIDTH/2); dy <= Math.floor(PATH_WIDTH/2); dy++) {
      const py = pathY + dy;
      if (py >= 0 && py < room.h) map[py][x] = TILE_TYPES.PATH;
    }
  }
  // Temple (rectangle of water as placeholder)
  const templeW = 12, templeH = 10;
  const templeX = Math.floor(room.w/2) - Math.floor(templeW/2);
  const templeY = Math.floor(room.h/2) - Math.floor(templeH/2);
  for (let y = 0; y < templeH; y++) {
    for (let x = 0; x < templeW; x++) {
      map[templeY + y][templeX + x] = TILE_TYPES.PATH; // Use PATH for concrete/stone
    }
  }
  const player = { x: 2, y: pathY - 1, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  // Place NPC off-screen for abandoned temple
  const npc = { x: -100, y: -100, color: '#fa4', w: 2, h: 2 };
  // Sparse trees
  const demoTrees = [];
  const TREE_GRID_X = 8, TREE_GRID_Y = 6;
  const TREE_SPACING_X = 10, TREE_SPACING_Y = 8;
  const TREE_JITTER_X = 3, TREE_JITTER_Y = 3;
  for (let gx = 0; gx < TREE_GRID_X; gx++) {
    for (let gy = 0; gy < TREE_GRID_Y; gy++) {
      let tx = 2 + gx * TREE_SPACING_X + Math.floor((Math.random() - 0.5) * 2 * TREE_JITTER_X);
      let ty = 2 + gy * TREE_SPACING_Y + Math.floor((Math.random() - 0.5) * 2 * TREE_JITTER_Y);
      let valid = true;
      for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const lx = tx + dx;
          const ly = ty + dy;
          if (lx >= 0 && lx < room.w && ly >= 0 && ly < room.h) {
            if (map[ly][lx] === TILE_TYPES.PATH || map[ly][lx] === TILE_TYPES.WATER) valid = false;
          }
        }
      }
      if (valid) demoTrees.push({ x: tx, y: ty });
    }
  }
  // Calculate sign position: in front of temple entrance
  const sign = { x: templeX - 2, y: pathY - 1, w: 2, h: 2 };
  return { room, map, player, npc, demoTrees, sign };
}

function generateSeaShoreScene() {
  // Beach with water at the bottom
  const room = { w: 80, h: 60 };
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = y > room.h - 12 ? TILE_TYPES.WATER : TILE_TYPES.GRASS;
    }
  }
  // Sand strip
  for (let y = room.h - 16; y < room.h - 12; y++) {
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.PATH;
    }
  }
  // Place player at the left side of the sand path
  const player = { x: 2, y: pathY - 1, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  // No NPC in sea shore scene
  const npc = { x: -100, y: -100, color: '#fa4', w: 2, h: 2 };
  // Palm trees
  const demoTrees = [];
  for (let i = 0; i < 8; i++) {
    demoTrees.push({ x: 5 + i * 9, y: room.h - 25 });
  }
  // Boat object (to the right, in the water)
  const boat = { x: room.w - 14, y: room.h - 10, w: 10, h: 4 };
  return { room, map, player, npc, demoTrees, boat };
}

function generateCaveScene() {
  // Dark cave, stone path, water pool
  const room = { w: 80, h: 60 };
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  // Stone path
  for (let y = 10; y < room.h - 10; y++) {
    for (let x = 36; x < 44; x++) {
      map[y][x] = TILE_TYPES.PATH;
    }
  }
  // Water pool
  for (let y = 40; y < 50; y++) {
    for (let x = 30; x < 50; x++) {
      map[y][x] = TILE_TYPES.WATER;
    }
  }
  const player = { x: 40, y: 12, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  // Place NPC off-screen for cave scene
  const npc = { x: -100, y: -100, color: '#fa4', w: 2, h: 2 };
  // Stalagmites (trees)
  const demoTrees = [];
  for (let i = 0; i < 10; i++) {
    demoTrees.push({ x: 20 + i * 5, y: 30 + (i % 2) * 5 });
  }
  return { room, map, player, npc, demoTrees };
}

function generateAbandonedHouseScene() {
  // Abandoned house in the center, dense trees around, clear path
  const room = { w: 80, h: 60 };
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  // Abandoned house layout
  const houseW = 18, houseH = 12;
  const houseX = Math.floor(room.w/2) - Math.floor(houseW/2);
  const houseY = Math.floor(room.h/2) - Math.floor(houseH/2);
  // Floor
  for (let y = 2; y < houseH-1; y++) {
    for (let x = 2; x < houseW-2; x++) {
      map[houseY + y][houseX + x] = TILE_TYPES.PATH;
    }
  }
  // Walls (SHORE)
  for (let x = 1; x < houseW-1; x++) {
    map[houseY + 1][houseX + x] = TILE_TYPES.SHORE; // top
    map[houseY + houseH-1][houseX + x] = TILE_TYPES.SHORE; // bottom
  }
  for (let y = 1; y < houseH; y++) {
    map[houseY + y][houseX + 1] = TILE_TYPES.SHORE; // left
    map[houseY + y][houseX + houseW-2] = TILE_TYPES.SHORE; // right
  }
  // Roof debris (TREE)
  for (let x = 3; x < houseW-3; x += 3) {
    map[houseY][houseX + x] = TILE_TYPES.TREE;
  }
  // Broken windows (WATER)
  map[houseY + 3][houseX + 2] = TILE_TYPES.WATER;
  map[houseY + 3][houseX + houseW-3] = TILE_TYPES.WATER;
  map[houseY + 7][houseX + 2] = TILE_TYPES.WATER;
  map[houseY + 7][houseX + houseW-3] = TILE_TYPES.WATER;
  // Door (leave gap in bottom wall)
  const doorX = houseX + Math.floor(houseW/2);
  const doorY = houseY + houseH-1;
  map[doorY][doorX] = TILE_TYPES.PATH;
  // Path from bottom to door (wide)
  for (let y = doorY; y < room.h; y++) {
    for (let dx = -2; dx <= 2; dx++) {
      const px = doorX + dx;
      if (px >= 0 && px < room.w) map[y][px] = TILE_TYPES.PATH;
    }
  }
  // Player just outside door
  const player = { x: doorX, y: doorY + 2, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  // NPC inside house
  const npc = { x: houseX + Math.floor(houseW/2), y: houseY + Math.floor(houseH/2), color: '#fa4', w: 2, h: 2 };
  // Dense trees around house and path, but not overlapping
  const demoTrees = [];
  for (let i = 0; i < 60; i++) {
    let tx = Math.floor(Math.random() * (room.w - 5));
    let ty = Math.floor(Math.random() * (room.h - 8));
    // Avoid house area
    if (
      tx + 5 > houseX - 2 && tx < houseX + houseW + 2 &&
      ty + 8 > houseY - 2 && ty < houseY + houseH + 2
    ) continue;
    // Avoid path area (vertical strip from bottom to door)
    if (
      tx + 5 > doorX - 4 && tx < doorX + 4 &&
      ty + 8 > doorY && ty < room.h
    ) continue;
    demoTrees.push({ x: tx, y: ty });
    if (demoTrees.length >= 40) break;
  }
  return { room, map, player, npc, demoTrees };
}

function generateCliffScene() {
  // Cliff at the top, path leading up, NPC at the edge
  const room = { w: 80, h: 60 };
  const map = [];
  for (let y = 0; y < room.h; y++) {
    map[y] = [];
    for (let x = 0; x < room.w; x++) {
      map[y][x] = TILE_TYPES.GRASS;
    }
  }
  // Cliff (water as placeholder) at the top
  for (let y = 0; y < 8; y++) {
    for (let x = 20; x < 60; x++) {
      map[y][x] = TILE_TYPES.WATER;
    }
  }
  // Path leading up
  for (let y = 8; y < room.h; y++) {
    for (let x = 38; x < 42; x++) {
      map[y][x] = TILE_TYPES.PATH;
    }
  }
  // Player starts at bottom of path
  const player = { x: 40, y: room.h - 4, color: '#4af', w: 2, h: 2, direction: 0, animFrame: 1, animTimer: 0, animMoving: false };
  // NPC at the top of the path, reachable
  const npc = { x: 40, y: 9, color: '#fa4', w: 2, h: 2 };
  // Sparse trees
  const demoTrees = [];
  for (let i = 0; i < 6; i++) {
    demoTrees.push({ x: 10 + i * 12, y: 20 + (i % 2) * 20 });
  }
  return { room, map, player, npc, demoTrees };
}

// Initialize all scenes
scenes.forest = generateForestScene();
scenes.deeperForest = generateDeeperForestScene();
scenes.abandonedTemple = generateAbandonedTempleScene();
scenes.seaShore = generateSeaShoreScene();
scenes.cave = generateCaveScene();
scenes.abandonedHouse = generateAbandonedHouseScene();
scenes.cliff = generateCliffScene();

// Input
const keys = {};
document.addEventListener('keydown', e => {
  // --- Ensure this is the first check ---
  if (gameState === 'userinfoPrompt') {
    gameState = 'userinfo';
    userName = '';
    userAge = '';
    userInfoStep = 0;
    userInfoError = '';
    e.preventDefault();
    return;
  }
  keys[e.key] = true;
  // Handle new ending screens for download/flowchart
  if (showCliffThrownFailed) {
    showCliffThrownFailed = false;
    showFlowchart = true;
    gameFlow.push('Cliff → Thrown Off → Mission Failed');
    e.preventDefault();
    return;
  }
  if (showFightWin) {
    showFightWin = false;
    showFlowchart = true;
    gameFlow.push('Cliff → Fight → Mission Complete');
    e.preventDefault();
    return;
  }
  if (showLoopFailed) {
    showLoopFailed = false;
    showFlowchart = true;
    gameFlow.push('Cliff → Loop → Mission Failed');
    e.preventDefault();
    return;
  }
  if (showFlowchart) {
    if (e.code === 'Enter') {
      // Download canvas as JPG
      const link = document.createElement('a');
      link.download = 'your_path.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      return;
    }
    if (e.code === 'Space') {
      showFlowchart = false;
      gameState = 'menu';
      gameEnded = false;
      gameFlow = [];
      showInsanityFailed = false;
      showSafeEnding = false;
      showCliffFailed = false;
      showCliffThrownFailed = false;
      showFightWin = false;
      showLoopFailed = false;
      currentScene = 'forest';
      dialogueIndex = 0;
      selectedOption = 0;
      // Reset player position in the forest scene
      if (scenes.forest && scenes.forest.player) {
        scenes.forest.player.x = 2;
        scenes.forest.player.y = Math.floor(scenes.forest.room.h / 2) - 1;
      }
      return;
    }
    return;
  }
  if (showInsanityFailed) {
    showFlowchart = true;
    gameFlow.push('Cave → Insanity');
    return;
  }
  if (showSafeEnding) {
    showFlowchart = true;
    gameFlow.push('Abandoned House → Safe');
    return;
  }
  if (showCliffFailed) {
    showFlowchart = true;
    gameFlow.push('Cliff → Pushed Off');
    return;
  }
  if (gameEnded) {
    showFlowchart = true;
    return;
  }
  if (gameState === 'userinfo') {
    userInfoError = '';
    if (userInfoStep === 0) {
      // Name input
      if (e.key.length === 1 && userName.length < 16 && /[a-zA-Z0-9 _-]/.test(e.key)) {
        userName += e.key;
      } else if (e.key === 'Backspace') {
        userName = userName.slice(0, -1);
      } else if (e.key === 'Enter' && userName.trim().length > 0) {
        userInfoStep = 1;
      }
    } else if (userInfoStep === 1) {
      // Age input
      if (e.key.length === 1 && /[0-9]/.test(e.key) && userAge.length < 3) {
        userAge += e.key;
      } else if (e.key === 'Backspace') {
        userAge = userAge.slice(0, -1);
      } else if (e.key === 'Enter' && userAge.length > 0) {
        const ageNum = parseInt(userAge, 10);
        if (isNaN(ageNum)) {
          userInfoError = 'Please enter a valid age.';
        } else {
          gameState = 'intro';
        }
      }
    }
    e.preventDefault();
    return;
  } else if (gameState === 'menu') {
    if (e.key === 'ArrowUp') {
      menuIndex = (menuIndex - 1 + menuOptions.length) % menuOptions.length;
    } else if (e.key === 'ArrowDown') {
      menuIndex = (menuIndex + 1) % menuOptions.length;
    } else if (e.key === 'Enter') {
      menuOptions[menuIndex].action();
    }
    e.preventDefault();
    return;
  } else if (gameState === 'howto' || gameState === 'about') {
    gameState = 'menu';
    e.preventDefault();
    return;
  } else if (gameState === 'intro') {
    if (introDone) {
      gameState = 'game';
    } else {
      // Fast-forward to end
      const totalHeight = introLines.length * 36;
      introScroll = (canvas.height / 2) - (totalHeight / 2) + 36;
    }
    e.preventDefault();
    return;
  }
  if (inDialogue) {
    // Handle typewriter effect advancement
    if (!typewriterDone) {
      if (e.key === 'Enter' || e.key === ' ') {
        // Complete the typewriter effect immediately
        typewriterIndex = dialogues[dialogueIndex].text.length;
        typewriterText = dialogues[dialogueIndex].text;
        typewriterDone = true;
        if (typewriterTimer) clearInterval(typewriterTimer);
      }
      return;
    }
    
    // Special case: pirate event statement (index 5)
    if (dialogueIndex === 5) {
      if (typewriterDone) {
        inDialogue = false;
        showMissionFailed = false;
        gameEnded = true;
        gameFlow.push('Sea Shore → Boat → Pirates');
      }
      return;
    }
    // Special case: cave event statement (index 6)
    if (dialogueIndex === 6) {
      if (typewriterDone) {
        inDialogue = false;
        showInsanityFailed = true;
      }
      return;
    }
    // Special case: abandoned house event PART 1 (index 7)
    if (dialogueIndex === 7 && typewriterDone && abandonedHouseEventPart === 1) {
      inDialogue = true;
      dialogueIndex = 8; // index of the abandoned house event PART 2
      selectedOption = 0;
      startTypewriterEffect(dialogues[8].text);
      abandonedHouseEventPart = 2;
      return;
    }
    // Special case: abandoned house event PART 2 (index 8)
    if (dialogueIndex === 8 && typewriterDone && abandonedHouseEventPart === 2) {
      inDialogue = false;
      abandonedHouseEventPart = 0;
      showSafeEnding = true;
      return;
    }
    if (e.key === 'ArrowUp') {
      selectedOption = (selectedOption - 1 + dialogues[dialogueIndex].options.length) % dialogues[dialogueIndex].options.length;
    } else if (e.key === 'ArrowDown') {
      selectedOption = (selectedOption + 1) % dialogues[dialogueIndex].options.length;
    } else if (e.key === 'Enter') {
      const next = dialogues[dialogueIndex].options[selectedOption].next;
      if (next === -1) {
        currentScene = 'deeperForest';
        inDialogue = false;
        const sceneData = scenes.deeperForest;
        sceneData.player.x = 2;
        sceneData.player.y = Math.floor(sceneData.room.h / 2) - 1;
      } else if (next === -10) {
        currentScene = 'deeperForest';
        const sceneData = scenes.deeperForest;
        sceneData.player.x = 2;
        sceneData.player.y = Math.floor(sceneData.room.h / 2) - 1;
        inDialogue = false;
        dialogueIndex = 4;
        selectedOption = 0;
      } else if (next === -11) {
        currentScene = 'cliff';
        inDialogue = false;
        const sceneData = scenes.cliff;
        sceneData.player.x = 40;
        sceneData.player.y = sceneData.room.h - 4;
        dialogueIndex = 0;
        selectedOption = 0;
      } else if (next === -13) {
        inDialogue = false;
        if (dialogueIndex === 10) showCliffThrownFailed = true;
        else if (dialogueIndex === 11) showFightWin = true;
        else if (dialogueIndex === 12) showLoopFailed = true;
      } else if (next === -2) {
        currentScene = 'abandonedTemple';
        inDialogue = false;
        selectedOption = 0;
        const sceneData = scenes.abandonedTemple;
        sceneData.player.x = 2;
        sceneData.player.y = Math.floor(sceneData.room.h / 2) - 1;
      } else if (next === -3) {
        currentScene = 'seaShore';
        inDialogue = false;
        triggerSeaShoreEvent();
      } else if (next === -4) {
        currentScene = 'cave';
        inDialogue = false;
      } else if (next === -5) {
        currentScene = 'abandonedHouse';
        inDialogue = false;
      } else {
        dialogueIndex = next;
        selectedOption = 0;
        // Start typewriter effect for new dialogue
        startTypewriterEffect(dialogues[dialogueIndex].text);
      }
    }
  }
  // Reset boat-drawn flag when changing scenes
  if (
    (currentScene !== 'seaShore' && window._seaShoreBoatDrawn) ||
    (currentScene === 'seaShore' && !window._seaShoreBoatDrawn)
  ) {
    resetSeaShoreBoatDrawn();
  }
  if (currentScene !== 'cliff') cliffNpcDialogueShown = false;
  // Add manual reset with R key
  if (e.key === 'r' || e.key === 'R') {
    const sceneData = getSceneData();
    // Default to first tile for each scene
    if (sceneData && sceneData.player) {
      // Forest and similar scenes
      if (sceneData.room && sceneData.room.w && sceneData.room.h) {
        sceneData.player.x = 2;
        sceneData.player.y = Math.floor(sceneData.room.h / 2) - 1;
        sceneData.player.direction = 0;
      }
      // Special cases for scenes with different starting points
      if (currentScene === 'seaShore') {
        sceneData.player.x = 2;
        sceneData.player.y = sceneData.room.h - 14;
        sceneData.player.direction = 0;
      } else if (currentScene === 'cave') {
        sceneData.player.x = 40;
        sceneData.player.y = 12;
        sceneData.player.direction = 0;
      } else if (currentScene === 'abandonedHouse') {
        sceneData.player.x = sceneData.player.x = sceneData.room.w / 2;
        sceneData.player.y = sceneData.player.y = sceneData.room.h / 2 + 8;
        sceneData.player.direction = 0;
      } else if (currentScene === 'cliff') {
        sceneData.player.x = 40;
        sceneData.player.y = sceneData.room.h - 4;
        sceneData.player.direction = 0;
      }
    }
    e.preventDefault();
    return;
  }
});
document.addEventListener('keyup', e => {
  keys[e.key] = false;
});

function isNear(a, b) {
  return Math.abs(a.x - b.x) <= 2 && Math.abs(a.y - b.y) <= 2;
}

const PLAYER_SPEED = 0.1;
function canMoveTo(x, y, w, h) {
  const { map, room, demoTrees } = getSceneData();
  // Check map for water/shore
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = Math.floor(x + dx);
      const ty = Math.floor(y + dy);
      if (tx < 0 || tx >= room.w || ty < 0 || ty >= room.h) return false;
      if (
        map[ty][tx] === TILE_TYPES.WATER ||
        map[ty][tx] === TILE_TYPES.SHORE
      ) return false;
    }
  }
  // Check tree trunk collision (trunk is 28x32 at offset +18,+48 in 64x80 tree tile)
  for (const t of demoTrees) {
    const trunkX = t.x + 18 / TILE;
    const trunkY = t.y + 48 / TILE;
    const trunkW = 28 / TILE;
    const trunkH = 32 / TILE;
    // AABB collision
    if (
      x + w > trunkX && x < trunkX + trunkW &&
      y + h > trunkY && y < trunkY + trunkH
    ) {
      return false;
    }
  }
  return true;
}

function update() {
  const { player, npc } = getSceneData();
  if (!inDialogue) {
    let moveX = 0, moveY = 0;
    if (keys['ArrowLeft']) moveX -= 1;
    if (keys['ArrowRight']) moveX += 1;
    if (keys['ArrowUp']) moveY -= 1;
    if (keys['ArrowDown']) moveY += 1;
    let newX = player.x;
    let newY = player.y;
    if (moveX !== 0 || moveY !== 0) {
      // Normalize diagonal speed
      const mag = Math.sqrt(moveX * moveX + moveY * moveY);
      newX += (moveX / mag) * PLAYER_SPEED;
      newY += (moveY / mag) * PLAYER_SPEED;
      // Set direction for 8-way
      if (moveY > 0 && moveX === 0) player.direction = 0; // down
      else if (moveY < 0 && moveX === 0) player.direction = 3; // up
      else if (moveX < 0 && moveY === 0) player.direction = 1; // left
      else if (moveX > 0 && moveY === 0) player.direction = 2; // right
      else if (moveX < 0 && moveY > 0) player.direction = 4; // down-left
      else if (moveX > 0 && moveY > 0) player.direction = 5; // down-right
      else if (moveX < 0 && moveY < 0) player.direction = 6; // up-left
      else if (moveX > 0 && moveY < 0) player.direction = 7; // up-right
    }
    if (canMoveTo(newX, newY, player.w, player.h)) {
      player.x = newX;
      player.y = newY;
    }
    // Interact logic
    if (currentScene === 'abandonedTemple') {
      const { sign } = getSceneData();
      if (isNear(player, sign) && keys[' ']) {
        dialogueIndex = 3; // Show the 3-option dialogue
        inDialogue = true;
        selectedOption = 0;
        startTypewriterEffect(dialogues[3].text);
      }
    } else if (isNear(player, npc) && keys[' ']) {
      if (currentScene === 'deeperForest') {
        dialogueIndex = 4; // Show deeper forest NPC dialogue
      } else if (currentScene === 'cliff' && !cliffNpcDialogueShown) {
        dialogueIndex = 9; // Cliff NPC dialogue
        cliffNpcDialogueShown = true;
      } else {
        dialogueIndex = 0;
      }
      inDialogue = true;
      selectedOption = 0;
      startTypewriterEffect(dialogues[0].text);
    }
    if (moveX !== 0 || moveY !== 0) {
      player.animMoving = true;
    } else {
      player.animMoving = false;
    }
    if (player.animMoving) {
      player.animTimer += 1;
      if (player.animTimer > 10) { // adjust speed as needed
        player.animFrame = (player.animFrame + 1) % 3;
        player.animTimer = 0;
      }
    } else {
      player.animFrame = 1; // idle frame
      player.animTimer = 0;
    }
  } else {
    // Exit dialogue with Escape
    if (keys['Escape']) {
      inDialogue = false;
    }
  }
}

// Camera
const camera = { x: 0, y: 0, w: canvas.width / TILE, h: canvas.height / TILE };

function updateCamera() {
  const { player, room } = getSceneData();
  // Center camera on player
  camera.x = player.x + player.w / 2 - camera.w / 2;
  camera.y = player.y + player.h / 2 - camera.h / 2;
  // Clamp camera to room bounds
  camera.x = Math.max(0, Math.min(camera.x, room.w - camera.w));
  camera.y = Math.max(0, Math.min(camera.y, room.h - camera.h));
}

function drawRoom() {
  const { map, room, demoTrees, boat, sign } = getSceneData();
  // Fix jitter: use integer camera offset and sub-tile offset
  const camTileX = Math.floor(camera.x);
  const camTileY = Math.floor(camera.y);
  const camOffsetX = -(camera.x - camTileX) * TILE;
  const camOffsetY = -(camera.y - camTileY) * TILE;
  // Draw tiles
  for (let y = 0; y < Math.ceil(camera.h); y++) {
    for (let x = 0; x < Math.ceil(camera.w); x++) {
      const mapX = camTileX + x;
      const mapY = camTileY + y;
      if (mapX < 0 || mapX >= room.w || mapY < 0 || mapY >= room.h) continue;
      let color = '#4ca64c'; // grass
      if (map[mapY][mapX] === TILE_TYPES.PATH) {
        // Special case: grey for temple in abandoned temple scene
        if (currentScene === 'abandonedTemple') {
          // Check if this tile is inside the temple area
          const templeW = 12, templeH = 10;
          const templeX = Math.floor(room.w/2) - Math.floor(templeW/2);
          const templeY = Math.floor(room.h/2) - Math.floor(templeH/2);
          if (
            mapX >= templeX && mapX < templeX + templeW &&
            mapY >= templeY && mapY < templeY + templeH
          ) {
            color = '#b0b0b0'; // grey concrete/stone
          } else {
            color = '#e2c275'; // path
          }
        } else {
          color = '#e2c275'; // path
        }
      }
      if (map[mapY][mapX] === TILE_TYPES.WATER) {
        if (currentScene === 'cave') {
          color = '#444'; // dark gray for cave water pool
        } else {
          color = '#3493db'; // water
        }
      }
      if (map[mapY][mapX] === TILE_TYPES.SHORE) color = '#a86b32'; // shore
      ctx.fillStyle = color;
      ctx.fillRect(x * TILE + camOffsetX, y * TILE + camOffsetY, TILE, TILE);
    }
  }
  // Draw all demo trees
  for (const t of demoTrees) {
    drawDemoTree(t.x, t.y, camTileX, camTileY, camOffsetX, camOffsetY);
  }
  // Draw boat if in sea shore
  if (currentScene === 'seaShore' && boat) {
    drawBoat(boat.x, boat.y, boat.w, boat.h, camTileX, camTileY, camOffsetX, camOffsetY);
  }
  // Draw border at room edge (relative to camera)
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    -camera.x * TILE,
    -camera.y * TILE,
    room.w * TILE,
    room.h * TILE
  );
  // Draw sign if in abandoned temple
  if (currentScene === 'abandonedTemple' && sign) {
    const camTileX = Math.floor(camera.x);
    const camTileY = Math.floor(camera.y);
    const camOffsetX = -(camera.x - camTileX) * TILE;
    const camOffsetY = -(camera.y - camTileY) * TILE;
    drawSign(sign.x, sign.y, camTileX, camTileY, camOffsetX, camOffsetY);
  }
}

function drawSprite(obj) {
  // If this is the player, use the sprite
  if (obj === getSceneData().player) {
    drawPlayerSprite(
      ctx,
      (obj.x - camera.x) * TILE,
      (obj.y - camera.y) * TILE,
      obj.direction || 0,
      obj.animFrame || 1
    );
    return;
  }
  // If this is the NPC in abandoned house, use the local woman sprite
  if (currentScene === 'abandonedHouse' && obj === getSceneData().npc) {
    drawLocalWomanSprite(
      ctx,
      (obj.x - camera.x) * TILE,
      (obj.y - camera.y) * TILE
    );
    return;
  }
  // If this is the NPC in other scenes (not abandonedHouse or abandonedTemple), use the strange man sprite
  if (obj === getSceneData().npc && currentScene !== 'abandonedHouse' && currentScene !== 'abandonedTemple') {
    drawStrangeManSprite(
      ctx,
      (obj.x - camera.x) * TILE,
      (obj.y - camera.y) * TILE
    );
    return;
  }
  ctx.fillStyle = obj.color;
  ctx.fillRect(
    (obj.x - camera.x) * TILE,
    (obj.y - camera.y) * TILE,
    obj.w * TILE,
    obj.h * TILE
  );
}

// Track if mission failed message is showing
let showMissionFailed = false;
let gameEnded = false;
let showFlowchart = false;
let gameFlow = [];
let showDownloadButton = false;

// Add insanity mission failed state
let showInsanityFailed = false;

// Add safe ending state for abandoned house
let showSafeEnding = false;

// Add cliff failed state
let showCliffFailed = false;

// Add new ending flags at the top with other ending flags
let showCliffThrownFailed = false;
let showFightWin = false;
let showLoopFailed = false;

// Word wrap helper
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Calculate required height for dialogue box
function calculateDialogueHeight(dlg, isStatement) {
  const boxW = canvas.width - 4 * TILE;
  const maxWidth = boxW - 4 * TILE; // Reduced padding
  
  // Set font to measure text
  ctx.font = 'bold 18px monospace';
  
  // Calculate lines needed for main text
  const textLines = wrapText(ctx, dlg.text, maxWidth);
  const textHeight = textLines.length * 28; // Reduced line height
  
  // Calculate space needed for options
  let optionsHeight = 0;
  if (!isStatement && dlg.options) {
    optionsHeight = dlg.options.length * 32 + 40; // Reduced space for options and instructions
  }
  
  // Calculate total height needed
  const totalHeight = textHeight + optionsHeight + 50; // Reduced padding
  
  // Return minimum height or calculated height, whichever is larger
  const minHeight = isStatement ? 10 * TILE : 8 * TILE;
  return Math.max(minHeight, totalHeight);
}

function drawDialogue() {
  const dlg = dialogues[dialogueIndex];
  // Special case: pirate event statement (index 5), cave event (index 6), abandoned house event (index 7 and 8), or mission failed (index 13)
  const isStatement = (dialogueIndex === 5 || dialogueIndex === 6 || dialogueIndex === 7 || dialogueIndex === 8 || dialogueIndex === 13);
  // Only index 13 is mission failed (red)
  const isMissionFailed = (dialogueIndex === 13);
  // Make all dialogue boxes bigger and more Undertale-like
  const boxW = canvas.width - 4 * TILE;
  const boxH = calculateDialogueHeight(dlg, isStatement);
  const boxX = 2 * TILE;
  const boxY = canvas.height - boxH - 2 * TILE;
  ctx.fillStyle = '#000d';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.lineWidth = 1;
  ctx.font = 'bold 18px monospace';
  // Always use typewriter effect for all dialogue
  ctx.fillStyle = isMissionFailed ? '#f44' : '#fff';
  const shownText = typewriterText || '';
  const lines = wrapText(ctx, shownText, boxW - 4 * TILE);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], boxX + 2 * TILE, boxY + (isStatement ? 2 * TILE + 28 : 2 * TILE + 24) + i * 28);
  }
  // Show prompt when done
  if (typewriterDone) {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press any key...', boxX + 2 * TILE, boxY + boxH - 16);
  }
  if (!isStatement) {
    // Raise options if at the cliff scene (dialogueIndex 9) or scene choice (dialogueIndex 3)
    let optionYOffset = boxH - 48;
    if (dialogueIndex === 9 || dialogueIndex === 3) {
      optionYOffset -= 48; // raise by 48px
    }
    dlg.options.forEach((opt, i) => {
      ctx.fillStyle = i === selectedOption ? '#ff0' : '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText((i === selectedOption ? '> ' : '  ') + opt.text, boxX + 2 * TILE, boxY + optionYOffset + i * 32);
    });
  }
}

function draw() {
  if (showFlowchart) {
    // Show a simple flowchart of the user's path
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Your Path', canvas.width / 2, 100);
    ctx.font = '20px monospace';
    let y = 180;
    for (let step of gameFlow) {
      ctx.fillText(step, canvas.width / 2, y);
      y += 40;
    }
    ctx.font = 'bold 32px monospace';
    // Show correct ending message
    if (gameFlow[gameFlow.length - 1] === 'Sea Shore → Boat → Pirates') {
      ctx.fillStyle = '#f44';
      ctx.fillText('YOU HAVE BEEN CAPTURED!', canvas.width / 2, y + 40);
      ctx.fillText('MISSION FAILED', canvas.width / 2, y + 90);
    } else if (gameFlow[gameFlow.length - 1] === 'Cave → Insanity') {
      ctx.fillStyle = '#f44';
      ctx.fillText("YOU'RE GOING INSANE!", canvas.width / 2, y + 40);
      ctx.fillText('MISSION FAILED', canvas.width / 2, y + 90);
    } else if (gameFlow[gameFlow.length - 1] === 'Abandoned House → Safe') {
      ctx.fillStyle = '#3f4';
      ctx.fillText('YOU ARE SAFE!', canvas.width / 2, y + 40);
      ctx.fillText('MISSION COMPLETE', canvas.width / 2, y + 90);
    } else if (gameFlow[gameFlow.length - 1] === 'Cliff → Pushed Off') {
      ctx.fillStyle = '#f44';
      ctx.fillText('YOU HAVE BEEN PUSHED OFF THE CLIFF!', canvas.width / 2, y + 40);
      ctx.fillText('MISSION FAILED', canvas.width / 2, y + 90);
    } else if (gameFlow[gameFlow.length - 1] === 'Cliff → Thrown Off → Mission Failed') {
      ctx.fillStyle = '#f44';
      ctx.fillText('YOU HAVE BEEN THROWN OFF THE CLIFF!', canvas.width / 2, y + 40);
      ctx.fillText('MISSION FAILED', canvas.width / 2, y + 90);
    } else if (gameFlow[gameFlow.length - 1] === 'Cliff → Fight → Mission Complete') {
      ctx.fillStyle = '#3f4';
      ctx.fillText('YOU HAVE WON THE FIGHT!', canvas.width / 2, y + 40);
      ctx.fillText('MISSION COMPLETE', canvas.width / 2, y + 90);
    } else if (gameFlow[gameFlow.length - 1] === 'Cliff → Loop → Mission Failed') {
      ctx.fillStyle = '#f44';
      ctx.fillText('YOU ARE STUCK IN A LOOP!', canvas.width / 2, y + 40);
      ctx.fillText('MISSION FAILED', canvas.width / 2, y + 90);
    }
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press [Spacebar] to return to menu', canvas.width / 2, y + 140);
    ctx.fillText('Press [Enter] to download as JPG', canvas.width / 2, y + 170);
    ctx.textAlign = 'left';
    return;
  }
  if (showInsanityFailed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.fillText("YOU'RE GOING INSANE!", canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  if (showSafeEnding) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#3f4';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ARE SAFE!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION COMPLETE', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  if (showCliffFailed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.fillText('YOU HAVE BEEN PUSHED OFF THE CLIFF!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  if (showCliffThrownFailed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.fillText('YOU HAVE BEEN THROWN OFF THE CLIFF!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  if (showFightWin) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#3f4';
    ctx.textAlign = 'center';
    ctx.fillText('YOU HAVE WON THE FIGHT!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION COMPLETE', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  if (showLoopFailed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ARE STUCK IN A LOOP!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  if (gameEnded) {
    // Black screen with big red Mission Failed
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.fillText('YOU HAVE BEEN CAPTURED!', canvas.width / 2, canvas.height / 2 - 24);
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 + 36);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press any key...', canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = 'left';
    return;
  }
  updateCamera();
  drawRoom();
  // Check boat visibility for pirate event
  checkSeaShoreBoatVisibility();
  // Check cave event for timed dialogue
  checkCaveEventVisibility();
  // Check abandoned house event for timed dialogue
  checkAbandonedHouseEventVisibility();
  const { player, npc } = getSceneData();
  // Debug: log player position and object
  if (currentScene === 'seaShore') {
    console.log('SeaShore player:', player);
    // Force camera to center on player
    camera.x = player.x + player.w / 2 - camera.w / 2;
    camera.y = player.y + player.h / 2 - camera.h / 2;
    camera.x = Math.max(0, Math.min(camera.x, getSceneData().room.w - camera.w));
    camera.y = Math.max(0, Math.min(camera.y, getSceneData().room.h - camera.h));
  }
  // Draw NPC if above player
  if (npc.y + npc.h <= player.y) drawSprite(npc);
  // Draw all trees and player in Y order for Z-order effect
  // Gather all tree and player objects
  const renderObjs = getSceneData().demoTrees.map(t => ({
    type: 'tree',
    x: t.x,
    y: t.y,
    draw: (camTileX, camTileY, camOffsetX, camOffsetY) => drawDemoTree(t.x, t.y, camTileX, camTileY, camOffsetX, camOffsetY)
  }));
  renderObjs.push({
    type: 'player',
    x: player.x,
    y: player.y,
    draw: (camTileX, camTileY, camOffsetX, camOffsetY) => drawSprite(player)
  });
  // Sort by y (top to bottom)
  renderObjs.sort((a, b) => a.y - b.y);
  // Draw in order
  const camTileX = Math.floor(camera.x);
  const camTileY = Math.floor(camera.y);
  const camOffsetX = -(camera.x - camTileX) * TILE;
  const camOffsetY = -(camera.y - camTileY) * TILE;
  for (const obj of renderObjs) {
    obj.draw(camTileX, camTileY, camOffsetX, camOffsetY);
  }
  // Draw NPC if below player
  if (npc.y + npc.h > player.y) drawSprite(npc);
  if (inDialogue) drawDialogue();
  // Draw current scene name at top left
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#fff';
  let sceneLabel = '';
  if (currentScene === 'forest') sceneLabel = 'Forest';
  else if (currentScene === 'deeperForest') sceneLabel = 'Deeper Forest';
  else if (currentScene === 'abandonedTemple') sceneLabel = 'Abandoned Temple';
  else if (currentScene === 'seaShore') sceneLabel = 'Sea Shore';
  else if (currentScene === 'cave') sceneLabel = 'Cave';
  else if (currentScene === 'abandonedHouse') sceneLabel = 'Abandoned House';
  else if (currentScene === 'cliff') sceneLabel = 'Cliff';
  ctx.fillText('Scene: ' + sceneLabel, 16, 28);
}

// --- MENU & INTRO SYSTEM ---
let gameState = 'menu'; // 'menu', 'userinfo', 'userinfoPrompt', 'intro', 'game', 'howto', 'about'
let menuIndex = 0;
const menuOptions = [
  { label: 'Start Game', action: () => { 
      gameState = 'userinfoPrompt';
      userInfoPromptTimer = Date.now();
    } },
  { label: 'How to Play', action: () => { gameState = 'howto'; } },
  { label: 'About Us', action: () => { gameState = 'about'; } },
];

// User info state
let userName = '';
let userAge = '';
let userInfoStep = 0; // 0: name, 1: age
let userInfoError = '';
let userInfoPromptTimer = 0;

function drawUserInfoPrompt() {
  // Use the same background and vibe as the menu
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#223a2f');
  gradient.addColorStop(0.4, '#2e4a3f');
  gradient.addColorStop(0.7, '#3b4d5c');
  gradient.addColorStop(1, '#5c4a3b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  menuStars.forEach(star => {
    star.twinkle += 0.05;
    const brightness = Math.sin(star.twinkle) * 0.3 + 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  menuParticles.forEach(particle => {
    particle.x += particle.vx * 0.5;
    particle.y += particle.vy * 0.5;
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  });
  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Before we start the game', canvas.width / 2, 180);
  ctx.font = 'bold 20px monospace';
  ctx.fillText('We need to know a few things about you.', canvas.width / 2, 240);
  ctx.fillText('who are you?', canvas.width / 2, 300);
  ctx.textAlign = 'left';
}

function drawUserInfo() {
  // Use the same background and vibe as the menu
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#223a2f');
  gradient.addColorStop(0.4, '#2e4a3f');
  gradient.addColorStop(0.7, '#3b4d5c');
  gradient.addColorStop(1, '#5c4a3b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  menuStars.forEach(star => {
    star.twinkle += 0.05;
    const brightness = Math.sin(star.twinkle) * 0.3 + 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  menuParticles.forEach(particle => {
    particle.x += particle.vx * 0.5;
    particle.y += particle.vy * 0.5;
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  });
  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Enter Your Info', canvas.width / 2, 120);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Name:', canvas.width / 2, 200);
  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(userName + (userInfoStep === 0 ? '_' : ''), canvas.width / 2, 240);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Age:', canvas.width / 2, 300);
  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(userAge + (userInfoStep === 1 ? '_' : ''), canvas.width / 2, 340);
  ctx.fillStyle = '#f44';
  ctx.font = 'bold 20px monospace';
  if (userInfoError) ctx.fillText(userInfoError, canvas.width / 2, 400);
  ctx.textAlign = 'left';
}

// Menu animation variables
let menuTime = 0;
let menuPulse = 0;
let menuGlow = 0;
let menuParticles = [];
let menuStars = [];

// Initialize menu particles
for (let i = 0; i < 50; i++) {
  menuParticles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 3 + 1,
    color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]
  });
}

// Initialize menu stars
for (let i = 0; i < 30; i++) {
  menuStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    twinkle: Math.random() * Math.PI * 2
  });
}

// Intro story
const introLines = [
  '',
  'They say the forest was once alive — not with animals or birdsong',
  'but with memory',
  '',
  'People who wandered in came back different... if they came back at all.',
  "You didn't come here by accident.",
  '',
  'Your journey begins at the edge of the woods,',
  "At least... that's what you keep telling yourself",
  'even though your mind is blank and your hands shakes.',
  '',
  '',
  'This is a story for you to decide.',
  '',
  '',
  'Press any key'
];
let introScroll = 0;
let introDone = false;
function startIntro() {
  gameState = 'intro';
  introScroll = canvas.height;
  introDone = false;
}

function drawIntro() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '20px monospace';
  ctx.fillStyle = '#ffe';
  ctx.textAlign = 'center';
  let y = introScroll;
  for (let i = 0; i < introLines.length; i++) {
    ctx.fillText(introLines[i], canvas.width / 2, y + i * 36);
  }
  ctx.textAlign = 'left';
}

function drawMenu() {
  // Update menu time
  menuTime += 0.02;
  menuPulse = Math.sin(menuTime * 2) * 0.5 + 0.5;
  menuGlow = Math.sin(menuTime * 1.5) * 0.3 + 0.7;

  // Subtle forest-like gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#223a2f'); // deep green
  gradient.addColorStop(0.4, '#2e4a3f'); // muted green
  gradient.addColorStop(0.7, '#3b4d5c'); // muted blue
  gradient.addColorStop(1, '#5c4a3b'); // soft brown
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw animated stars (keep subtle)
  menuStars.forEach(star => {
    star.twinkle += 0.05;
    const brightness = Math.sin(star.twinkle) * 0.3 + 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  // Draw floating particles (make more subtle)
  menuParticles.forEach(particle => {
    particle.x += particle.vx * 0.5;
    particle.y += particle.vy * 0.5;
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  });

  // Draw title in white, Undertale-style font
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 12; // Fixed white glow
  ctx.font = "bold 54px 'Determination Mono', 'Cascadia Mono', 'Consolas', 'monospace'";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText('FOREST ADVENTURE', canvas.width / 2, 120);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.font = '18px monospace';
  ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + menuPulse * 0.3})`;
  ctx.fillText('A Mysterious Journey Awaits...', canvas.width / 2, 150);

  // Draw menu options with effects
  ctx.font = 'bold 24px monospace';
  menuOptions.forEach((opt, i) => {
    const y = 220 + i * 50;
    const isSelected = i === menuIndex;
    if (isSelected) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.13 + menuPulse * 0.07})`;
      ctx.fillRect(canvas.width / 2 - 200, y - 15, 400, 35);
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8; // Fixed white glow for selected option
    }
    ctx.fillStyle = isSelected ? '#fff' : `rgba(255, 255, 255, ${0.8 + Math.sin(menuTime * 3 + i) * 0.2})`;
    ctx.fillText((isSelected ? '▶ ' : '  ') + opt.label, canvas.width / 2, y + 8);
    ctx.shadowBlur = 0;
  });

  // Draw decorative lines (subtle)
  ctx.strokeStyle = `rgba(255, 255, 255, 0.10)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 200);
  ctx.lineTo(200, 200);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvas.width - 200, 200);
  ctx.lineTo(canvas.width - 50, 200);
  ctx.stroke();

  // Version info
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'right';
  ctx.fillText('v1.0 - Press ↑/↓ to navigate, Enter to select', canvas.width - 20, canvas.height - 20);
  ctx.textAlign = 'left';
}

function drawHowTo() {
  // Use the same background and vibe as the menu
  // Subtle forest-like gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#223a2f'); // deep green
  gradient.addColorStop(0.4, '#2e4a3f'); // muted green
  gradient.addColorStop(0.7, '#3b4d5c'); // muted blue
  gradient.addColorStop(1, '#5c4a3b'); // soft brown
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw animated stars (keep subtle)
  menuStars.forEach(star => {
    star.twinkle += 0.05;
    const brightness = Math.sin(star.twinkle) * 0.3 + 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  // Draw floating particles (make more subtle)
  menuParticles.forEach(particle => {
    particle.x += particle.vx * 0.5;
    particle.y += particle.vy * 0.5;
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  });

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('How to Play', canvas.width / 2, 100);
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ffe';
  ctx.fillText('Use arrow keys to move.', canvas.width / 2, 160);
  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('Space: Talk to NPC, Enter: Select', canvas.width / 2, 190);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('Walk to the NPC at the end of the path.', canvas.width / 2, 220);
  ctx.fillText('Avoid tree trunks and water.', canvas.width / 2, 250);
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Press any key to return to menu.', canvas.width / 2, 320);
  ctx.textAlign = 'left';
}

function drawAbout() {
  ctx.fillStyle = '#222e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('About Us', canvas.width / 2, 100);
  ctx.font = '18px monospace';
  ctx.fillText('Created by Amirin Joham', canvas.width / 2, 160);
  ctx.fillText('A simple pixel forest adventure demo.', canvas.width / 2, 190);
  ctx.fillText('Built with JavaScript and Canvas.', canvas.width / 2, 220);
  ctx.font = '16px monospace';
  ctx.fillText('Press any key to return to menu.', canvas.width / 2, 320);
  ctx.textAlign = 'left';
}

function gameLoop() {
  if (gameState === 'userinfoPrompt') {
    drawUserInfoPrompt();
    // Wait for keypress to continue (handled in keydown)
  } else if (gameState === 'userinfo') {
    drawUserInfo();
  } else if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'howto') {
    drawHowTo();
  } else if (gameState === 'about') {
    drawAbout();
  } else if (gameState === 'intro') {
    drawIntro();
    // Scroll the story, then stop with last line visible and centered
    const lastLineY = canvas.height / 2 + (introLines.length - 1) * 36 / 2;
    const targetScroll = canvas.height / 2 - (introLines.length * 36) / 2 + 36;
    if (introScroll > targetScroll) {
      introScroll -= 1.1;
      if (introScroll < targetScroll) introScroll = targetScroll;
      introDone = false;
    } else {
      introDone = true;
    }
  } else if (gameState === 'game') {
    update();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

// Draw a pixel-art tree inspired by the provided image
function drawDemoTree(tileX, tileY, camTileX = Math.floor(camera.x), camTileY = Math.floor(camera.y), camOffsetX = 0, camOffsetY = 0) {
  const px = (tileX - camTileX) * TILE + camOffsetX;
  const py = (tileY - camTileY) * TILE + camOffsetY;
  // Trunk (pixelated, blocks movement)
  ctx.fillStyle = '#6b3e1b';
  ctx.fillRect(px + 18, py + 48, 28, 32);
  ctx.fillRect(px + 12, py + 60, 40, 20);
  // Canopy base (player can walk under, but is drawn behind if y < tree y)
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#2e8b2e';
  ctx.fillRect(px + 0, py + 8, 64, 48);
  // Canopy shading (darker)
  ctx.fillStyle = '#195c19';
  ctx.fillRect(px + 0, py + 32, 64, 24);
  ctx.fillRect(px + 40, py + 16, 16, 32);
  // Canopy highlight (lighter)
  ctx.fillStyle = '#7be87b';
  ctx.fillRect(px + 8, py + 12, 16, 12);
  ctx.fillRect(px + 20, py + 20, 8, 8);
  ctx.restore();
}

// Helper to get current scene data
function getSceneData() {
  return scenes[currentScene];
}

// Timed event for sea shore (boat visibility based)
let seaShoreBoatVisibleTimer = null;
let seaShoreBoatVisibleStart = null;
let seaShorePirateEventTriggered = false;

function checkSeaShoreBoatVisibility() {
  if (currentScene !== 'seaShore') {
    seaShoreBoatVisibleStart = null;
    seaShorePirateEventTriggered = false;
    return;
  }
  const { boat } = getSceneData();
  // Camera viewport in tile coordinates
  const camLeft = camera.x;
  const camRight = camera.x + camera.w;
  const camTop = camera.y;
  const camBottom = camera.y + camera.h;
  // Boat rectangle
  const boatLeft = boat.x;
  const boatRight = boat.x + boat.w;
  const boatTop = boat.y;
  const boatBottom = boat.y + boat.h;
  // Check if any part of the boat is in the viewport
  const visible =
    boatRight > camLeft && boatLeft < camRight &&
    boatBottom > camTop && boatTop < camBottom;
  if (visible) {
    if (!seaShoreBoatVisibleStart) {
      seaShoreBoatVisibleStart = Date.now();
    } else if (!seaShorePirateEventTriggered && Date.now() - seaShoreBoatVisibleStart >= 3000) {
      inDialogue = true;
      dialogueIndex = 5; // index of the sea shore event dialogue
      selectedOption = 0;
      startTypewriterEffect(dialogues[5].text);
      seaShorePirateEventTriggered = true;
    }
  } else {
    seaShoreBoatVisibleStart = null;
  }
}

// When leaving sea shore, reset the boat-drawn flag
function resetSeaShoreBoatDrawn() {
  window._seaShoreBoatDrawn = false;
}

// Draw a simple boat for the sea shore scene
function drawBoat(tileX, tileY, w, h, camTileX, camTileY, camOffsetX, camOffsetY) {
  const px = (tileX - camTileX) * TILE + camOffsetX;
  const py = (tileY - camTileY) * TILE + camOffsetY;
  // Simple brown boat with a mast
  ctx.fillStyle = '#8b5c2a';
  ctx.fillRect(px, py + h * TILE / 2, w * TILE, h * TILE / 2); // hull
  ctx.fillStyle = '#c2a36b';
  ctx.fillRect(px + w * TILE / 2 - 2, py, 4, h * TILE); // mast
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(px + w * TILE / 2, py + 4);
  ctx.lineTo(px + w * TILE / 2 + 18, py + h * TILE / 2);
  ctx.lineTo(px + w * TILE / 2, py + h * TILE / 2);
  ctx.closePath();
  ctx.fill();
}

// Timed event for cave (3s after entering cave scene)
let caveEventVisibleStart = null;
let caveEventTriggered = false;

function checkCaveEventVisibility() {
  if (currentScene !== 'cave') {
    caveEventVisibleStart = null;
    caveEventTriggered = false;
    return;
  }
  if (!caveEventVisibleStart) {
    caveEventVisibleStart = Date.now();
  } else if (!caveEventTriggered && Date.now() - caveEventVisibleStart >= 3000) {
    inDialogue = true;
    dialogueIndex = 6; // index of the cave event dialogue
    selectedOption = 0;
    startTypewriterEffect(dialogues[6].text);
    caveEventTriggered = true;
  }
}

// Timed event for abandoned house (3s after entering)
let abandonedHouseEventVisibleStart = null;
let abandonedHouseEventTriggered = false;
let abandonedHouseEventPart = 0;

function checkAbandonedHouseEventVisibility() {
  if (currentScene !== 'abandonedHouse') {
    abandonedHouseEventVisibleStart = null;
    abandonedHouseEventTriggered = false;
    abandonedHouseEventPart = 0;
    return;
  }
  if (!abandonedHouseEventVisibleStart) {
    abandonedHouseEventVisibleStart = Date.now();
  } else if (!abandonedHouseEventTriggered && Date.now() - abandonedHouseEventVisibleStart >= 3000) {
    inDialogue = true;
    dialogueIndex = 7; // index of the abandoned house event PART 1
    selectedOption = 0;
    startTypewriterEffect(dialogues[7].text);
    abandonedHouseEventTriggered = true;
    abandonedHouseEventPart = 1;
  }
}

// Timed event for cliff NPC interaction
let cliffNpcDialogueShown = false;

function drawSign(x, y, camTileX, camTileY, camOffsetX, camOffsetY) {
  const px = (x - camTileX) * TILE + camOffsetX;
  const py = (y - camTileY) * TILE + camOffsetY;
  // Post
  ctx.fillStyle = '#8b5c2a';
  ctx.fillRect(px + 12, py + 24, 8, 24);
  // Board
  ctx.fillStyle = '#e2c275';
  ctx.fillRect(px, py, 32, 24);
  // Scribble (fake text)
  ctx.fillStyle = '#7a5a2b';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('←', px + 4, py + 16);
  ctx.fillText('Sign', px + 12, py + 16);
}

gameLoop(); 