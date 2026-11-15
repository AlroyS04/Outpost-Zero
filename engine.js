// engine.js — the "brain" of the adventure.
// All the rules live here: power, air, radiation, food, time, sleeping, fainting.
// This file never draws anything and never looks at the keyboard.
// To make the game easier or harder, change the numbers in CONFIG.

const CONFIG = {
  days: 8,                 // length of a full mission (the short mission is 5)
  dayStartMin: 6 * 60,     // 6:00 AM, in minutes since midnight
  bedtimeOkMin: 16 * 60,   // you can go to bed from 4:00 PM
  sleepyMin: 22 * 60,      // Bolt says "go to bed" at 10:00 PM
  faintMin: 26 * 60,       // 2:00 AM: you faint if you are still awake
  minPerSec: 5,            // 5 game minutes pass every real second (a day is about 4 minutes)
  speed: 78,               // walking speed (pixels per second)
  maxRescues: 3,           // how many times Zorp can carry you home

  // The machines. "draw" = power used at each level (OFF, ON, BOOST).
  // "switchSec" = how many real seconds a change takes. Changes are NOT instant!
  systems: {
    life:       { name: "Air generator",     icon: "💨", draw: [0, 2],    switchSec: 10 },
    shield:     { name: "Radiation shield",  icon: "🛡️", draw: [0, 2, 4], switchSec: 15 },
    greenhouse: { name: "Greenhouse",        icon: "🌱", draw: [0, 2],    switchSec: 10 },
    lab:        { name: "Science lab",       icon: "🔬", draw: [0, 2],    switchSec: 10 }
  },

  // Power (the battery holds 0 to 100)
  batteryStart: 70,
  solarMax: 1.0,           // battery gained per second with perfectly clean panels
  powerUnit: 0.15,         // battery used per second for each unit of "draw"
  dustSlow: 0.55,          // fully dusty panels lose this much of their power
  dustPerSec: 0.001,       // how fast dust builds up
  dustStart: 0.35,
  nightDust: 0.28,         // extra dust that settles on the panels while you sleep
  dustWarn: 0.5,           // above this the panels show a RED warning
  idleOffSec: 4,           // seconds a machine can sit idle before it turns itself OFF
  blackoutRecover: 20,     // battery needed before the lights come back on

  // Air (the player's air goes 0 to 100)
  airOutside: -1.5,        // per second outside the base bubble
  airRefill: 10,           // per second inside the bubble when life support is ON
  airStale: -0.5,          // per second inside the bubble when life support is OFF

  // Energy (0 to 100)
  energyDrain: 0.18,       // per second
  eatEnergy: 40,

  // Radiation
  radK: 7,               // how fast radiation builds up (faster than before!)
  radSlowFrom: 30,         // above this much radiation the astronaut slows down
  radSlowMin: 0.5,         // slowest speed (as a fraction of normal) at 100 radiation
  radDecay: 0.4,           // how fast you recover when there is no flare
  shieldFactor: [1.0, 0.4, 0.12], // how much gets through at OFF, ON, BOOST
  flareDur: 30,            // seconds a flare lasts
  sirenLead: 20,           // seconds of warning from the siren
  flareMult: { X: 1.6, M: 1.0, other: 0.6 },   // (older numbers, kept for reference)
  solarFlaresPerMission: 3,   // at least this many flares in a 5 day mission (more in longer ones)
  alertChance: 0.9,        // chance Earth calls ahead of a flare
  callLeadMin: 200,        // game minutes before a flare when Earth calls (about 40 seconds)        // chance Earth forecasts a flare ahead of time

  // Food and water
  plantSec: 100,           // seconds for a plant to ripen
  plantWater: 0.5,         // water a plant uses while growing
  waterMax: 6,
  iceWater: 2,             // water from one ice
  iceCarry: 4,
  rockCarry: 4,

  // Science
  labSec: 10,              // seconds to study one rock
  rockScience: 10,
  missionScience: 30,
  discoveryScience: 20,

  // The rover story
  rover: {
    partsNeeded: 2,        // research packages (and rover parts) needed
    samplesPerPackage: 2,  // studied samples in each package
    deliverSec: 45,        // seconds Earth needs to build and send a part
    assembleSec: 4,        // seconds to put a part on the rover
    travelBattery: 8,      // battery used by each trip
    travelMin: 40,         // game minutes a trip takes
    minBattery: 15,        // battery needed to start a trip
    tripAir: 40,           // air you get back on a trip
    lastTripMin: 20 * 60   // no trips after 8:00 PM
  },
  sampleScience: { rock: 10, metal: 15, crystal: 20 },
  reunionScience: 100,
  minCommsBattery: 20,     // below this you cannot call Earth
  maxActiveMissions: 2,    // never more than this many missions at once
  cavePower: 20,           // battery from Zorp's power crystal
  lowEnergy: 45, lowAir: 45, lowBattery: 45, lowRad: 40,  // when a bar turns yellow, Dr. Nova explains (first time only)

  nightSec: 60,            // how long "overnight" runs in the simulation
  star2: 250,
  star3: 450
};

// Two worlds to live on. Mars has weaker sunshine, big dust storms, a long radio delay and gentler gravity.
const PLANETS = {
  moon: { id: "moon", name: "Moon", solar: 1.0,  dust: 1.0, nightDust: 0.28, deliverSec: 45, jump: 1.0,  radAtmos: 1.0,  storms: false, delayText: "1.3 seconds" },
  mars: { id: "mars", name: "Mars", solar: 0.62, dust: 1.3, nightDust: 0.22, deliverSec: 80, jump: 0.55, radAtmos: 0.85, storms: true,  delayText: "about 13 minutes (between 5 and 20)" }
};
function planetOf(g) { return PLANETS[(g && g.planet) || "moon"] || PLANETS.moon; }

const SYS_KEYS = ["life", "shield", "greenhouse", "lab"];

// -----------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(list, rng) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function clamp(n, low, high) { return Math.max(low, Math.min(high, n)); }
function range(from, to) { const out = []; for (let i = from; i <= to; i++) out.push(i); return out; }

function flareLetter(classType) {
  const letter = String(classType || "").trim().charAt(0).toUpperCase();
  return letter === "X" || letter === "M" ? letter : "other";
}

// Format minutes-since-midnight as a clock, e.g. 14:30 -> "2:30 PM". Past midnight wraps.
function clockText(min) {
  const m = Math.floor(min) % (24 * 60);
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 && h < 24 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return h + ":" + (mm < 10 ? "0" : "") + mm + " " + ampm;
}

// -----------------------------------------------------------------------
// Making a new game
// -----------------------------------------------------------------------
// How strong a flare is, from 0 (tiny C-class) to 1 (huge X-class). Drives the screen effects and the dose.
function flareIntensity(classType) {
  const s = String(classType || "").trim().toUpperCase();
  const L = s.charAt(0), n = Math.min(parseFloat(s.slice(1)) || 1, 30);
  if (L === "X") return Math.min(1, 0.68 + 0.035 * n);
  if (L === "M") return 0.32 + 0.032 * Math.min(n, 9);
  return 0.08 + 0.02 * Math.min(n, 9);
}
function flareTier(I) { return I < 0.3 ? "weak" : I < 0.65 ? "medium" : "strong"; }
// How much radiation gets INSIDE the shield. A weak storm barely leaks. A strong storm leaks a lot, unless BOOST is on.
function shieldLeak(level, I) {
  if (level <= 0) return 1;
  if (level === 1) return 0.05 + 0.55 * Math.pow(I, 1.5);
  return 0.02 + 0.08 * I;
}
// The astronaut moves slower when they have collected more than 30 radiation
function radSlow(g) {
  const r = g.player.rad;
  if (r <= CONFIG.radSlowFrom) return 1;
  return Math.max(CONFIG.radSlowMin, 1 - (1 - CONFIG.radSlowMin) * (r - CONFIG.radSlowFrom) / (100 - CONFIG.radSlowFrom));
}

// Real flares (or the archive) mixed with "typical" ones so every game has weak, medium and strong storms.
function typicalFlare(tier, rng) {
  const cls = tier === "weak" ? "C" + (2 + Math.floor(rng() * 7)) + ".0" : tier === "medium" ? "M" + (1 + Math.floor(rng() * 8)) + ".0" : "X" + (1 + Math.floor(rng() * 5)) + ".0";
  return { id: "typical-" + cls, date: "", classType: cls, region: "typical", source: "typical", typical: true };
}

function buildFlareSchedule(rng, flares, days) {
  const endless = !isFinite(days);
  const horizon = endless ? 40 : days;
  const count = endless ? 14 : Math.max(1, Math.min(horizon - 1, Math.max(3, Math.ceil(horizon * 0.6))));
  // days: any day after the first, random, not on top of each other if there is room
  const pool = range(2, horizon);
  let picked = [];
  for (let attempt = 0; attempt < 60 && picked.length < count; attempt++) {
    picked = [];
    for (const d of shuffle(pool, rng)) {
      if (picked.length >= count) break;
      if (picked.every((o) => Math.abs(o - d) > 1)) picked.push(d);
    }
  }
  if (picked.length < count) picked = shuffle(pool, rng).slice(0, count);
  picked.sort((a, b) => a - b);
  // strengths: always one weak, one medium and one strong, the rest random; the order is random
  const tiers = ["weak", "medium", "strong"];
  while (tiers.length < count) tiers.push(["weak", "medium", "strong"][Math.floor(rng() * 3)]);
  const order = shuffle(tiers.slice(0, count), rng);
  const used = {};
  return picked.map((day, i) => {
    const want = order[i];
    const sh = shuffle(flares, rng), okf = (f) => !used[f.id] && flareTier(flareIntensity(f.classType)) === want;
    let def = sh.find((f) => f.source === "live" && okf(f)) || sh.find(okf);          // real, live NASA flares come first
    if (!def) def = typicalFlare(want, rng);
    used[def.id] = true;
    const I = flareIntensity(def.classType);
    return {
      day: day,
      startMin: 11 * 60 + Math.floor(rng() * 7 * 60),   // between 11:00 AM and 6:00 PM
      id: def.id, date: def.date, classType: def.classType, region: def.region,
      source: def.source || "archived", typical: !!def.typical,
      I: I, tier: flareTier(I), mult: 0.5 + 1.3 * I,
      alerted: rng() < CONFIG.alertChance,
      sirened: false, started: false, called: false
    };
  });
}

function newGame(seed, flares, days, opts) {
  opts = opts || {};
  const rng = makeRng(seed);
  const total = days === 0 || days === Infinity ? Infinity : (days || CONFIG.days);
  const sys = {};
  SYS_KEYS.forEach((k) => {
    sys[k] = { level: 0, target: 0, switching: false, progress: 0 };
  });
  sys.shield.level = 1; sys.shield.target = 1;
  // In the tutorial the air generator starts OFF so the player learns why it matters
  if (!opts.tutorial) { sys.life.level = 1; sys.life.target = 1; }

  const g = {
    seed: seed, days: total, endless: total === Infinity, day: 1, min: CONFIG.dayStartMin,
    battery: CONFIG.batteryStart, dust: CONFIG.dustStart, blackout: false,
    water: 0, food: 1, science: 0,
    plots: [0, 0, 0, 0],
    labQueue: [], labProgress: 0, studied: 0,
    rover: { sent: 0, delivered: 0, assembled: 0, built: false, incoming: [], location: "home", trips: 0 },
    reunited: false,
    systems: sys,
    player: { air: 100, energy: 100, rad: 0, ice: 0, rocks: 0, metal: 0, crystal: 0, fed: false },
    planet: opts.planet === "mars" ? "mars" : "moon",
    schedule: buildFlareSchedule(rng, flares, total),
    storms: [],
    flare: null,                // the flare happening right now
    siren: 0,                   // seconds of siren left
    missions: [], missionsKnown: false, weatherChecked: false, mq: { n: 0, done: {} },
    tutorial: opts.tutorial ? { air: false, ice: false, solar: false } : null,
    crystalUnlocked: false, zorpMet: false, coachShown: {}, bedWarnDay: 0, launches: 0,
    discovered: {},
    incidents: [],              // things that went wrong: { type, day }
    flaresSurvived: [],
    rescues: 0, status: "playing", // "playing", "won", "evacuated", "timeup"
    hintsShown: {}, hintCool: 4, hintTimer: 0,
    stats: { analyzed: 0, harvested: 0, cleaned: 0, iceDelivered: 0, faints: [] },
    events: [], clock: 0
  };
  // Quick demo: jump straight to a strong flare on day 2
  if (opts.demo) {
    g.schedule.sort((a, b) => b.I - a.I);
    const f = g.schedule[0]; f.day = 2; f.startMin = 13 * 60; f.alerted = true;
    g.schedule = [f];
    g.day = 2; g.min = 9 * 60 + 30; g.battery = 85; g.dust = 0.1; g.clock = 12;
    g.systems.life.level = 1; g.systems.life.target = 1; g.tutorial = null;
    g.mq.done.ice = true; g.mq.done.harvest = true;
    // Judge demo: the rover is already built and every fast-travel place is open
    const parts = CONFIG.rover.partsNeeded;
    g.demo = true; g.rover.sent = parts; g.rover.delivered = parts; g.rover.assembled = parts; g.rover.built = true;
    g.crystalUnlocked = true; g.zorpMet = true;
  }
  // Mars: a few dust storms on random days (never the first day)
  if (g.planet === "mars") {
    const lim = isFinite(total) ? total : 40;
    for (let d = 2; d <= lim; d++) if (rng() < 0.3) g.storms.push(d);
    if (!g.storms.length && lim >= 3) g.storms.push(3);
    g.stormSev = {};
    g.storms.forEach((d) => { g.stormSev[d] = 0.35 + 0.65 * rng(); });   // how severe each storm is (0.35 mild to 1 huge)
  }
  assignMissions(g);
  return g;
}

// Events are little messages the screen code reads (sounds, popups, etc.).
function ev(g, type, data) { g.events.push(Object.assign({ t: type }, data || {})); }
function incident(g, type) {
  if (!g.incidents.some((i) => i.type === type && i.day === g.day)) {
    g.incidents.push({ type: type, day: g.day });
  }
}

// Bolt's hints: each one is shown once (unless "repeat" seconds is given).
function hint(g, id, repeat) {
  const last = g.hintsShown[id];
  if (last !== undefined && (!repeat || g.clock - last < repeat)) return false;
  if (g.hintCool > 0 && id !== "siren" && id !== "blackout") return false;
  g.hintsShown[id] = g.clock;
  g.hintCool = 6;
  ev(g, "hint", { id: id });
  return true;
}

// -----------------------------------------------------------------------
// Missions
// -----------------------------------------------------------------------
// Earth never gives you more than 2 missions at a time (CONFIG.maxActiveMissions).
// When you report one, Earth adds the next. The order copies real priorities:
// water first, then food, then science, then the rover.
// Every place on the Moon you can discover (used by the 5 and 7 day missions: find them all before Sam!)
const EXPLORE_ORDER = ["cave", "zorp", "tranquility", "earth", "lander", "crystalcrater", "alpha", "southpole", "northpole"];
// A jump fact appears only every 10 to 15 jumps (random), and at most 4 per day.
// `st` is a small state object {jumps, next, day, today}; returns true when a fact should be shown.
function jumpFactStep(st, day, rnd) {
  rnd = rnd || Math.random;
  if (st.next == null) st.next = 10 + Math.floor(rnd() * 6);
  if (st.day !== day) { st.day = day; st.today = 0; }
  st.jumps = (st.jumps || 0) + 1;
  if (st.jumps < st.next) return false;
  st.jumps = 0; st.next = 10 + Math.floor(rnd() * 6);
  if (st.today >= 4) return false;
  st.today++;
  return true;
}
function discoveredCount(g) { return EXPLORE_ORDER.filter((id) => g.discovered[id]).length; }
function allDiscovered(g) { return discoveredCount(g) >= EXPLORE_ORDER.length; }
// May the player go to Sam now? Endless mode: always. Other modes: only after finding every place.
function mayMeetCrew(g) { return g.endless || g.demo || allDiscovered(g); }

function storyNext(g) {
  const R = g.rover, C = CONFIG.rover;
  if (!g.mq.done.ice) return { type: "ice", n: 2 };            // 1) water: ice for the greenhouse
  if (!g.mq.done.harvest) return { type: "harvest", n: 1 };    // 2) food
  if (R.built) {
    if (g.reunited) return null;
    if (!mayMeetCrew(g)) {                                       // 5a) explore every place first
      const id = EXPLORE_ORDER.find((k) => !g.discovered[k] && fillerOk(g, { type: "explore", loc: k }));
      return id ? { type: "explore", loc: id, n: 1 } : null;
    }
    return { type: "meet", n: 1 };                                // 5b) go and find Sam
  }
  if (R.delivered > R.assembled) return { type: "assemble", n: 1 };
  if (R.sent < C.partsNeeded) {                                // 3) science, 4) rover parts
    if (g.studied >= C.samplesPerPackage) return { type: "send", n: 1 };
    return { type: "study", n: Math.max(1, C.samplesPerPackage - g.studied) };
  }
  return null;
}

function fillerOk(g, t) {
  const info = t.type === "explore" ? DISCOVERIES[t.loc] : null;
  if (info) {
    if (g.discovered[t.loc]) return false;
    if (info.rover && !g.rover.built) return false;
    if (t.loc === "crystalcrater" && !g.crystalUnlocked) return false;
  }
  if ((t.type === "metal" || t.type === "crystal") && !g.rover.built) return false;
  if (t.type === "crystal" && !g.crystalUnlocked) return false;
  return true;
}

function pickMission(g, active) {
  const dup = (t) => active.some((a) => a.type === t.type && a.loc === t.loc);
  // The tutorial day: clean the panels is the second mission
  const s = storyNext(g);
  if (s && !dup(s) && !(s.type === "study" && active.some((a) => a.type === "study"))) return Object.assign({}, s);
  const fill = MISSION_FILLERS;
  for (let i = 0; i < fill.length; i++) {
    const t = fill[(g.mq.n + i) % fill.length];
    if (dup(t) || !fillerOk(g, t)) continue;
    g.mq.n = (g.mq.n + i + 1) % fill.length;
    return Object.assign({}, t);
  }
  return null;
}

function topUp(g) {
  g.missions = g.missions.filter((m) => !m.claimed);
  // A flare day gets a "stay safe" mission when there is a free slot
  const flareToday = g.schedule.some((f) => f.day === g.day && !f.started);
  if (flareToday && g.missions.length < CONFIG.maxActiveMissions && !g.missions.some((m) => m.type === "flare")) {
    g.missions.push({ type: "flare", n: 1, count: 0, done: false, claimed: false });
  }
  while (g.missions.length < CONFIG.maxActiveMissions) {
    const m = pickMission(g, g.missions);
    if (!m) break;
    g.missions.push(Object.assign({ count: 0, done: false, claimed: false }, m));
  }
}
function assignMissions(g) { topUp(g); }

function progress(g, type, amount, loc) {
  g.missions.forEach((m) => {
    if (m.done || m.type !== type) return;
    if (type === "explore" && m.loc !== loc) return;
    m.count += amount;
    if (m.count >= m.n) { m.count = m.n; m.done = true; ev(g, "mission_done", { type: type }); }
  });
}

function claimMission(g, index) {
  const m = g.missions[index];
  if (!m || !m.done || m.claimed) return false;
  m.claimed = true;
  g.mq.done[m.type] = true;
  if (m.type === "ice" && g.systems.greenhouse.level === 0 && g.food <= 3) ev(g, "hint", { id: "gh_ask" });   // next step: switch the greenhouse ON
  g.science += CONFIG.missionScience;
  ev(g, "reward", { amount: CONFIG.missionScience });
  topUp(g);                      // Earth adds the next mission right away
  if (g.missions.length) ev(g, "new_mission", {});
  return true;
}

function unclaimedCount(g) { return g.missions.filter((m) => m.done && !m.claimed).length; }

// -----------------------------------------------------------------------
// Machines
// -----------------------------------------------------------------------
function effectiveLevel(g, key) {
  return g.blackout ? 0 : g.systems[key].level;
}

function powerDraw(g) {
  let units = 0;
  SYS_KEYS.forEach((k) => { units += CONFIG.systems[k].draw[effectiveLevel(g, k)]; });
  return units;
}

// How strong the dust storm is right now: 0 (none) to 1 (huge). It builds up, peaks, then fades.
function stormLevel(g) {
  if (g.planet !== "mars" || g.storms.indexOf(g.day) < 0 || g.min < 9 * 60 || g.min >= 17 * 60) return 0;
  const sev = (g.stormSev && g.stormSev[g.day]) || 0.7;
  const t = g.min - 9 * 60, left = 17 * 60 - g.min;
  return sev * Math.min(1, t / 90, left / 90);
}
function dustStormNow(g) { return stormLevel(g) > 0.02; }
function solarOutput(g) {
  return CONFIG.solarMax * planetOf(g).solar * (1 - 0.65 * stormLevel(g)) * (1 - CONFIG.dustSlow * g.dust);
}

// Ask a machine to change level. It does not change right away!
function requestSwitch(g, key, level) {
  const s = g.systems[key];
  if (s.switching) { hint(g, "busy", 5); return { ok: false, reason: "busy" }; }
  if (g.blackout || g.battery <= 0) { hint(g, "no_power", 5); return { ok: false, reason: "no_power" }; }
  if (s.level === level) return { ok: false, reason: "same" };
  s.target = level; s.switching = true; s.progress = 0;
  ev(g, "switch_start", { key: key, level: level });
  if (key === "shield" && level === 2) hint(g, "shield_boost");
  return { ok: true };
}

// A "life" is one of Zorp's rescues. Fainting or running out of power uses one.
function loseLife(g, reason) {
  g.rescues++;
  g.stats.faints.push({ day: g.day, reason: reason });
  incident(g, "faint_" + reason);
  if (g.rescues > CONFIG.maxRescues) {
    g.status = "evacuated";
    ev(g, "evacuated", { reason: reason });
    return false;
  }
  return true;
}

// Dr. Nova explains a problem the first time it happens (once per kind).
function coach(g, id) {
  if (g.coachShown[id]) return false;
  g.coachShown[id] = true;
  ev(g, "coach", { id: id });
  return true;
}

function powerStep(g, dt) {
  const gain = solarOutput(g) * dt;
  const use = powerDraw(g) * CONFIG.powerUnit * dt;
  g.battery = clamp(g.battery + gain - use, 0, 100);
  g.dust = clamp(g.dust + CONFIG.dustPerSec * planetOf(g).dust * (1 + 2 * stormLevel(g)) * dt, 0, 1);

  if (!g.blackout && g.battery <= 0) {
    g.blackout = true;
    SYS_KEYS.forEach((k) => {
      const s = g.systems[k];
      s.level = 0; s.target = 0; s.switching = false; s.progress = 0;
    });
    incident(g, "blackout");
    ev(g, "blackout", {});
    hint(g, "blackout");
    coach(g, "blackout");
    // Running out of power costs one of Zorp's rescues, just like fainting
    if (loseLife(g, "power")) ev(g, "zorp_power", { left: Math.max(0, CONFIG.maxRescues - g.rescues) });
  } else if (g.blackout && g.battery >= CONFIG.blackoutRecover) {
    g.blackout = false;
    ev(g, "power_back", {});
  }
}

function plantsAndLab(g, dt) {
  // Greenhouse: plants grow only when the greenhouse is ON and there is water.
  if (effectiveLevel(g, "greenhouse") > 0 && g.water > 0) {
    for (let i = 0; i < g.plots.length; i++) {
      if (g.plots[i] < 1) {
        const grow = dt / CONFIG.plantSec;
        g.plots[i] = Math.min(1, g.plots[i] + grow);
        if (g.plots[i] >= 1) { ev(g, "ripe", {}); coach(g, "apples"); }
        g.water = Math.max(0, g.water - CONFIG.plantWater * grow);
      }
    }
  }
  // Lab: studies queued samples only when the lab is ON.
  if (effectiveLevel(g, "lab") > 0 && g.labQueue.length > 0) {
    g.labProgress += dt / CONFIG.labSec;
    if (g.labProgress >= 1) {
      g.labProgress = 0;
      const type = g.labQueue.shift();
      const sci = CONFIG.sampleScience[type] || CONFIG.rockScience;
      g.science += sci;
      g.studied++;
      g.stats.analyzed++;
      ev(g, "analyzed", { type: type, sci: sci });
      progress(g, type, 1);
      progress(g, "study", 1);
      if (researchReady(g)) hint(g, "send_ready", 120);
    }
  }
  // Machines with nothing to do turn themselves OFF to save power
  g.idle = g.idle || { lab: 0, greenhouse: 0 };
  const growing = g.water > 0 && g.plots.some((p) => p < 1);
  [["lab", g.labQueue.length === 0], ["greenhouse", !growing]].forEach((o) => {
    const k = o[0], s = g.systems[k];
    if (s.level > 0 && !s.switching && o[1] && !g.blackout) {
      g.idle[k] += dt;
      if (g.idle[k] >= CONFIG.idleOffSec) {
        s.level = 0; s.target = 0; g.idle[k] = 0;
        ev(g, "auto_off", { key: k });
        coach(g, "autooff");
      }
    } else g.idle[k] = 0;
  });
}

// Rover parts that Earth has sent arrive after a delay.
function deliverParts(g) {
  const R = g.rover;
  for (let i = R.incoming.length - 1; i >= 0; i--) {
    if (g.clock >= R.incoming[i].eta) {
      R.incoming.splice(i, 1);
      R.delivered++;
      ev(g, "part_arrived", { n: R.delivered });
      hint(g, "part_arrived", 30);
    }
  }
}

// -----------------------------------------------------------------------
// The main step: called many times a second by the game loop.
// zone = { inBase: true/false, moving: true/false }
// -----------------------------------------------------------------------
function step(g, dt, zone) {
  if (g.status !== "playing") return;
  zone = zone || { inBase: true, moving: false };
  g.clock += dt;
  g.min += dt * CONFIG.minPerSec;
  if (g.hintCool > 0) g.hintCool -= dt;

  // Machines finishing their switch
  SYS_KEYS.forEach((k) => {
    const s = g.systems[k];
    if (!s.switching) return;
    s.progress += dt / CONFIG.systems[k].switchSec;
    if (s.progress >= 1) {
      s.level = s.target; s.switching = false; s.progress = 0;
      ev(g, "switched", { key: k, level: s.level });
      if (k === "life" && s.level > 0) tutorialDone(g, "air");
    }
  });

  powerStep(g, dt);
  plantsAndLab(g, dt);
  deliverParts(g);
  if (dustStormNow(g)) coach(g, "storm");

  const p = g.player;
  const lifeOn = effectiveLevel(g, "life") > 0;

  // Air
  if (zone.inBase) {
    if (lifeOn) p.air = Math.min(100, p.air + CONFIG.airRefill * dt);
    else { p.air += CONFIG.airStale * dt; if (p.air < 60) { incident(g, "stale"); hint(g, "stale_air", 40); } }
  } else if (zone.sealed) {
    /* driving the sealed rover: the air in the cabin lasts */
  } else {
    p.air += CONFIG.airOutside * dt;
    if (p.air < 30) hint(g, "low_air", 30);
  }
  p.air = Math.max(0, p.air);

  // Energy
  p.energy = clamp(p.energy - CONFIG.energyDrain * dt * (zone.moving ? 1.3 : 1), 0, 100);
  if (p.energy < 25) hint(g, p.energy <= 0 ? "tired" : (g.food > 0 ? "hungry" : "no_food"), 60);

  // Flares: forecast, siren, radiation
  const f = g.schedule.find((x) => x.day === g.day && !x.started);
  if (f) {
    const sirenAt = f.startMin - CONFIG.sirenLead * CONFIG.minPerSec;
    if (!f.sirened && g.min >= sirenAt) {
      f.sirened = true; g.siren = CONFIG.sirenLead;
      ev(g, "siren", { flare: f });
      hint(g, "siren");
    }
    // Earth phones you a little before a flare, so you can get ready
    if (f.alerted && !f.called && g.min >= f.startMin - CONFIG.callLeadMin) {
      f.called = true;
      ev(g, "flare_call", { flare: f });
    }
    if (g.min >= f.startMin) {
      f.started = true;
      g.flare = { def: f, left: CONFIG.flareDur, maxRad: 0 };
      ev(g, "flare_start", { flare: f });
    }
  }
  if (g.siren > 0) g.siren -= dt;

  if (g.flare) {
    // Inside the base bubble the shield helps. Inside a Moon cave the rock itself shelters you.
    const I = g.flare.def.I !== undefined ? g.flare.def.I : flareIntensity(g.flare.def.classType);
    const factor = zone.sheltered ? shieldLeak(2, I) : zone.inBase ? shieldLeak(effectiveLevel(g, "shield"), I) : zone.sealed ? 0.5 : 1.0;
    g.leak = factor;
    p.rad += CONFIG.radK * (g.flare.def.mult || 1) * planetOf(g).radAtmos * factor * dt;
    g.flare.maxRad = Math.max(g.flare.maxRad, p.rad);
    g.flare.left -= dt;
    if (g.flare.left <= 0) {
      const safe = g.flare.maxRad < 60;
      g.flaresSurvived.push({ def: g.flare.def, maxRad: Math.round(g.flare.maxRad), shieldLevel: effectiveLevel(g, "shield"), inBase: zone.inBase });
      if (safe) progress(g, "flare", 1);
      if (g.flare.maxRad >= 60) incident(g, "radiation");
      ev(g, "flare_end", { safe: safe });
      g.flare = null; g.leak = 0;
    }
  } else {
    p.rad = Math.max(0, p.rad - CONFIG.radDecay * dt);
  }

  // First time a bar turns yellow, Dr. Nova explains why and what to do
  if (g.coachCool > 0) g.coachCool -= dt;
  else if (g.clock > 3) {
    let id = null;
    if (p.rad >= 3 && !g.coachShown.radbadge && !zone.sheltered) id = "radbadge";   // first time radiation builds up: relate it to the radiation badge
    else if (g.dust > CONFIG.dustWarn) id = "dust";
    else if (p.energy < CONFIG.lowEnergy) id = "energy";
    else if (p.air < CONFIG.lowAir) id = zone.inBase ? "air_in" : "air_out";
    else if (p.rad >= CONFIG.lowRad) id = "rad";
    else if (!g.blackout && g.battery < CONFIG.lowBattery) id = "battery";
    else if (!g.blackout && g.clock > 10 && powerReport(g).net < 0) id = "netneg";
    if (id && coach(g, id)) g.coachCool = 3;
  }

  // Gentle reminders
  if (g.battery < 25 && !g.blackout) hint(g, "low_battery", 90);
  else if (g.dust > 0.7 && g.battery < 50) hint(g, "dusty", 120);
  if (g.min >= CONFIG.sleepyMin) hint(g, "sleepy", 120);

  // The ways a day can go wrong: you faint!
  if (p.air <= 0) return faint(g, "air");
  if (p.rad >= 100) return faint(g, "radiation");
  if (g.min >= CONFIG.faintMin) return faint(g, "late");
  return null;
}

// -----------------------------------------------------------------------
// Things the player does
// -----------------------------------------------------------------------
function canWork(g) {
  if (g.player.energy <= 0) { hint(g, "tired", 10); return false; }
  return true;
}
function spend(g, amount) { g.player.energy = Math.max(0, g.player.energy - amount); }

function mineIce(g) {
  if (!canWork(g)) return false;
  if (g.player.ice >= CONFIG.iceCarry) { hint(g, "bag_full", 5); return false; }
  g.player.ice++; spend(g, 3); return true;
}
function carried(g) { return g.player.rocks + g.player.metal + g.player.crystal; }
// type is "rock", "metal" or "crystal"
function collectSample(g, type) {
  if (!canWork(g)) return false;
  if (carried(g) >= CONFIG.rockCarry) { hint(g, "bag_full", 5); return false; }
  const key = type === "rock" ? "rocks" : type;
  g.player[key]++; spend(g, 3); return true;
}
function collectRock(g) { return collectSample(g, "rock"); }
function pourIce(g) {
  const n = g.player.ice;
  if (n <= 0) return 0;
  g.water = Math.min(CONFIG.waterMax, g.water + n * CONFIG.iceWater);
  g.player.ice = 0; g.stats.iceDelivered += n;
  progress(g, "ice", n);
  tutorialDone(g, "ice");
  ev(g, "poured", { n: n });
  if (g.systems.greenhouse.level === 0 && !g.systems.greenhouse.switching && g.food <= 3) hint(g, "gh_off");
  return n;
}
function harvest(g) {
  if (!canWork(g)) return 0;
  let n = 0;
  for (let i = 0; i < g.plots.length; i++) if (g.plots[i] >= 1) { g.plots[i] = 0; n++; }
  if (n > 0) { g.food += n; g.stats.harvested += n; spend(g, 2); progress(g, "harvest", n); }
  return n;
}
function eat(g) {
  if (g.food <= 0) { hint(g, "no_food", 10); return false; }
  g.food--; g.player.fed = true;
  g.player.energy = Math.min(100, g.player.energy + CONFIG.eatEnergy);
  return true;
}
function cleanPanels(g) {
  if (!canWork(g)) return false;
  g.dust = 0; spend(g, 10); g.stats.cleaned++;
  progress(g, "clean", 1);
  tutorialDone(g, "solar");
  return true;
}
function depositSamples(g) {
  const p = g.player;
  const n = p.rocks + p.metal + p.crystal;
  if (n <= 0) return 0;
  for (let i = 0; i < p.rocks; i++) g.labQueue.push("rock");
  for (let i = 0; i < p.metal; i++) g.labQueue.push("metal");
  for (let i = 0; i < p.crystal; i++) g.labQueue.push("crystal");
  p.rocks = 0; p.metal = 0; p.crystal = 0;
  if (effectiveLevel(g, "lab") === 0) hint(g, "lab_off");
  return n;
}
function depositRocks(g) { return depositSamples(g); }
function discover(g, id) {
  if (g.discovered[id]) return false;
  g.discovered[id] = true;
  g.science += CONFIG.discoveryScience;
  progress(g, "explore", 1, id);
  ev(g, "discovered", { id: id });
  return true;
}

// Zorp's gift (you talk to Zorp inside the Moon cave): a power crystal and the way to Crystal Crater.
function zorpGift(g) {
  if (g.zorpMet) return false;
  g.zorpMet = true; g.crystalUnlocked = true;
  g.battery = Math.min(100, g.battery + CONFIG.cavePower);
  g.science += CONFIG.discoveryScience;
  ev(g, "zorp_gift", {});
  return true;
}

// The tutorial checks off its three lessons as you do them: air, food (ice), power (clean panels)
function tutorialDone(g, step) {
  if (!g.tutorial || g.tutorial[step]) return;
  g.tutorial[step] = true;
  ev(g, "tutorial_step", { step: step });
}

// The bed: first you get a reminder to brush your panels (like brushing your teeth)
function sleepAdvice(g) {
  if (g.dust > 0.12 && g.bedWarnDay !== g.day) { g.bedWarnDay = g.day; return { cleanFirst: true }; }
  return { cleanFirst: false };
}
function flareThreat(g) {
  if (g.flare) return g.flare.def;
  const f = g.schedule.find((x) => x.day === g.day && !x.started && x.called);
  return f || null;
}
function needBoost(g) {
  if (!flareThreat(g)) return false;
  const s = g.systems.shield;
  return !(s.level === 2 || (s.switching && s.target === 2));
}
function openComputer(g) {
  const firstTime = !g.visitedToday;
  g.visitedToday = true;
  g.missionsKnown = true;
  return firstTime;
}

// -----------------------------------------------------------------------
// Earth link, research and the rover
// -----------------------------------------------------------------------
// You cannot call Earth while the base has no power.
function commsOk(g) { return !g.blackout && g.battery >= 1; }

function researchReady(g) {
  return g.studied >= CONFIG.rover.samplesPerPackage && g.rover.sent < CONFIG.rover.partsNeeded;
}

function sendResearch(g) {
  if (!commsOk(g)) { hint(g, "no_comms", 5); return { ok: false, reason: "no_comms" }; }
  if (!researchReady(g)) return { ok: false, reason: "not_ready" };
  g.studied -= CONFIG.rover.samplesPerPackage;
  g.rover.sent++;
  g.rover.incoming.push({ eta: g.clock + planetOf(g).deliverSec });
  progress(g, "send", 1);
  ev(g, "research_sent", { n: g.rover.sent });
  return { ok: true };
}

// What the Launcher sign shows: samples studied for the next package (never more than 2/2), or 2/2 once all parts are sent
function launcherInfo(g) {
  const need = CONFIG.rover.samplesPerPackage, parts = CONFIG.rover.partsNeeded;
  if (g.rover.sent >= parts) return { n: need, need: need, done: true, ready: false, label: need + "/" + need };
  const n = Math.min(g.studied, need);
  return { n: n, need: need, done: false, ready: n >= need, label: n + "/" + need };
}

function partWaiting(g) { return g.rover.delivered > g.rover.assembled; }

function assemblePart(g) {
  const R = g.rover;
  if (!partWaiting(g)) return false;
  if (!canWork(g)) return false;
  R.assembled++; spend(g, 5);
  progress(g, "assemble", 1);
  if (R.assembled >= CONFIG.rover.partsNeeded) { R.built = true; ev(g, "rover_ready", {}); hint(g, "rover_ready"); }
  else ev(g, "part_assembled", { n: R.assembled });
  return true;
}

// Fast travel. "dest" is a destination id from data.js, or "home".
function roverTravel(g, dest) {
  const R = g.rover, C = CONFIG.rover;
  if (!R.built) { hint(g, "need_rover", 8); return { ok: false, reason: "no_rover" }; }
  if (dest !== "home" && (g.flare || g.siren > 0)) { hint(g, "trip_flare", 8); return { ok: false, reason: "flare" }; }   // going HOME is always allowed
  if (dest === "far" && !mayMeetCrew(g)) { hint(g, "explore_first", 8); return { ok: false, reason: "explore_first" }; }
  if (dest === "crater" && !g.crystalUnlocked) { hint(g, "crater_locked", 8); return { ok: false, reason: "locked" }; }
  if (dest !== "home") {
    if (g.battery < C.minBattery || g.blackout) { hint(g, "trip_power", 8); return { ok: false, reason: "power" }; }
    if (g.min + C.travelMin > C.lastTripMin) { hint(g, "too_late", 8); return { ok: false, reason: "late" }; }
  }
  g.battery = Math.max(dest === "home" ? 1 : 0, g.battery - C.travelBattery);
  g.min += C.travelMin;
  g.player.air = Math.min(100, g.player.air + C.tripAir);
  R.location = dest; R.trips++;
  g.visited = g.visited || {}; g.visited[dest] = true;
  ev(g, "trip", { dest: dest });
  return { ok: true };
}

function meetCrew(g) {
  if (g.rover.location !== "far" || g.reunited || !mayMeetCrew(g)) return false;
  g.reunited = true; g.science += CONFIG.reunionScience;
  progress(g, "meet", 1);
  if (!g.endless) g.status = "won";                // endless mode keeps going: explore as long as you like
  ev(g, "reunited", {});
  return true;
}

// Power numbers for the screen. "Per minute" means per real minute of playing.
function powerReport(g) {
  const gain = solarOutput(g) * 60;
  const use = powerDraw(g) * CONFIG.powerUnit * 60;
  const net = gain - use;
  return { battery: Math.round(g.battery), gain: Math.round(gain), use: Math.round(use), net: Math.round(net),
           minsLeft: net < 0 ? g.battery / -net : Infinity };
}
// What the net power per minute would be if one machine were at a different level.
function netAfter(g, key, level) {
  let units = 0;
  SYS_KEYS.forEach((k) => { units += CONFIG.systems[k].draw[k === key ? level : effectiveLevel(g, k)]; });
  return Math.round((solarOutput(g) - units * CONFIG.powerUnit) * 60);
}

// -----------------------------------------------------------------------
// Forecast and "what is wrong?" help, shown on the Earth computer
// -----------------------------------------------------------------------
function forecast(g) {
  // Flares Earth knows about: forecasted ones that are today or tomorrow, and not over yet
  return g.schedule.filter((f) => f.alerted && !f.started && (f.day === g.day || f.day === g.day + 1));
}

function diagnose(g) {
  const lines = [];
  if (g.blackout) lines.push(g.planet === "mars" ? "💡 Blackout! The battery ran out. Restart the 📡 link station first." : "💡 Blackout! The battery ran out. Restart 💨 life support first.");
  else if (g.battery < 30) {
    lines.push("🔋 Battery is low. Panels make power. Machines use power.");
    if (g.dust > 0.5) lines.push("🧹 The panels are dusty. Clean them to make more power.");
  }
  if (!g.blackout && effectiveLevel(g, "life") === 0) lines.push(g.planet === "mars" ? "📡 The link station is OFF. Your signal will fade." : "💨 Life support is OFF. Air will go stale.");
  if (g.systems.greenhouse.level > 0 && g.water <= 0) lines.push("💧 The greenhouse has no water. Bring ❄️ ice from the crater.");
  if (g.food === 0 && g.player.energy < 50) lines.push("🍎 No food left. Plants need water and power.");
  if (g.labQueue.length > 0 && effectiveLevel(g, "lab") === 0) lines.push("🔬 Samples are waiting. Turn the lab ON.");
  if (g.flare) lines.push("☀️ A flare is happening NOW. Stay inside the bubble!");
  if (researchReady(g)) lines.push("📦 You have enough research for a rover part. Launch it from the 🚀 Launcher!");
  else if (partWaiting(g)) lines.push("🔧 A rover part is waiting at the Rover Bay.");
  else if (g.rover.built) lines.push("🚙 The rover is ready. Drive to Far Side Camp to find Sam!");
  if (lines.length === 0) lines.push("👍 Everything looks fine. Keep exploring!");
  return lines.slice(0, 3);
}

// -----------------------------------------------------------------------
// Night, sleep, fainting
// -----------------------------------------------------------------------
function simulateNight(g) {
  const before = { battery: g.battery };
  g.clock += CONFIG.nightSec;
  deliverParts(g);
  let gasped = false;
  for (let i = 0; i < CONFIG.nightSec; i++) {
    powerStep(g, 1);
    plantsAndLab(g, 1);
    SYS_KEYS.forEach((k) => {
      const s = g.systems[k];
      if (s.switching) {
        s.progress += 1 / CONFIG.systems[k].switchSec;
        if (s.progress >= 1) { s.level = s.target; s.switching = false; s.progress = 0; }
      }
    });
    if (effectiveLevel(g, "life") === 0) gasped = true;
  }
  if (gasped) incident(g, "stale");
  // Moon dust settles on the panels overnight, so clean them again in the morning
  const dustBefore = g.dust;
  g.dust = clamp(g.dust + planetOf(g).nightDust, 0, 1);
  return { batteryChange: Math.round(g.battery - before.battery), gasped: gasped, blackout: g.blackout, dustAdded: Math.round((g.dust - dustBefore) * 100) };
}

// Start the next morning. "how" is "sleep" or "faint".
function nextDay(g, how, reason) {
  const night = simulateNight(g);
  if (g.status === "evacuated") return { how: "evacuated", reason: "power" };
  const p = g.player;
  const ate = p.fed;

  g.day++;
  g.min = CONFIG.dayStartMin;
  g.flare = null; g.siren = 0;
  g.visitedToday = false; g.weatherChecked = false; g.coachCool = 0;
  g.missions = g.missions.filter((m) => m.type !== "flare" || m.done);
  if (g.rover.location !== "home") g.rover.location = "home"; // Zorp or the sunrise brings you back
  p.rad = 0; p.air = night.gasped ? 55 : 100; p.fed = false;
  if (how === "faint") p.energy = 45;
  else p.energy = ate ? 100 : 65;
  if (night.gasped) p.energy = Math.max(30, p.energy - 25);

  const summary = {
    how: how, reason: reason || null, newDay: g.day,
    batteryChange: night.batteryChange, gasped: night.gasped, blackout: night.blackout,
    hungry: how === "sleep" && !ate, rescues: g.rescues, dustAdded: night.dustAdded, dust: Math.round(g.dust * 100)
  };
  if (!g.endless && g.day > g.days) { g.status = g.reunited ? "won" : "timeup"; summary.finished = true; }
  else topUp(g);
  ev(g, "new_day", summary);
  return summary;
}

// Endless mode: the player chooses when the mission ends
function endMission(g) {
  if (g.status !== "playing") return false;
  g.status = g.reunited ? "won" : "timeup";
  return true;
}

function sleep(g) {
  if (g.status !== "playing") return null;
  if (g.min < CONFIG.bedtimeOkMin) { hint(g, "not_sleepy", 5); return null; }
  return nextDay(g, "sleep");
}

function faint(g, reason) {
  if (g.status !== "playing") return null;
  if (!loseLife(g, reason)) return { how: "evacuated", reason: reason };
  return nextDay(g, "faint", reason);
}

// -----------------------------------------------------------------------
// Score and "what you learned"
// -----------------------------------------------------------------------
function starRating(g) {
  if (g.status === "timeup") return g.rover.built ? 1 : 0;
  if (g.status !== "won") return 0;
  if (!g.reunited) return 1;
  if (g.science >= CONFIG.star3 && g.rescues <= 1) return 3;
  if (g.science >= CONFIG.star2) return 2;
  return 1;
}

function buildLessons(g) {
  const lessons = [];
  const has = (prefix) => g.incidents.filter((i) => i.type.indexOf(prefix) === 0).length;
  if (has("blackout")) lessons.push("A blackout happened because the battery ran empty (and it cost one of Zorp's rescues). Solar panels fill the battery, and every machine uses some. Clean panels make more power, and turning machines off saves it.");
  if (has("faint_late")) lessons.push("You stayed up too late and fainted. Astronauts follow a sleep schedule because tired crews make mistakes.");
  if (has("faint_air")) lessons.push("You ran out of air outside. Spacewalks have a time limit, and real astronauts always plan the trip back.");
  if (has("faint_radiation") || has("radiation")) lessons.push("A solar flare made you sick because you were outside or the shield was low. Real crews use storm shelters and shielding, and they watch space-weather forecasts.");
  if (has("stale")) lessons.push("Life support was off and the air went stale. It is the one machine a crew can never leave off for long.");
  g.flaresSurvived.forEach((fs) => {
    const d = fs.def;
    if (fs.maxRad < 25) lessons.push("The " + d.classType + " flare " + (d.typical ? "" : "of " + d.date + " ") + "barely bothered you. Shield level and staying inside kept the radiation low.");
  });
  if (g.reunited) lessons.push("You reached Sam! Real missions do this too: scientists on Earth and astronauts on the Moon share data, and the research you send helps build the next tools.");
  else if (g.rover.built) lessons.push("The rover was built, but time ran out. Real missions have deadlines too, so planning the order of jobs matters.");
  if (g.stats.harvested === 0) lessons.push("You never harvested food. Plants need ice water AND power from the greenhouse.");
  if (lessons.length === 0) lessons.push("Every machine, trip and rest used something. Balancing them is the job real mission planners do every day.");
  return lessons.slice(0, 5);
}

// Lets the test files (run with Node) read this file. Browsers ignore it.
if (typeof module !== "undefined") {
  const data = require("./data.js");
  Object.assign(globalThis, { MISSION_FILLERS: data.MISSION_FILLERS, DISCOVERIES: data.DISCOVERIES, HINTS: data.HINTS });
  module.exports = {
    launcherInfo,
    PLANETS, planetOf, stormLevel, flareIntensity, flareTier, shieldLeak, radSlow, dustStormNow, typicalFlare,
    endMission, jumpFactStep, allDiscovered, discoveredCount, mayMeetCrew, EXPLORE_ORDER,
    CONFIG, SYS_KEYS, newGame, step, requestSwitch, mineIce, collectRock, pourIce, harvest, eat,
    cleanPanels, depositRocks, depositSamples, collectSample, discover, openComputer, forecast, diagnose, sleep, faint, nextDay,
    claimMission, unclaimedCount, starRating, buildLessons, effectiveLevel, powerDraw, solarOutput,
    clockText, flareLetter, makeRng, clamp, assignMissions, commsOk, researchReady, sendResearch, partWaiting,
    assemblePart, roverTravel, meetCrew, powerReport, netAfter, deliverParts, carried,
    zorpGift, topUp, tutorialDone, sleepAdvice, flareThreat, needBoost, loseLife, coach
  };
}
