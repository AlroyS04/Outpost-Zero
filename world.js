// world.js — the MAP: where everything is, and what you can bump into.
// Positions are in pixels. The world is made of 6 separate "regions":
// your home region (the base) and 5 far-away places you reach by rover.
// Want to move a building or add a rock? Change the numbers here!

const VIEW = { w: 480, h: 270 };          // what the player sees (tiny on purpose: chunky pixels!)
const WORLD = { w: 3200, h: 1600 };
const RIM = 46;                            // thickness of the mountain wall around each region

// Each region is a walled-in area. You can only leave by rover.
const REGIONS = {
  home:    { x: 0,    y: 0,    w: 1800, h: 1300, name: "Home Base" },
  crater:  { x: 1900, y: 0,    w: 600,  h: 480,  name: "Crystal Crater", ground: "#7d8097" },
  landing: { x: 1900, y: 540,  w: 600,  h: 480,  name: "Landing Site Alpha", ground: "#8b8e99" },
  south:   { x: 1900, y: 1080, w: 600,  h: 480,  name: "South Pole", ground: "#5d647c" },
  north:   { x: 2600, y: 0,    w: 600,  h: 480,  name: "North Pole", ground: "#9a9fb0" },
  far:     { x: 2600, y: 540,  w: 600,  h: 480,  name: "Far Side Camp", ground: "#83808c" },
  cave:    { x: 2600, y: 1080, w: 600,  h: 480,  name: "Moon Caves", ground: "#4a4359" }
};
const REGION_IDS = Object.keys(REGIONS);
// The places you reach by ROVER (the cave is entered on foot, so it is not in this list)
const POLE_REGIONS = ["north", "south"];     // reached on foot (or driving) through a gap in the wall
const ROVER_REGIONS = REGION_IDS.filter((id) => id !== "home" && id !== "cave" && POLE_REGIONS.indexOf(id) < 0);

// Gaps in the mountain wall. Walk through one to reach the pole, walk back through the other end to return.
const GAP_W = 120;
const GATES = [
  { id: "home_n",  region: "home",  side: "top",    x: 900,  to: "north" },
  { id: "home_s",  region: "home",  side: "bottom", x: 900,  to: "south" },
  { id: "north_s", region: "north", side: "bottom", x: 2900, to: "home", from: "north" },
  { id: "south_n", region: "south", side: "top",    x: 2200, to: "home", from: "south" }
];
// side is "top" or "bottom" (home has a gap on both sides, so we must say which)
function gateAt(regionId, x, side) {
  for (const gt of GATES) if (gt.region === regionId && (!side || gt.side === side) && Math.abs(x - gt.x) < GAP_W / 2 - PLAYER_R) return gt;
  return null;
}

function regionAt(x, y) {
  for (const id of REGION_IDS) {
    const r = REGIONS[id];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return id;
  }
  return "home";
}

// Where you land when the rover arrives, and where the parked rover is
function padOf(id) { const r = REGIONS[id]; return { x: r.x + 90, y: r.y + 372 }; }
function spawnOf(id) { const r = REGIONS[id]; return { x: r.x + 128, y: r.y + 396 }; }

// The shield bubble covers the base. Inside it you get air and protection.
const BASE = { x: 862, y: 652, radius: 262 };   // a round dome that covers the whole (round) camp

// ---- Buildings (x, y = top-left corner; w, h = size) ----
const BUILDINGS = {
  pod:      { x: 804, y: 556, w: 82, h: 70 },
  computer: { x: 892, y: 566, w: 56, h: 42 },
  life:     { x: 972, y: 594, w: 44, h: 46 },
  shield:   { x: 886, y: 654, w: 28, h: 34 },
  greenhouse: { x: 812, y: 700, w: 100, h: 56 },
  lab:      { x: 950, y: 700, w: 72, h: 52 },
  table:    { x: 756, y: 636, w: 36, h: 22 },
  solar:    { x: 556, y: 590, w: 108, h: 84 },
  launcher: { x: 1050, y: 548, w: 64, h: 70 }
};
// The Rover Bay is a flat landing pad (you can walk over it)
const BAY = { x: 1070, y: 668, w: 96, h: 64 };

// Where the player wakes up
const SPAWN = { x: 846, y: 670 };

// ---- Things you can use. "x, y" is the spot where you stand. "r" = how close you must be. ----
// "tx, ty" = the point the arrow and the E button show (the thing itself, not the floor).
// kind "press" = press E.  kind "mat" = triggers when you walk onto it.
// "region" says where it is (default: home).
// "rect" = a building: you can use it from ANY side, as long as you are within "r" pixels of it.
const SPOTS = [
  { id: "bed",       kind: "press", rect: "pod",        r: 14, x: 846, y: 646, tx: 846, ty: 552, icon: "🛏️", label: "Sleep" },
  { id: "computer",  kind: "press", rect: "computer",   r: 14, x: 920, y: 624, tx: 920, ty: 552, icon: "🖥️", label: "Talk to Earth" },
  { id: "life",      kind: "press", rect: "life",       r: 14, x: 994, y: 654, tx: 994, ty: 584, icon: "💨", label: "Air generator" },
  { id: "shield",    kind: "press", rect: "shield",     r: 14, x: 900, y: 704, tx: 900, ty: 618, icon: "🛡️", label: "Shield" },
  { id: "greenhouse",kind: "press", rect: "greenhouse", r: 12, x: 862, y: 768, tx: 862, ty: 748, icon: "🌱", label: "Greenhouse" },
  { id: "lab",       kind: "press", rect: "lab",        r: 12, x: 986, y: 766, tx: 986, ty: 690, icon: "🔬", label: "Science lab" },
  { id: "table",     kind: "press", rect: "table",      r: 14, x: 774, y: 668, tx: 774, ty: 626, icon: "🍎", label: "Eat" },
  { id: "panels",    kind: "press", rect: "solar",      r: 14, x: 690, y: 636, tx: 610, ty: 580, icon: "🧹", label: "Clean panels" },
  { id: "bay",       kind: "press", rect: "bay",        r: 12, x: 1118, y: 704, tx: 1118, ty: 650, icon: "🚙", label: "Rover Bay" },
  { id: "launcher",  kind: "press", rect: "launcher",   r: 14, x: 1082, y: 640, tx: 1082, ty: 540, icon: "🚀", label: "Launcher" },
  { id: "earthview", kind: "press", x: 1632, y: 662, r: 30, tx: 1632, ty: 604, icon: "🔭", label: "Look at Earth" },
  { id: "cave_enter",kind: "press", x: 1500, y: 1106, r: 34, tx: 1500, ty: 1030, icon: "🕳️", label: "Enter Moon cave" },
  { id: "plaque",    kind: "press", x: 1636, y: 912, r: 34, tx: 1636, ty: 864, icon: "🇺🇸", label: "Tranquility Base" },
  { id: "cave_exit", kind: "press", region: "cave", x: 2700, y: 1456, r: 34, tx: 2700, ty: 1412, icon: "🚪", label: "Exit cave" },
  { id: "zorp_talk", kind: "press", region: "cave", x: 2900, y: 1296, r: 44, tx: 2900, ty: 1236, icon: "👽", label: "Talk to Zorp" },
  { id: "ghmat",     kind: "mat",   x: 862, y: 766, r: 18, tx: 862, ty: 758, icon: "❄️", label: "Drop ice here" },
  { id: "labmat",    kind: "mat",   x: 986, y: 762, r: 18, tx: 986, ty: 754, icon: "🪨", label: "Drop samples here" }
];
// ---- Arrange the camp in a circle: the shield tower in the middle, the table inside it, everything else on a ring ----
(function ringCamp() {
  const C = { x: 862, y: 652 }, RING = 178, INNER = 88;
  const move = {};            // how far each station moves
  const place = (k, b, cx, cy) => {
    const dx = Math.round(cx - (b.x + b.w / 2)), dy = Math.round(cy - (b.y + b.h / 2));
    b.x += dx; b.y += dy; move[k] = { x: dx, y: dy };
  };
  const ring = ["pod", "computer", "launcher", "life", "lab", "greenhouse"].map((k) => ({ k: k, b: BUILDINGS[k] }));
  ring.push({ k: "bay", b: BAY });
  // keep the order they were in (around the middle), then space them evenly
  ring.forEach((o) => (o.a = Math.atan2(o.b.y + o.b.h / 2 - C.y, o.b.x + o.b.w / 2 - C.x)));
  ring.sort((p, q) => p.a - q.a);
  const start = -Math.PI / 2 - Math.PI / 8;                  // the bed ends up at the top
  const pod = ring.findIndex((o) => o.k === "pod");
  ring.forEach((o, i) => { const ang = start + ((i - pod + ring.length) % ring.length) * (Math.PI * 2 / ring.length) + Math.PI / 8; place(o.k, o.b, C.x + Math.cos(ang) * RING * 1, C.y + Math.sin(ang) * RING * 0.95 * 1); });
  place("shield", BUILDINGS.shield, C.x, C.y - 6);
  place("solar", BUILDINGS.solar, C.x - 270 - 80, C.y - 20);          // the solar farm sits OUTSIDE the camp, to the west
  place("table", BUILDINGS.table, C.x - INNER, C.y + 40);
  const mats = { ghmat: "greenhouse", labmat: "lab" };
  SPOTS.forEach((s) => {
    const d = s.rect ? move[s.rect] : mats[s.id] ? move[mats[s.id]] : null;
    if (!d) return;
    s.x += d.x; s.y += d.y; s.tx += d.x; s.ty += d.y;
  });
  SPAWN.x += move.pod.x; SPAWN.y += move.pod.y;
  BASE.x = C.x; BASE.y = C.y;
})();

// One rover pad in each far-away region (press E to ride home)
ROVER_REGIONS.forEach((id) => {
  const p = padOf(id);
  SPOTS.push({ id: "rhome_" + id, kind: "press", region: id, x: p.x + 34, y: p.y + 10, r: 34, tx: p.x, ty: p.y - 30, icon: "🚙", label: "Ride home" });
});
// Your friend
SPOTS.push({ id: "sam", kind: "press", region: "far", x: 2960, y: 760, r: 36, tx: 2960, ty: 716, icon: "🧑‍🚀", label: "Talk to Sam" });

// ---- Places to discover (you find them just by walking up to them) ----
const DISCOVERY_SPOTS = [
  { id: "lander", x: 270, y: 1096, r: 44 },
  { id: "cave",   x: 2900, y: 1340, r: 130 },
  { id: "tranquility", x: 1650, y: 880, r: 96 },
  { id: "earth",  x: 1632, y: 628, r: 44 },
  { id: "crystalcrater", x: 2260, y: 200, r: 90 },
  { id: "alpha",  x: 2240, y: 760, r: 70 },
  { id: "southpole", x: 2230, y: 1270, r: 70 },
  { id: "northpole", x: 2930, y: 230, r: 70 }
];
DISCOVERY_SPOTS.forEach((d) => (d.region = regionAt(d.x, d.y)));

// ---- Resource areas ----
const ICE_CRATER = { x: 1440, y: 250, r: 118 };
const ROCK_FIELD = { x: 300, y: 280, r: 130 };
const CRYSTAL_CRATER = { x: 2260, y: 220, r: 110 };
const METAL_FIELD = { x: 2250, y: 790, r: 100 };

const ICE_NODES_AT = [[-60, -30], [-10, -62], [48, -40], [70, 10], [20, 40], [-44, 30], [-80, 20]];
const ROCK_NODES_AT = [[-90, -40], [-30, -70], [40, -60], [90, -10], [60, 50], [0, 20], [-70, 40], [20, 85], [-20, -10]];
const CRYSTAL_NODES_AT = [[-70, -20], [-20, -50], [40, -40], [75, 5], [30, 45], [-40, 35], [0, 0], [-85, 30]];
const METAL_NODES_AT = [[-60, -20], [-10, -45], [45, -25], [60, 25], [0, 35], [-50, 30], [10, -5]];


// ---- Solid things (you cannot walk through them) ----
const SOLIDS = [];
const CAVE_SPAWN = { x: 2740, y: 1440 };   // where you stand when you walk into the cave

function addRect(b, trim) {
  const t = trim || 0;
  SOLIDS.push({ kind: "rect", x: b.x + t, y: b.y + t, w: b.w - 2 * t, h: b.h - 2 * t });
}
addRect(BUILDINGS.pod); addRect(BUILDINGS.computer); addRect(BUILDINGS.life);
addRect(BUILDINGS.shield); addRect(BUILDINGS.greenhouse); addRect(BUILDINGS.lab);
addRect(BUILDINGS.table); addRect(BUILDINGS.solar, 4); addRect(BUILDINGS.launcher, 6);
// Eagle's descent stage at Tranquility Base
SOLIDS.push({ kind: "circle", x: 1630, y: 880, r: 15 });
// Sam's little camp
SOLIDS.push({ kind: "rect", x: 3010, y: 690, w: 60, h: 40 });

// Big boulders scattered around (made once, always the same)
const BOULDERS = [];
const BOULDER_REGIONS = ROVER_REGIONS.concat(POLE_REGIONS);
(function placeBoulders() {
  const rng = makeRng(777);
  const keepClear = [
    { x: 2760, y: 345, r: 80 },                     // Viking 1 lander spot on Mars (north region)
    { x: BASE.x, y: BASE.y, r: BASE.radius + 40 }, { x: ICE_CRATER.x, y: ICE_CRATER.y, r: 170 },
    { x: ROCK_FIELD.x, y: ROCK_FIELD.y, r: 170 }, { x: 270, y: 1096, r: 120 },
    { x: 1500, y: 1074, r: 130 }, { x: 1632, y: 628, r: 120 }, { x: SPAWN.x, y: SPAWN.y, r: 100 },
    { x: 1660, y: 890, r: 130 }
  ];
  ROVER_REGIONS.forEach((id) => {
    const p = padOf(id); keepClear.push({ x: p.x + 20, y: p.y, r: 90 });
  });
  GATES.forEach((gt) => { const R = REGIONS[gt.region]; keepClear.push({ x: gt.x, y: gt.side === "top" ? R.y + 100 : R.y + R.h - 100, r: 110 }); });
  [CRYSTAL_CRATER, METAL_FIELD].forEach((a) => keepClear.push({ x: a.x, y: a.y, r: a.r + 60 }));
  DISCOVERY_SPOTS.forEach((d) => keepClear.push({ x: d.x, y: d.y, r: d.r + 50 }));
  keepClear.push({ x: 2960, y: 740, r: 110 });
  let tries = 0;
  const wanted = 34 + 5 * 12;
  while (BOULDERS.length < wanted && tries++ < 6000) {
    // pick a region (home gets more boulders)
    const id = BOULDERS.length < 34 ? "home" : BOULDER_REGIONS[Math.floor(rng() * BOULDER_REGIONS.length)];
    const R = REGIONS[id];
    const x = R.x + RIM + 30 + rng() * (R.w - 2 * RIM - 60);
    const y = R.y + RIM + 30 + rng() * (R.h - 2 * RIM - 60);
    const r = 9 + rng() * 9;
    if (keepClear.some((k) => Math.hypot(x - k.x, y - k.y) < k.r)) continue;
    if (BOULDERS.some((b) => Math.hypot(x - b.x, y - b.y) < b.r + r + 40)) continue;
    BOULDERS.push({ x: x, y: y, r: r, shade: rng() });
    SOLIDS.push({ kind: "circle", x: x, y: y, r: r * 0.8 });
  }
})();

// ---- Collectable nodes (made fresh every morning) ----
function makeNodes() {
  const nodes = [];
  ICE_NODES_AT.forEach((o, i) => nodes.push({ type: "ice", x: ICE_CRATER.x + o[0], y: ICE_CRATER.y + o[1], alive: true, id: "ice" + i }));
  ROCK_NODES_AT.forEach((o, i) => nodes.push({ type: "rock", x: ROCK_FIELD.x + o[0], y: ROCK_FIELD.y + o[1], alive: true, id: "rock" + i }));
  CRYSTAL_NODES_AT.forEach((o, i) => nodes.push({ type: "crystal", x: CRYSTAL_CRATER.x + o[0], y: CRYSTAL_CRATER.y + o[1], alive: true, id: "cry" + i }));
  METAL_NODES_AT.forEach((o, i) => nodes.push({ type: "metal", x: METAL_FIELD.x + o[0], y: METAL_FIELD.y + o[1], alive: true, id: "met" + i }));
  return nodes;
}

// ---- Movement with collisions (the player is a small circle at their feet) ----
const PLAYER_R = 5;

function blocked(x, y) {
  const R = REGIONS[regionAt(x, y)];
  if (x < R.x + RIM + PLAYER_R || x > R.x + R.w - RIM - PLAYER_R) return true;
  const topOpen = !!gateAt(regionAt(x, y), x, "top"), botOpen = !!gateAt(regionAt(x, y), x, "bottom");
  if (y < R.y + RIM + PLAYER_R + 6 && !(topOpen && y > R.y + 6)) return true;
  if (y > R.y + R.h - RIM - PLAYER_R && !(botOpen && y < R.y + R.h - 6)) return true;
  for (const s of SOLIDS) {
    if (s.kind === "rect") {
      // Only the lower part of a building blocks you (so you can stand "behind" the roof edge)
      const top = s.y + s.h * 0.35;
      if (x > s.x - PLAYER_R && x < s.x + s.w + PLAYER_R && y > top - PLAYER_R && y < s.y + s.h + PLAYER_R) return true;
    } else if (Math.hypot(x - s.x, y - s.y) < s.r + PLAYER_R) return true;
  }
  return false;
}

// Move by (dx, dy), sliding along walls. Returns the new position.
function moveWithCollision(pos, dx, dy) {
  let nx = pos.x, ny = pos.y;
  if (!blocked(nx + dx, ny)) nx += dx;
  if (!blocked(nx, ny + dy)) ny += dy;
  return { x: nx, y: ny };
}

function insideBase(x, y) {
  return regionAt(x, y) === "home" && Math.hypot(x - BASE.x, y - BASE.y) < BASE.radius;
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// How far is the player from a usable thing? Buildings count as a whole box, so any side works.
function spotDistance(p, s) {
  if (!s.rect) return dist(p, s);
  const b = s.rect === "bay" ? BAY : BUILDINGS[s.rect];
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

if (typeof module !== "undefined") {
  module.exports = { VIEW, WORLD, REGIONS, REGION_IDS, ROVER_REGIONS, POLE_REGIONS, GATES, GAP_W, gateAt, CAVE_SPAWN, spotDistance, regionAt, padOf, spawnOf, BASE, BUILDINGS, BAY, SPOTS, DISCOVERY_SPOTS, ICE_CRATER, ROCK_FIELD,
    CRYSTAL_CRATER, METAL_FIELD, SPAWN, SOLIDS, BOULDERS, makeNodes, blocked, moveWithCollision, insideBase, dist, RIM };
}
