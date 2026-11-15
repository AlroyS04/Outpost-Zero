// main.js — the GAME LOOP. It runs about 60 times every second:
//   read keys -> move the astronaut -> ask engine.js what changed -> draw everything.

const G = {
  g: null,                        // the game state (see engine.js)
  nodes: [],                      // ice and rocks you can pick up
  player: { x: SPAWN.x, y: SPAWN.y, dir: "down", walkFrame: 0, walkAcc: 0, moving: false, z: 0, vz: 0 },
  explored: { cell: 40, w: WORLD.w / 40, h: WORLD.h / 40, data: new Uint8Array((WORLD.w / 40) * (WORLD.h / 40)) },
  jumpPressed: false, jumpFacts: {}, factIndex: 0, miniTimer: 0, storySeen: false,
  bolt: { x: SPAWN.x - 18, y: SPAWN.y },
  zorp: { x: 1500, y: 1104, tx: 1500, ty: 1104, wave: false },
  launchT: -1,                    // seconds since the research rocket lifted off (-1 = not launching)
  queue: [],                      // pop-ups waiting for their turn (help cards, calls, discoveries)
  driving: false, parked: null, portalCool: 0, portalX: {}, filmSeen: false, filmSeenMars: false, tutSeen: {}, planet: "moon", prints: [], firstJump: false, hammerPending: false, zorpFactCool: 0, zorpFactIdx: 0, mode: { days: 5 },
  zorpRescueUntil: 0,
  action: null,                   // a job in progress (mining, cleaning...)
  keys: { up: false, down: false, left: false, right: false },
  actPressed: false,
  t: 0, last: 0, hudTimer: 0, matCool: 0, zorpTimer: 0,
  flareInfo: { flares: [], mode: "archived" },
  days: 8, seed: 1, playing: false
};

// -----------------------------------------------------------------------
// Real flares from NASA (or the backup list)
// -----------------------------------------------------------------------
function ymd(date) { return date.toISOString().slice(0, 10); }

async function loadFlares() {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const url = "https://api.nasa.gov/DONKI/FLR?startDate=" + ymd(start) + "&endDate=" + ymd(end) + "&api_key=" + encodeURIComponent(new URLSearchParams(location.search).get("nasakey") || NASA_API_KEY);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error("NASA answered with status " + response.status);
    const data = await response.json();
    const seen = new Set();
    const strong = (Array.isArray(data) ? data : [])
      .filter((f) => f && /^[CMX]/i.test(String(f.classType || "")))
      .map((f) => ({
        id: String(f.flrID), date: String(f.peakTime || f.beginTime || "").slice(0, 10),
        classType: String(f.classType), region: f.activeRegionNum ? String(f.activeRegionNum) : "unknown", source: "live"
      }))
      .filter((f) => (seen.has(f.id) ? false : seen.add(f.id)))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    // keep a mix of weak (C), medium (M) and strong (X) flares so every game has all three
    const mixed = [];
    ["X", "M", "C"].forEach((L) => strong.filter((f) => f.classType.toUpperCase().charAt(0) === L).slice(0, 4).forEach((f) => mixed.push(f)));
    strong.length = 0; mixed.forEach((f) => strong.push(f));
    if (strong.length >= 3) return { flares: strong.concat(ARCHIVED_FLARES.filter((a) => !strong.some((s) => s.id === a.id)).map((f) => Object.assign({ source: "archived" }, f))), mode: "live" };
    console.info("Only " + strong.length + " strong flares in the last 30 days. Using the archive.");
  } catch (error) {
    console.info("Could not load live NASA data. Using the archive.", error);
  }
  return { flares: ARCHIVED_FLARES.map((f) => Object.assign({ source: "archived" }, f)), mode: "archived" };
}

// -----------------------------------------------------------------------
// Starting and finishing
// -----------------------------------------------------------------------
function beginGame() {
  $("title").classList.add("hidden");
  $("end").classList.add("hidden");
  UI.showHud(true);
  G.playing = true;
  G.g.hintCool = 0;
  hint(G.g, G.g.tutorial ? "start" : "start_plain");
}

function startGame(days, sameSeed, opts) {
  opts = opts || {};
  Sound.start();
  G.days = days;
  G.mode = { days: days, demo: !!opts.demo };
  if (!sameSeed) G.seed = opts.demo ? 4242 : Math.floor(Math.random() * 1000000000);
  applyPlanet(G.planet); Art.planet = G.planet; UI.preload();                             // Moon or Mars words, facts and places
  REGIONS.cave.name = DISCOVERIES.cave.title;
  { const sp = SPOTS.find((x) => x.id === "sam"); if (sp) sp.icon = G.planet === "mars" ? "🤖" : "🧑‍🚀"; }
  { const ha = document.getElementById("help-air"); if (ha) ha.innerHTML = G.planet === "mars" ? "📡 <b>Link</b> fades far from base. Stay near the base circle" : "💨 <b>Air</b> runs down outside. Go back in the bubble"; }
  G.marsMoveNote = false;
  REGIONS.north.name = DISCOVERIES.northpole.title; REGIONS.south.name = DISCOVERIES.southpole.title;
  DESTINATIONS.forEach((d) => { if (d.id === "north") d.name = DISCOVERIES.northpole.title; if (d.id === "south") d.name = DISCOVERIES.southpole.title; if (d.id === "far") d.name = G.planet === "mars" ? "Far Side Camp" : "Far Side Camp"; });
  SPOTS.forEach((s) => { if (s.id === "cave_enter") s.label = "Enter " + DISCOVERIES.cave.title; if (s.id === "plaque") s.label = DISCOVERIES.tranquility.title; });
  Renderer.setPlanet(G.planet);
  const tutorial = !G.tutSeen[G.planet] && !opts.demo;   // the guided lesson plays once for each world
  G.g = newGame(G.seed, G.flareInfo.flares, days, { tutorial: tutorial, planet: G.planet, demo: !!opts.demo });
  G.nodes = makeNodes();
  G.player.x = SPAWN.x; G.player.y = SPAWN.y; G.player.dir = "down"; G.player.z = 0; G.player.vz = 0;
  G.bolt.x = SPAWN.x - 18; G.bolt.y = SPAWN.y;
  G.action = null; G.playing = false; G.zorpRescueUntil = 0; G.queue = []; G.launchT = -1;
  G.driving = false; G.parked = null; G.portalCool = 0; G.portalX = {};
  G.prints = [];                                       // footprints are wiped only when a new game starts
  G.firstJump = false; G.hammerPending = false; G.jumpFacts = {}; G.zorpFactCool = 0; G.zorpFactIdx = Math.floor(Math.random() * 50);
  G.explored.data.fill(0);
  Renderer.follow(G.player, true);
  $("title").classList.add("hidden");
  $("end").classList.add("hidden");
  $("pause").classList.add("hidden");
  $("btn-end").classList.toggle("hidden", days !== Infinity);
  const toTutorial = () => { if (tutorial) { G.tutSeen[G.planet] = true; UI.showTutorial(beginGame); } else beginGame(); };
  const toStory = () => { if (!opts.demo && !G.storySeen && G.planet === "moon" || (G.planet === "mars" && !G.tutSeen.mars_story && !opts.demo)) { if (G.planet === "mars") G.tutSeen.mars_story = true; else G.storySeen = true; UI.showStory(toTutorial); } else toTutorial(); };
  if (G.planet === "moon" && !G.filmSeen && !opts.demo) { G.filmSeen = true; Cinematic.play(toStory, "moon"); }
  else if (G.planet === "mars" && !G.filmSeenMars && !opts.demo) { G.filmSeenMars = true; Cinematic.play(toStory, "mars"); }
  else toStory();
}

// Back to the main menu (from the pause menu)
function toMenu() {
  G.playing = false; G.driving = false;
  UI.showHud(false);
  UI.setArrow(null); UI.setPrompt(null); $("bolt-say").classList.add("hidden");
  ["pause", "end", "card", "panel", "terminal", "story", "transition", "help"].forEach((id) => $(id).classList.add("hidden"));
  G.queue = [];
  $("title").classList.remove("hidden");
  UI.setPlanetButtons(G.planet);
}

function afterDay(summary) {
  const g = G.g;
  if (g.status !== "playing") { endGame(); return; }
  G.player.x = SPAWN.x; G.player.y = SPAWN.y; G.player.dir = "down"; G.player.z = 0; G.player.vz = 0;
  G.bolt.x = SPAWN.x - 18; G.bolt.y = SPAWN.y;
  G.nodes = makeNodes();
  G.action = null;
  Renderer.follow(G.player, true);
  if (summary.how === "faint") {
    G.zorp.x = SPAWN.x + 26; G.zorp.y = SPAWN.y + 8; G.zorp.wave = true;
    G.zorpRescueUntil = G.t + 7;
    UI.say("👽 Zorp put you back in bed! Thank you, Zorp!", 6000);
  } else {
    g.hintCool = 0;
    if (g.dust > 0.25) hint(g, "wake_clean", 1);       // brush the panels in the morning, like brushing your teeth
    else if (forecast(g).length) hint(g, "forecast");
    else UI.say("Good morning! Check the computer 🖥️", 4500);
  }
}

function endGame() {
  G.playing = false;
  UI.showHud(false);
  UI.setArrow(null); UI.setPrompt(null); $("bolt-say").classList.add("hidden");
  UI.showEnd(G.g, { again: (same) => startGame(G.days, same), menu: toMenu });
}

// -----------------------------------------------------------------------
// Events from the engine (sounds, speech, popups)
// -----------------------------------------------------------------------
function later(fn) { G.queue.push(fn); }

function handleEvent(e) {
  const g = G.g;
  switch (e.t) {
    case "hint": UI.say(HINTS[e.id]); if (e.id === "siren") Sound.play("siren"); break;
    case "siren": Sound.play("siren"); break;
    case "flare_start": Sound.play("flare"); UI.toast("☀️ Solar flare!"); break;
    case "flare_end": UI.toast(e.safe ? "🎉 You stayed safe!" : "😵 That was rough!"); break;
    case "blackout": Sound.play("blackout"); UI.toast("💡 Blackout! No radio."); break;
    case "zorp_power": UI.toast("👽 Zorp used a rescue (" + e.left + " left)"); break;
    case "power_back": UI.toast("💡 Power is back!"); UI.say("Power is back! Now restart your machines 🔧"); break;
    case "switch_start": Sound.play("ding"); break;
    case "switched": Sound.play("ding"); UI.toast(CONFIG.systems[e.key].icon + " " + ["OFF", "ON", "BOOST"][e.level]); break;
    case "auto_off": Sound.play("bad"); UI.toast(CONFIG.systems[e.key].icon + " turned itself OFF (saves power)"); break;
    case "mission_done": Sound.play("reward"); UI.toast("⭐ Mission done! Tell Earth 🖥️"); break;
    case "new_mission": UI.toast("📋 New mission from Earth!"); break;
    case "analyzed": Sound.play("pickup"); UI.toast({ rock: "🪨", metal: "🔩", crystal: "💎" }[e.type] + " 🔬 +" + e.sci); break;
    case "poured": UI.toast("💧 +" + e.n * CONFIG.iceWater + " water"); break;
    case "research_sent": UI.toast("🚀 Research launched!"); G.launchT = 0; Sound.play("flare"); break;
    case "part_arrived": Sound.play("reward"); UI.toast("📦 Rover part arrived!"); break;
    case "part_assembled": Sound.play("reward"); UI.toast("🔧 Part " + e.n + "/" + CONFIG.rover.partsNeeded + " built!"); break;
    case "rover_ready": Sound.play("reward"); UI.toast("🚙 ROVER READY!"); break;
    case "coach": later(() => UI.showCoach(e.id, () => {})); break;
    case "flare_call":
      later(() => UI.showCall(e.flare, () => { g.hintCool = 0; hint(g, "flare_boost"); }));
      break;
    case "tutorial_step": {
      Sound.play("reward");
      const n = ["air", "ice", "solar"].filter((k) => g.tutorial && g.tutorial[k]).length;
      UI.toast("✅ Lesson " + n + "/3 done!");
      g.hintCool = 0;
      if (g.tutorial.air && g.tutorial.ice && g.tutorial.solar) hint(g, "tut_done");
      else if (e.step === "air") UI.say(G.planet === "mars" ? "📡 Link is on! Now go talk to Earth 🖥️." : "💨 Air is flowing! Now go talk to Earth 🖥️.", 5000);
      else if (e.step === "ice") UI.say("💧 Ice in! Turn the greenhouse ON 🌱.", 5000);
      break;
    }
    case "zorp_gift":
      Sound.play("reward");
      later(() => UI.showCard(DISCOVERIES.zorp, () => {}));
      break;
    case "reunited":
      Sound.play("reward");
      if (G.g.endless) UI.showCard(G.planet === "mars" ? { icon: "🤖🤝🤖", title: "You found " + CREW_NAME + "!", text: "You and " + CREW_NAME + " the robot touch antennas. The mission is not over: keep exploring Mars as long as you like. Press 🏁 when you want to finish.", source: "Our game's story" } : { icon: "🧑‍🚀🤝🧑‍🚀", title: "You found " + CREW_NAME + "!", text: "You and " + CREW_NAME + " hug in your space suits. The mission is not over: keep exploring the Moon as long as you like. Press 🏁 when you want to finish.", source: "Our game's story" }, () => { UI.say("🏁 You can end the mission any time with the flag button.", 5000); }, { noPlus: true });
      else UI.showCard(G.planet === "mars" ? { icon: "🤖🤝🤖", title: "You found " + CREW_NAME + "!", text: "After crossing Mars, you and " + CREW_NAME + " the robot touch antennas. Real robots like Perseverance and Curiosity explore Mars for us, so humans can come later. Mission complete!", source: "Our game's story" } : { icon: "🧑‍🚀🤝🧑‍🚀", title: "You found " + CREW_NAME + "!", text: "After crossing the Moon, you and " + CREW_NAME + " hug in your space suits. Together you can explore the far side, where Earth is never in the sky. Mission complete!", source: "Our game's story" }, () => endGame(), { noPlus: true });
      break;
    case "new_day": G.action = null; UI.setPrompt(null); UI.setArrow(null); UI.showTransition(e, G.g, () => afterDay(e)); break;
    case "evacuated": G.queue = []; endGame(); break;
  }
}

// -----------------------------------------------------------------------
// What to do right now? (the arrow points the way)
// -----------------------------------------------------------------------
function spot(id) { return SPOTS.find((x) => x.id === id); }
// A goal tells the screen: where to stand (x, y), what to point at (tx, ty), and a short label.
function goalSpot(id) { const s = spot(id); return { id: id, x: s.x, y: s.y, tx: s.tx, ty: s.ty, label: s.label, icon: s.icon }; }
function goalNode(n, label) { return { node: n, x: n.x, y: n.y, tx: n.x, ty: n.y - 12, label: label }; }
function goalHome() {
  const r = playerRegion();
  if (r === "cave") return goalSpot("cave_exit");
  if (POLE_REGIONS.indexOf(r) >= 0) {                       // poles: walk back out through the gap you came in by
    const gt = GATES.find((q) => q.region === r), R = REGIONS[r];
    const gy = gt.side === "top" ? R.y + 20 : R.y + R.h - 20;
    return { x: gt.x, y: gy, tx: gt.x, ty: gy + (gt.side === "top" ? 40 : -40), label: "Way back home", icon: gt.side === "top" ? "⬆" : "⬇" };
  }
  return goalSpot("rhome_" + r);
}
function playerRegion() { return regionAt(G.player.x, G.player.y); }

function nearestNode(type) {
  const reg = playerRegion();
  let best = null, bd = 1e9;
  G.nodes.forEach((n) => { if (n.alive && n.type === type && regionAt(n.x, n.y) === reg) { const d = dist(G.player, n); if (d < bd) { bd = d; best = n; } } });
  return best;
}
const NODE_LABEL = { ice: "❄️ Ice", rock: "🪨 Rock", metal: "🔩 Metal", crystal: "💎 Crystal" };
const NODE_HOME = { ice: "home", rock: "home", metal: "landing", crystal: "crater" };

// Go collect "type" (from wherever it lives)
function goCollect(g, type) {
  const reg = playerRegion(), want = NODE_HOME[type];
  if (reg === want) {
    if (carried(g) >= CONFIG.rockCarry || (type === "ice" && g.player.ice >= CONFIG.iceCarry)) return reg === "home" ? goalSpot(type === "ice" ? "ghmat" : "labmat") : goalHome();
    const n = nearestNode(type);
    if (n) return goalNode(n, NODE_LABEL[type]);
    return reg === "home" ? null : goalHome();
  }
  if (reg !== "home") return goalHome();
  return g.rover.built ? goalSpot("bay") : null;
}

function objective(g) {
  const reg = playerRegion();
  const atHome = reg === "home";
  const lab = g.systems.lab;

  // Lesson 1: switch on the air generator before anything else
  if (g.tutorial && !g.tutorial.air) {
    const s = g.systems.life;
    if (s.switching) return null;                       // wait for it
    return atHome ? goalSpot("life") : goalHome();
  }
  // A solar flare is coming: go to the shield and BOOST it
  if (needBoost(g)) return atHome ? goalSpot("shield") : goalHome();
  if ((g.flare || g.siren > 0) && !atHome) return goalHome();

  // Evening: brush the panels, then sleep
  if (g.min >= 20 * 60) return atHome ? (g.dust > 0.12 ? goalSpot("panels") : goalSpot("bed")) : goalHome();
  // Morning: brush the panels first (like brushing your teeth)
  if (atHome && g.day > 1 && g.min < 8 * 60 + 30 && g.dust > 0.25) return goalSpot("panels");
  if (atHome && (!g.missionsKnown || unclaimedCount(g) > 0 || (researchReady(g) && G.sendPoint))) return !g.missionsKnown || unclaimedCount(g) > 0 ? goalSpot("computer") : goalSpot("launcher");

  // The ice is in: now ask the player to switch the greenhouse ON so the plants can grow
  if (atHome && g.food <= 3 && g.water > 0 && g.player.ice === 0 && g.systems.greenhouse.level === 0 && !g.systems.greenhouse.switching) return goalSpot("greenhouse");   // plenty of apples (over 3)? Then skip this and focus on the missions

  const carry = g.player.rocks + g.player.metal + g.player.crystal;
  // Getting samples into a research package: collect, drop at the mat, switch the lab on, wait
  const science = (kind) => {
    const have = g.studied + g.labQueue.length + carry, need = CONFIG.rover.samplesPerPackage;
    if (carry > 0 && (have >= need || carried(g) >= CONFIG.rockCarry)) return atHome ? goalSpot("labmat") : goalHome();
    if (have >= need) {
      if (!atHome) return goalHome();
      if (g.labQueue.length > 0 && lab.level === 0 && !lab.switching) return goalSpot("lab");
      return null;                                         // the lab is working: nothing to do but wait
    }
    return goCollect(g, kind);
  };
  for (const m of g.missions) {
    if (m.done) continue;
    switch (m.type) {
      case "send":
        if (researchReady(g)) return atHome ? goalSpot("launcher") : goalHome();
        { const r = science("rock"); if (r) return r; }
        continue;
      case "assemble":
        if (!partWaiting(g)) continue;
        return atHome ? goalSpot("bay") : goalHome();
      case "meet":
        if (reg === "far") return goalSpot("sam");
        return atHome ? goalSpot("bay") : goalHome();
      case "ice":
        if (!atHome) return goalHome();
        if (g.player.ice > 0) return goalSpot("ghmat");
        return goCollect(g, "ice") || goalSpot("ghmat");
      case "study": case "rock": case "metal": case "crystal":
        if (m.type !== "rock" && m.type !== "study" && !g.rover.built) continue;
        if (m.type === "crystal" && !g.crystalUnlocked) continue;
        if (m.type === "metal" || m.type === "crystal") {
          if (atHome && carry > 0) return goalSpot("labmat");
          if (atHome && g.labQueue.length > 0 && lab.level === 0 && !lab.switching) return goalSpot("lab");
          return goCollect(g, m.type);
        }
        { const r = science("rock"); if (r) return r; }
        continue;
      case "clean": return atHome ? goalSpot("panels") : goalHome();
      case "harvest": {
        if (!atHome) return goalHome();
        if (g.plots.some((p) => p >= 1)) return Object.assign(goalSpot("ghmat"), { icon: "🍎", label: "Pick the apples" });
        if (g.player.ice > 0) return goalSpot("ghmat");
        if (g.water > 0) continue;                       // water is in and plants are growing: nothing to drop, just wait
        return goCollect(g, "ice") || goalSpot("ghmat");
      }
      case "explore": {
        const d = DISCOVERY_SPOTS.find((x) => x.id === m.loc);
        if (d.region === reg) {
          if (g.discovered[d.id] && d.id === "cave" && !g.zorpMet) return goalSpot("zorp_talk");
          return { x: d.x, y: d.y, tx: d.x, ty: d.y - 24, label: DISCOVERIES[d.id].title };
        }
        if (d.region === "cave") return atHome ? goalSpot("cave_enter") : goalHome();
        if (POLE_REGIONS.indexOf(d.region) >= 0) {            // the poles are a walk through a gap in the wall
          if (!atHome) return goalHome();
          const gt = GATES.find((q) => q.id === (d.region === "north" ? "home_n" : "home_s"));
          const gy = gt.side === "top" ? 20 : REGIONS.home.h - 20;
          return { x: gt.x, y: gy, tx: gt.x, ty: gy + (gt.side === "top" ? 50 : -50), label: DISCOVERIES[d.id].title + " (through the gap)", icon: gt.side === "top" ? "⬆" : "⬇" };
        }
        if (d.region !== "home" && !g.rover.built) continue;
        return atHome ? goalSpot("bay") : goalHome();
      }
      case "flare": continue;
    }
  }
  // Zorp's gift is waiting inside the cave
  if (reg === "cave" && !g.zorpMet) return goalSpot("zorp_talk");
  // No required missions left today: suggest an optional BONUS (extra rocks = extra science)
  if (!g.missions.some((q) => !q.done && q.type !== "flare") && g.min < 17 * 60 && !g.flare && g.siren <= 0) {
    const b = science("rock");
    if (b) return Object.assign({}, b, { label: "⭐ Bonus: " + (b.label || "collect rocks") });
  }
  return g.min >= 17 * 60 ? (atHome ? goalSpot("bed") : goalHome()) : null;
}

// -----------------------------------------------------------------------
// Doing things
// -----------------------------------------------------------------------
function startAction(total, fn) { G.action = { total: total, left: total, fn: fn }; }
function carried(g) { return g.player.rocks + g.player.metal + g.player.crystal; }

const FACE = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function nearestInteract() {
  const reg = playerRegion();
  let best = null, bd = 1e9;
  // 1) Standing inside the glowing yellow ring: E uses the thing the guide points at
  const gl = G.goalNow;
  if (gl && gl.id && gl.x !== undefined) {
    const dx = (G.player.x - gl.x) / 26, dy = (G.player.y - gl.y) / 15;
    const s = spot(gl.id);
    if (dx * dx + dy * dy <= 1 && s && s.kind === "press" && (s.region || "home") === reg) return { type: "spot", s: s, x: s.tx, y: s.ty };
  }
  const f = FACE[G.player.dir] || [0, 0];
  SPOTS.forEach((s) => {
    if (s.kind !== "press" || (s.region || "home") !== reg) return;
    let d = spotDistance(G.player, s);            // buildings count as a whole box, so any side works
    if (d >= s.r) return;
    // the thing you are facing wins when two are close together
    const b = s.rect ? BUILDINGS[s.rect] : null, cx = b ? b.x + b.w / 2 : s.x, cy = b ? b.y + b.h / 2 : s.y;
    const vx = cx - G.player.x, vy = cy - G.player.y, vl = Math.hypot(vx, vy) || 1;
    if ((vx * f[0] + vy * f[1]) / vl > 0.5) d -= 8;
    if (d < bd) { bd = d; best = { type: "spot", s: s, x: s.tx, y: s.ty }; }
  });
  G.nodes.forEach((n) => {
    if (!n.alive || regionAt(n.x, n.y) !== reg) return;
    const d = dist(G.player, n);
    if (d < 20 && d < bd) { bd = d; best = { type: "node", n: n, s: { icon: { ice: "❄️", rock: "🪨", metal: "🔩", crystal: "💎" }[n.type], label: ((n.type === "ice" && G.g.player.ice >= CONFIG.iceCarry) || (n.type !== "ice" && carried(G.g) >= CONFIG.rockCarry)) ? "Bag full (4)" : "Collect" }, x: n.x, y: n.y - 18 }; }
  });
  return best;
}

// The rover drives you somewhere (or home)
// Where the rover is parked right now (on its pad, or wherever you left it)
function parkedRover() {
  if (G.parked) return G.parked;
  const loc = G.g.rover.location;
  if (loc === "home") return { x: BAY.x + BAY.w / 2, y: BAY.y + BAY.h / 2 + 10 };
  const p = padOf(loc);
  return { x: p.x + 10, y: p.y + 8 };
}

// Q: get in or out of the rover. Driving is faster and keeps you sealed in (no air loss).
// The little "Q: ..." tip next to the E tip
function qPromptText() {
  const g = G.g;
  if (!g.rover.built || UI.modalOpen()) return null;
  if (G.driving) return "🚙 Get out";
  if (playerRegion() === "cave") return null;
  const r = parkedRover();
  if (regionAt(r.x, r.y) === playerRegion() && dist(G.player, r) <= 70) return "🚙 Drive the rover";
  return null;
}
function toggleDrive() {
  const g = G.g, p = G.player;
  if (!g.rover.built) { UI.say("🚙 Build the rover first! Send research to Earth 🚀 for parts.", 4500); return; }
  if (G.driving) {
    G.driving = false; G.parked = { x: p.x, y: p.y };
    UI.toast("🚙 Parked. Press Q near the rover to drive again.");
    return;
  }
  if (playerRegion() === "cave") { UI.say("🚙 The rover is parked outside the cave.", 4000); return; }
  const r = parkedRover();
  if (regionAt(r.x, r.y) !== playerRegion() || dist(p, r) > 70) { UI.say("🚙 Walk to your rover and press Q to drive it!", 4500); return; }
  G.driving = true; G.parked = null; G.action = null;
  p.x = r.x; p.y = r.y;
  UI.toast("🚙 Driving! Fast travel only at the Rover Bay or a return pad");
}

// E while driving: choose a fast trip, or ride home
function driveMenu() {
  UI.openRover(G.g, { onGo: doTravel }, playerRegion() === "home");
}

// Walking (or driving) through the gap in the top or bottom wall of the home map takes you to the North or South pole area.
// Walk back through the gap at the other end to return the same way.
function checkPortals() {
  const p = G.player, reg = playerRegion();
  if (G.portalCool > 0 || G.action) return;
  const R = REGIONS[reg];
  const gt = gateAt(reg, p.x, "top") && p.y <= R.y + RIM - 8 ? gateAt(reg, p.x, "top") : (gateAt(reg, p.x, "bottom") && p.y >= R.y + R.h - RIM + 8 ? gateAt(reg, p.x, "bottom") : null);
  if (!gt) return;
  const dest = gt.to, D = REGIONS[dest];
  let nx, ny;
  if (dest === "home") {
    const hg = GATES.find((q) => q.region === "home" && q.to === gt.from);
    nx = hg.x; ny = hg.side === "top" ? RIM + 70 : REGIONS.home.h - RIM - 70;
  } else {
    const og = GATES.find((q) => q.region === dest);
    nx = og.x; ny = og.side === "top" ? D.y + RIM + 70 : D.y + D.h - RIM - 70;
  }
  G.portalCool = 2;
  const label = dest === "home" ? REGIONS.home.name : D.name;
  UI.fade((gt.side === "top" ? "⬆ " : "⬇ ") + label, () => {
    G.player.x = nx; G.player.y = ny; G.player.z = 0; G.player.vz = 0; G.bolt.x = nx - 18; G.bolt.y = ny; G.action = null;
    if (G.driving) G.g.rover.location = dest;
    Renderer.follow(G.player, true);
    UI.say(dest === "home" ? "You are back near the base." : "You reached " + D.name + "! " + (G.driving ? "" : (G.planet === "mars" ? "Stay close to base to keep your link 📡" : "Watch your air 💨")), 4500);
  });
}

function doTravel(dest) {
  const g = G.g;
  const r = roverTravel(g, dest);
  if (!r.ok) return;
  Sound.play("reward");
  const name = dest === "home" ? "Home Base" : REGIONS[dest].name;
  UI.fade("🚙 → " + name, () => {
    const p = dest === "home" ? { x: BAY.x + BAY.w / 2, y: BAY.y + BAY.h + 8 } : spawnOf(dest);
    G.player.x = p.x; G.player.y = p.y; G.player.z = 0; G.player.vz = 0;
    G.bolt.x = p.x - 18; G.bolt.y = p.y;
    G.action = null; G.parked = null;
    if (G.driving) { const r = parkedRover(); G.player.x = r.x; G.player.y = r.y + 4; }   // you arrive still sitting in the rover
    Renderer.follow(G.player, true);
    if (dest !== "home") UI.say("You arrived at " + name + "!" + (G.driving ? "" : (G.planet === "mars" ? " Stay near base to keep your link 📡" : " Watch your air 💨")), 4500);
  });
}

// Walk in or out of the Moon cave (no rover needed)
function walkTo(x, y, name, say) {
  UI.fade(name, () => {
    G.player.x = x; G.player.y = y; G.player.z = 0; G.player.vz = 0;
    G.bolt.x = x - 18; G.bolt.y = y; G.action = null;
    Renderer.follow(G.player, true);
    if (say) UI.say(say, 4500);
  });
}

// Going to bed: first a reminder to brush the solar panels (like brushing your teeth)
function doSleep() {
  const g = G.g;
  if (g.min >= CONFIG.bedtimeOkMin) {
    const adv = sleepAdvice(g);
    if (adv.cleanFirst) {
      UI.showChoice({ icon: "🪥", title: "Brush the panels before bed!", art: "solardirty",
        text: "Moon dust settles on the solar panels while you sleep. Clean them <b>before bed</b> and again <b>right after you wake up</b> to make the most power. It is just like brushing your teeth: before and after bed!",
        buttons: [{ label: "🧹 Go clean the panels", fn: () => { g.hintCool = 0; hint(g, "bedtime_clean"); } }, { label: "😴 Sleep anyway", cls: "alt", fn: () => sleep(g) }] });
      return;
    }
  }
  sleep(g);
}

function doLaunch() { const r = sendResearch(G.g); if (r.ok) Sound.play("reward"); }

function doInteract(it) {
  const g = G.g;
  if (it.type === "node") {
    const n = it.n;
    if (g.player.energy <= 0) { hint(g, "tired", 5); return; }
    // the bag holds 4: no more can be picked up (so no action even starts)
    if ((n.type === "ice" && g.player.ice >= CONFIG.iceCarry) || (n.type !== "ice" && carried(g) >= CONFIG.rockCarry)) {
      hint(g, "bag_full", 5); UI.toast("🎒 Bag full (4)! Drop it off at the mat."); return;
    }
    startAction(n.type === "ice" ? 2 : 1.5, () => {
      const ok = n.type === "ice" ? mineIce(g) : collectSample(g, n.type);
      if (ok) { n.alive = false; Sound.play("pickup"); UI.toast({ ice: "❄️", rock: "🪨", metal: "🔩", crystal: "💎" }[n.type] + " +1"); }
    });
    return;
  }
  switch (it.s.id) {
    case "bed": doSleep(); break;
    case "launcher": UI.openLauncher(g, doLaunch); break;
    case "cave_enter": walkTo(CAVE_SPAWN.x, CAVE_SPAWN.y, "🕳️ Moon Caves", "It is dark in here. Look for the glowing crystals! ✨"); break;
    case "cave_exit": walkTo(1500, 1136, "🌕 Outside", null); break;
    case "zorp_talk":
      if (!g.zorpMet) zorpGift(g);
      else { const f = ZORP_FACTS[G.zorpFactIdx++ % ZORP_FACTS.length]; UI.say("👽 Zorp: " + f, 7000); G.zorpFactCool = 25; }
      break;
    case "plaque": UI.showCard(DISCOVERIES.tranquility, () => {}, { noPlus: true }); break;
    case "bay":
      UI.openRover(g, {
        onBuild: () => startAction(CONFIG.rover.assembleSec, () => { if (assemblePart(g)) Sound.play("pickup"); }),
        onGo: doTravel
      }, true);
      break;
    case "earthview": UI.showEarthView(); break;
    case "sam": if (g.rover.location === "far") meetCrew(g); break;
    case "computer": {
      const first = !g.missionsKnown;
      G.sendPoint = false;
      UI.openTerminal(g, { onClose: () => { if (first && g.day === 1) { g.hintCool = 0; hint(g, "after_call"); } } });
      break;
    }
    case "life": case "shield": case "greenhouse": case "lab": {
      const key = it.s.id;
      UI.openPanel(g, key, (level) => {
        const r = requestSwitch(g, key, level);
        if (r.ok) { UI.toast("⚙️ Changing… " + CONFIG.systems[key].switchSec + "s"); UI.say(CONFIG.systems[key].icon + " Changing takes " + CONFIG.systems[key].switchSec + " seconds. Keep exploring!", 3500); }
      });
      break;
    }
    case "table":
      if (eat(g)) { Sound.play("pickup"); UI.toast("🍎 Yum! +energy"); }
      break;
    case "panels":
      if (g.dust < 0.08) { UI.toast("✨ Already clean!"); break; }
      if (g.player.energy <= 0) { hint(g, "tired", 5); break; }
      startAction(5, () => { if (cleanPanels(g)) { Sound.play("reward"); UI.toast("✨ Panels clean!"); } });
      break;
    default:
      if (it.s.id.indexOf("rhome_") === 0) UI.openRover(g, { onGo: doTravel }, false);
  }
}

function checkMats(dt) {
  const g = G.g;
  G.matCool -= dt;
  if (G.matCool > 0) return;
  const gh = SPOTS.find((s) => s.id === "ghmat"), lab = SPOTS.find((s) => s.id === "labmat");
  if (dist(G.player, gh) < gh.r) {
    if (g.player.ice > 0) { pourIce(g); Sound.play("pickup"); G.matCool = 1; }
    else if (g.plots.some((p) => p >= 1)) { const n = harvest(g); if (n) { Sound.play("reward"); UI.toast("🍎 +" + n + " food"); G.matCool = 1; } }
  }
  if (dist(G.player, lab) < lab.r && carried(g) > 0) {
    const n = depositSamples(g); if (n) { Sound.play("pickup"); UI.toast("📥 " + n + " → 🔬 lab"); G.matCool = 1; }
  }
}

function checkDiscoveries() {
  DISCOVERY_SPOTS.forEach((d) => {
    if (G.g.discovered[d.id]) return;
    if (d.region === playerRegion() && dist(G.player, d) < d.r) {
      if (discover(G.g, d.id)) { Sound.play("reward"); const info = DISCOVERIES[d.id]; later(() => UI.showCard(info, () => {})); }
    }
  });
}

// -----------------------------------------------------------------------
// One update of the world
// -----------------------------------------------------------------------
function update(dt) {
  const g = G.g, p = G.player;
  G.t += dt;

  // Movement
  let dx = 0, dy = 0;
  if (G.keys.left) dx -= 1; if (G.keys.right) dx += 1; if (G.keys.up) dy -= 1; if (G.keys.down) dy += 1;
  let moved = false;
  if (dx || dy) {
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const speed = CONFIG.speed * (g.player.energy <= 0 ? 0.5 : 1) * radSlow(g) * (G.driving ? 1.9 : 1);
    const np = moveWithCollision(p, dx * speed * dt, dy * speed * dt);
    moved = Math.abs(np.x - p.x) + Math.abs(np.y - p.y) > 0.01;
    p.x = np.x; p.y = np.y;
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    p.walkAcc += dt * 8; p.walkFrame = Math.floor(p.walkAcc);
    if (moved && Math.floor(p.walkAcc) % 3 === 0 && Math.random() < 0.3) Renderer.puff(p.x, p.y);
  }
  p.moving = moved;

  // Jumping (only outside the base bubble, where gravity facts live)
  const outside = !insideBase(p.x, p.y);
  if (G.jumpPressed && outside && p.z <= 0 && !G.action && !G.driving) {
    p.vz = 62 * planetOf(g).jump;
    p.jumped = true;
    if (!G.firstJump) {
      G.firstJump = true; G.hammerPending = true;      // Bolt tells the hammer-and-feather story once you land
    } else if (jumpFactStep(G.jumpFacts, g.day)) {
      const f = GRAVITY_FACTS[G.factIndex++ % GRAVITY_FACTS.length];
      UI.say((g.planet === "mars" ? "🔴 " : "🌕 ") + f.text, 9000);
    }
    Sound.play("pickup");
  }
  G.jumpPressed = false;
  if (p.z > 0 || p.vz > 0) {
    p.z += p.vz * dt; p.vz -= 64 * dt;
    if (p.z <= 0) {
      p.z = 0; p.vz = 0;
      if (p.jumped) {                                  // landing leaves a permanent footprint
        p.jumped = false;
        G.prints.push({ x: p.x, y: p.y, dir: p.dir, r: regionAt(p.x, p.y) });
        if (G.prints.length > 900) G.prints.shift();
        Renderer.puff(p.x, p.y); Renderer.puff(p.x + 4, p.y);
      }
    }
  }
  if (G.hammerPending && p.z <= 0 && p.vz === 0) {
    G.hammerPending = false;
    const hf = g.planet === "mars" ? { title: "Jump! Mars gravity", art: "moonquake", text: "Bolt: Mars gravity is only 38% of Earth's. Jumps feel floaty!", source: "NASA Mars" } : HAMMER_FEATHER;
    later(() => UI.showCard(hf, () => {}, { noPlus: true }));
  }

  // Remember where you have been (the minimap fills in)
  {
    const E = G.explored, cx0 = Math.floor(p.x / E.cell), cy0 = Math.floor(p.y / E.cell), reg = playerRegion();
    for (let oy = -5; oy <= 5; oy++) for (let ox = -6; ox <= 6; ox++) {
      const cx = cx0 + ox, cy = cy0 + oy;
      if (cx < 0 || cy < 0 || cx >= E.w || cy >= E.h) continue;
      if (ox * ox / 36 + oy * oy / 25 > 1) continue;
      if (regionAt(cx * E.cell + 1, cy * E.cell + 1) !== reg) continue;
      E.data[cy * E.w + cx] = 1;
    }
  }
  if (researchReady(g)) { if (!G.wasReady) G.sendPoint = true; G.wasReady = true; } else G.wasReady = false;

  // A job in progress stops if you walk away
  if (G.action) {
    if (moved) G.action = null;
    else { G.action.left -= dt; if (G.action.left <= 0) { const fn = G.action.fn; G.action = null; fn(); } }
  }

  // The rules
  if (G.launchT >= 0) { G.launchT += dt; if (G.launchT > 5) G.launchT = -1; }
  step(g, dt, { inBase: insideBase(p.x, p.y), moving: moved, sheltered: playerRegion() === "cave", sealed: G.driving });
  if (moved && G.planet === "mars" && !G.marsMoveNote && !UI.modalOpen()) {
    G.marsMoveNote = true;   // first move on Mars: explain the real radio delay, then say we skipped it
    UI.say("📡 Real Mars: a move command takes about 13 minutes (5 to 20) to reach a robot. But to save time, we made it instant!", 11000);
  }
  checkPortals(); G.portalCool -= dt;
  if (!G.playing) return;

  checkMats(dt);
  checkDiscoveries();

  // Press E
  // While driving you can only use the fast-travel spots (Rover Bay at home, and the return pads)
  let it = G.action ? null : nearestInteract();
  if (it && G.driving && !(it.type === "spot" && (it.s.id === "bay" || it.s.id.indexOf("rhome_") === 0))) it = null;
  G.nearby = it;
  if (G.actPressed && it && !UI.modalOpen()) doInteract(it);
  G.actPressed = false;

  // Bolt follows you
  G.bolt.x += (p.x - 20 - G.bolt.x) * 0.06;
  G.bolt.y += (p.y + 4 - G.bolt.y) * 0.06;

  // After you have met him, Zorp tells you one short real fact when you come near
  G.zorpFactCool -= dt;
  if (g.zorpMet && G.zorpFactCool <= 0 && !UI.modalOpen()) {
    const zr = playerRegion() === "cave" ? { x: 2900, y: 1296 } : G.zorp;
    if (Math.hypot(p.x - zr.x, p.y - zr.y) < 60 && (playerRegion() === "cave" || playerRegion() === "home")) {
      const f = ZORP_FACTS[G.zorpFactIdx++ % ZORP_FACTS.length];
      UI.say("👽 Zorp: " + f, 7000); G.zorpFactCool = 25;
    }
  }

  // Zorp wanders near his cave (or stands by your bed after a rescue)
  const z = G.zorp;
  if (G.zorpRescueUntil > G.t) { /* stays by the bed */ }
  else {
    if (G.zorpRescueUntil && G.zorpRescueUntil <= G.t) { G.zorpRescueUntil = 0; z.x = 1500; z.y = 1104; z.tx = z.x; z.ty = z.y; }
    G.zorpTimer -= dt;
    if (G.zorpTimer <= 0) { G.zorpTimer = 2 + Math.random() * 3; z.tx = 1500 + (Math.random() - 0.5) * 120; z.ty = 1104 + (Math.random() - 0.5) * 50; }
    z.x += Math.sign(z.tx - z.x) * Math.min(Math.abs(z.tx - z.x), 18 * dt);
    z.y += Math.sign(z.ty - z.y) * Math.min(Math.abs(z.ty - z.y), 18 * dt);
    z.wave = dist(p, z) < 150;
  }
}

// -----------------------------------------------------------------------
// Draw everything, then update the on-screen bits
// -----------------------------------------------------------------------
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (ts - G.last) / 1000 || 0);
  G.last = ts;
  const g = G.g;
  if (!g) return;

  if (G.playing && G.queue.length && !UI.modalOpen()) G.queue.shift()();     // the next pop-up gets its turn
  const paused = UI.modalOpen();
  if (G.playing && !paused) update(dt);
  else G.actPressed = false;
  if (!G.playing) G.t += dt;

  Renderer.follow(G.player);
  const attention = G.playing && (!g.missionsKnown || unclaimedCount(g) > 0 || (forecast(g).length > 0 && !g.weatherChecked));
  Renderer.draw({
    g: g, t: G.t, player: G.player, bolt: G.bolt, zorp: G.zorp, nodes: G.nodes, action: G.action, launchT: G.launchT, prints: G.prints, driving: G.driving, parked: g.rover.built ? parkedRover() : null, planet: G.planet, leak: g.leak || 0, inside: insideBase(G.player.x, G.player.y) || playerRegion() === "cave",
    attention: attention, goal: (G.goalNow = G.playing && !UI.modalOpen() ? objective(g) : null), shake: (g.siren > 0 || g.flare) && G.playing && !paused ? 1 : 0
  });

  if (!G.playing) return;

  // Drain engine events (outside the pause check so day changes show up right away)
  while (g.events.length) handleEvent(g.events.shift());

  // Speech bubble, prompt, arrow
  const bolt = Renderer.toScreen(G.bolt.x, G.bolt.y - 22);
  UI.placeBolt(bolt.x, bolt.y);
  const qText = qPromptText();
  if (G.nearby && !paused && !G.action) { const s = Renderer.toScreen(G.nearby.x, G.nearby.y); UI.setPrompt(G.nearby.s, s.x, s.y, qText); }
  else if (qText && !paused && !G.action) { const s = Renderer.toScreen(G.player.x, G.player.y - 26); UI.setPrompt(null, s.x, s.y, qText); }
  else UI.setPrompt(null);
  const goal = paused ? null : objective(g);
  // The arrow points at the thing itself. When you are standing at it, the E button takes its place.
  const atGoal = goal && G.nearby && Math.hypot(G.nearby.x - goal.tx, G.nearby.y - goal.ty) < 30 && !G.action;
  if (goal && !atGoal) { const s = Renderer.toScreen(goal.tx, goal.ty); UI.setArrow(s.x, s.y, (goal.icon ? goal.icon + " " : "") + (goal.label || "")); } else UI.setArrow(null);
  G.miniTimer -= dt;
  if (G.miniTimer <= 0) { G.miniTimer = 0.25; UI.drawMinimap(g, G.explored, G.player); }

  G.hudTimer -= dt;
  if (G.hudTimer <= 0) { G.hudTimer = 0.12; UI.updateHud(g); }
}

// -----------------------------------------------------------------------
// Keyboard and touch
// -----------------------------------------------------------------------
const KEYMAP = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };

function visible(id) { return !$(id).classList.contains("hidden"); }

window.addEventListener("keydown", (e) => {
  Sound.start();
  const isE = e.key === "e" || e.key === "E" || e.key === "Enter";
  // The film: any of these skips it
  if (visible("film")) {
    if (isE || e.key === "Escape" || e.key === " ") { Cinematic.skip(); e.preventDefault(); }
    return;
  }
  const dirs = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  // Any menu open: arrows move between buttons, E / Enter presses
  if (UI.topModal()) {
    if (dirs[e.key]) { UI.nav(dirs[e.key]); e.preventDefault(); return; }
    if (isE || e.key === " ") { if (!e.repeat) UI.activate(); e.preventDefault(); return; }
    if (e.key === "Escape") {
      UI.closePanel(); UI.closeTerminal(); $("help").classList.add("hidden"); if (visible("pause")) $("pause").classList.add("hidden");
      if (visible("card") && $("card-ok") && !$("card-ok").disabled) $("card-ok").click();
    }
    return;
  }
  if ((e.key === "q" || e.key === "Q") && G.playing && !UI.modalOpen() && !G.action) { toggleDrive(); e.preventDefault(); return; }
  if (e.key === "Escape" && G.playing && !UI.modalOpen()) { UI.showPause({ resume: () => {}, restart: () => startGame(G.days, true, { demo: G.mode.demo }), menu: toMenu, helpOpen: () => $("help").classList.remove("hidden") }); e.preventDefault(); return; }
  const k = KEYMAP[e.key];
  if (k) { G.keys[k] = true; e.preventDefault(); return; }
  if (isE) {
    if (!e.repeat) G.actPressed = true;
  } else if (e.key === " ") {
    if (!e.repeat) G.jumpPressed = true;
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => { const k = KEYMAP[e.key]; if (k) G.keys[k] = false; });
window.addEventListener("blur", () => { Object.keys(G.keys).forEach((k) => (G.keys[k] = false)); });

function setupTouch() {
  if (!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) return;
  $("touch").classList.remove("hidden");
  document.querySelectorAll("#touch .dpad button").forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); Sound.start(); G.keys[k] = true; });
    ["pointerup", "pointerleave", "pointercancel"].forEach((n) => b.addEventListener(n, () => (G.keys[k] = false)));
  });
  $("touch-act").addEventListener("pointerdown", (e) => { e.preventDefault(); Sound.start(); G.actPressed = true; });
  $("touch-jump").addEventListener("pointerdown", (e) => { e.preventDefault(); Sound.start(); G.jumpPressed = true; });
}

function fitStage() {
  const w = $("stage").clientWidth;
  $("stage").style.fontSize = w / 64 + "px"; $("stage").style.setProperty("--u", w / 64 + "px");
}

// -----------------------------------------------------------------------
// Get everything going
// -----------------------------------------------------------------------
async function init() {
  fitStage();
  window.addEventListener("resize", fitStage);
  Renderer.init($("game"));
  setupTouch();

  // A quiet backdrop behind the title screen
  G.flareInfo = { flares: ARCHIVED_FLARES.map((f) => Object.assign({ source: "archived" }, f)), mode: "archived" };
  G.g = newGame(1, G.flareInfo.flares, 7);
  G.player.x = BASE.x - 40; G.player.y = BASE.y + 130;
  Renderer.follow(G.player, true);

  $("btn-end").addEventListener("click", () => {
    if (!G.playing || UI.modalOpen()) return;
    UI.showChoice({ icon: "🏁", title: "Finish the mission?", text: "You can keep exploring as long as you like. Finish now to see your results.",
      buttons: [{ label: "🧭 Keep exploring" }, { label: "🏁 Finish and see results", cls: "alt", fn: () => { endMission(G.g); endGame(); } }] });
  });
  $("film-skip").addEventListener("click", () => Cinematic.skip());
  UI.initFocus();
  $("pl-moon").addEventListener("click", () => { G.planet = "moon"; UI.setPlanetButtons("moon"); });
  $("pl-mars").addEventListener("click", () => { G.planet = "mars"; UI.setPlanetButtons("mars"); });
  $("btn-short").addEventListener("click", () => startGame(5));
  $("btn-full").addEventListener("click", () => startGame(7));
  $("btn-endless").addEventListener("click", () => startGame(Infinity));
  $("btn-demo").addEventListener("click", () => startGame(5, true, { demo: true }));
  $("btn-howto").addEventListener("click", () => $("help").classList.remove("hidden"));
  $("btn-help").addEventListener("click", () => $("help").classList.remove("hidden"));
  $("btn-help-close").addEventListener("click", () => $("help").classList.add("hidden"));
  $("btn-sound").addEventListener("click", () => { Sound.muted = !Sound.muted; $("btn-sound").textContent = Sound.muted ? "🔇" : "🔊"; });

  const credits = CREDITS.map((c) => '<a href="' + c.url + '" target="_blank" rel="noopener" style="color:#7dd3fc">' + esc(c.name) + "</a>").join(" · ");
  const note = document.createElement("div");
  note.style.cssText = "font-size:0.62em;color:#94a3b8;margin-top:1.2em;max-width:50em";
  note.innerHTML = "Real data and facts: " + credits + ". The flares are real; the game's numbers are simplified for learning.";
  document.querySelector(".title-box").appendChild(note);

  requestAnimationFrame(frame);

  // Show the title only once fonts and text are in place, so the menu never jumps between sizes
  await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  $("title")._fitKey = null; UI.fitModals();
  document.body.classList.remove("booting");

  G.flareInfo = await loadFlares();
  UI.setDataStatus(G.flareInfo.mode === "live"
    ? "✅ Live NASA data: solar flares from the last 30 days will hit your base (" + G.flareInfo.flares.filter((f) => f.source === "live").length + " real flares found)."
    : "📦 Archived NASA records: NASA's live feed couldn't be reached, so the flares come from famous real events. They are not live.");
  $("btn-short").disabled = false; $("btn-full").disabled = false; $("btn-endless").disabled = false; $("btn-demo").disabled = false;
}

init();
