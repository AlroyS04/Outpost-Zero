// Run with:  node tests/engine.test.js
// Plays the rules with "robot players" to check the game teaches fairly:
// careless play should have consequences, careful play should win.

const assert = require("assert");
const E = require("../engine.js");
const { ARCHIVED_FLARES } = require("../data.js");

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok  - " + name); }

const IN = { inBase: true, moving: false };
const OUT = { inBase: false, moving: true };

// Advance the game by "sec" seconds in small steps.
function advance(g, sec, zone) {
  const dt = 0.1;
  for (let t = 0; t < sec && g.status === "playing"; t += dt) {
    const day = g.day;
    E.step(g, dt, zone);
    if (g.day !== day) return "newday";
  }
  return null;
}
function untilMin(g, minute, zone) {
  while (g.min < minute && g.status === "playing") {
    if (advance(g, 1, zone) === "newday") return "newday";
  }
  return null;
}

// ---------- rule checks ----------
test("flares: at least 3 in 5 days, on days 2+, with weak, medium and strong ones", () => {
  for (let seed = 1; seed <= 200; seed++) {
    [5, 7, 8].forEach((days) => {
      const g = E.newGame(seed, ARCHIVED_FLARES, days);
      assert(g.schedule.length >= 3, "at least 3 flares");
      if (days === 5) assert.strictEqual(g.schedule.length, 3);
      g.schedule.forEach((f) => assert(f.day >= 2 && f.day <= days));
      const tiers = g.schedule.map((f) => f.tier);
      ["weak", "medium", "strong"].forEach((k) => assert(tiers.includes(k), "has a " + k + " flare, seed " + seed));
      g.schedule.forEach((f) => assert(f.I >= 0 && f.I <= 1));
    });
  }
});

test("shield leak: OFF lets everything in, BOOST nearly nothing, stronger flares leak more", () => {
  for (let I = 0; I <= 1.001; I += 0.1) {
    const off = E.shieldLeak(0, I), on = E.shieldLeak(1, I), boost = E.shieldLeak(2, I);
    assert(off === 1 && on < off && boost < on, "I=" + I);
  }
  assert(E.shieldLeak(1, 0.1) < 0.12, "weak flare: almost nothing leaks through ON");
  assert(E.shieldLeak(1, 1) > 0.5, "strong flare: heavy leak through ON");
  assert(E.shieldLeak(2, 1) <= 0.1, "BOOST holds even a strong flare");
});

test("radiation slows you down only after 30", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 5);
  g.player.rad = 25; assert.strictEqual(E.radSlow(g), 1);
  g.player.rad = 60; assert(E.radSlow(g) < 1 && E.radSlow(g) > 0.5);
  g.player.rad = 100; assert(Math.abs(E.radSlow(g) - 0.5) < 1e-9);
});

test("launcher shows at most 2/2 and is marked done", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 5);
  g.studied = 4; g.rover.sent = 2;
  const L = E.launcherInfo(g);
  assert(L.n <= L.need, "never above 2/2");
  g.studied = 1; g.rover.sent = 0; assert.strictEqual(E.launcherInfo(g).label, "1/2");
});

test("you can carry 4 ice, and the 5th is refused", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 5);
  for (let i = 0; i < 4; i++) assert.strictEqual(E.mineIce(g), true);
  assert.strictEqual(g.player.ice, 4);
  assert.strictEqual(E.mineIce(g), false);
});

test("riding HOME is allowed during a flare; going away is not", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 5);
  g.rover.built = true; g.battery = 90; g.min = 9 * 60; g.flare = { def: g.schedule[0], left: 10, maxRad: 0 };
  assert.strictEqual(E.roverTravel(g, "landing").reason, "flare");
  assert.strictEqual(E.roverTravel(g, "home").ok, true);
});

test("the sealed rover keeps your air, and flare radiation is halved", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 5);
  E.step(g, 10, { inBase: false, moving: true, sealed: true });
  assert.strictEqual(g.player.air, 100);
  const f = E.newGame(2, ARCHIVED_FLARES, 5); const d = f.schedule[0];
  f.day = d.day; f.min = d.startMin; f.flare = { def: d, left: 50, maxRad: 0 };
  const h = E.newGame(2, ARCHIVED_FLARES, 5); h.day = d.day; h.min = d.startMin; h.flare = { def: d, left: 50, maxRad: 0 };
  E.step(f, 5, { inBase: false, moving: false, sealed: true }); E.step(h, 5, { inBase: false, moving: false });
  assert(f.player.rad < h.player.rad && f.player.rad > 0);
});

test("Mars mode: gravity, dust storms and slower radio", () => {
  const g = E.newGame(3, ARCHIVED_FLARES, 5, { planet: "mars" });
  assert.strictEqual(g.planet, "mars");
  assert(E.planetOf(g).jump < 1 && E.planetOf(g).deliverSec > E.planetOf(E.newGame(3, ARCHIVED_FLARES, 5)).deliverSec);
  assert(g.storms && g.storms.length >= 1);
});

test("machine changes take time (not instant)", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  assert.strictEqual(E.requestSwitch(g, "lab", 1).ok, true);
  advance(g, 5, IN);
  assert.strictEqual(g.systems.lab.level, 0, "lab should still be switching after 5s");
  advance(g, 6, IN);
  assert.strictEqual(g.systems.lab.level, 1, "lab should be ON after about 10s");
});

test("cannot change a machine that is already changing", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  E.requestSwitch(g, "shield", 2);
  assert.strictEqual(E.requestSwitch(g, "shield", 0).reason, "busy");
});

test("air runs down outside and refills inside", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  advance(g, 20, OUT);
  assert(g.player.air < 80);
  advance(g, 20, IN);
  assert(g.player.air > 95);
});

test("running out of air outside makes you faint", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  advance(g, 80, OUT);
  assert.strictEqual(g.rescues, 1);
  assert.strictEqual(g.day, 2);
});

test("staying up until 2 AM makes you faint", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  untilMin(g, E.CONFIG.faintMin + 5, IN);
  assert.strictEqual(g.rescues, 1);
  assert.strictEqual(g.stats.faints[0].reason, "late");
});

test("can't sleep too early; can sleep in the evening", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  assert.strictEqual(E.sleep(g), null);
  untilMin(g, E.CONFIG.bedtimeOkMin, IN);
  assert.strictEqual(E.sleep(g).how, "sleep");
});

test("ice -> water -> plants -> food, only with greenhouse ON", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.player.ice = 3; E.pourIce(g);
  assert(g.water > 0);
  advance(g, 120, IN);
  assert(g.plots.every((p) => p === 0), "greenhouse OFF: nothing grows");
  g.systems.greenhouse.level = 1;
  advance(g, 110, IN);
  assert(g.plots.every((p) => p >= 1), "greenhouse ON + water: plants ripen");
  assert.strictEqual(E.harvest(g), 4);
});

test("rocks wait in the lab until the lab is ON", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.player.rocks = 2; E.depositRocks(g);
  advance(g, 30, IN);
  assert.strictEqual(g.science, 0);
  g.systems.lab.level = 1;
  advance(g, 25, IN);
  assert.strictEqual(g.science, 20);
});

test("a full set of machines empties the battery: blackout turns everything off", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.systems.greenhouse.level = 1; g.systems.lab.level = 1; g.systems.shield.level = 2;
  g.water = 99; g.labQueue = Array(40).fill("rock");   // busy machines are not switched off
  advance(g, 150, IN);
  assert(g.incidents.some((i) => i.type === "blackout"), "a blackout should have happened");
  assert.strictEqual(g.systems.life.level, 0, "blackout switches everything off; you must restart machines");
  assert.strictEqual(g.systems.lab.level, 0);
});

test("idle lab and greenhouse switch themselves OFF to save power", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.systems.greenhouse.level = 1; g.systems.lab.level = 1;
  advance(g, 6, IN);
  assert.strictEqual(g.systems.lab.level, 0);
  assert.strictEqual(g.systems.greenhouse.level, 0);
});

test("shield strength changes how much radiation you take in a flare", () => {
  function takeFlare(level, inBase) {
    const g = E.newGame(2, ARCHIVED_FLARES, 8);
    g.systems.shield.level = level;
    const f = g.schedule[0];
    g.day = f.day; g.min = f.startMin - 1;
    let peak = 0;
    for (let i = 0; i < 400; i++) { E.step(g, 0.1, { inBase: inBase, moving: false }); peak = Math.max(peak, g.player.rad); if (g.day !== f.day) break; }
    return peak;
  }
  const off = takeFlare(0, true), on = takeFlare(1, true), boost = takeFlare(2, true);
  assert(off > on && on > boost, off + " > " + on + " > " + boost);
});

test("alien rescue happens at most 3 times, then Earth calls you home", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  for (let i = 0; i < 5 && g.status === "playing"; i++) untilMin(g, E.CONFIG.faintMin + 5, IN);
  assert.strictEqual(g.status, "evacuated");
});

// ---------- the rover story ----------
function labReady(g) { g.systems.lab.level = 1; g.systems.lab.target = 1; }

test("research needs 4 studied samples, a lab that is ON, and power for the radio", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  assert.strictEqual(E.researchReady(g), false);
  g.player.rocks = 4; E.depositSamples(g);
  advance(g, 50, IN);
  assert.strictEqual(g.studied, 0, "lab is OFF: nothing studied");
  labReady(g);
  advance(g, 45, IN);
  assert.strictEqual(g.studied, 4);
  assert.strictEqual(E.researchReady(g), true);
});

test("no power, no radio: Earth cannot be reached during a blackout", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.studied = 4;
  g.systems.greenhouse.level = 1; g.systems.lab.level = 1; g.systems.shield.level = 2;
  g.battery = 0.02; E.step(g, 0.1, IN);
  assert.strictEqual(g.blackout, true);
  assert.strictEqual(E.commsOk(g), false);
  assert.strictEqual(E.sendResearch(g).reason, "no_comms");
  g.battery = 50; E.step(g, 0.1, IN);
  assert.strictEqual(E.commsOk(g), true);
  assert.strictEqual(E.sendResearch(g).ok, true);
});

test("a rover part arrives later and must be built by the player", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.studied = 4; E.sendResearch(g);
  assert.strictEqual(g.rover.delivered, 0);
  advance(g, E.CONFIG.rover.deliverSec + 2, IN);
  assert.strictEqual(g.rover.delivered, 1);
  assert.strictEqual(E.partWaiting(g), true);
  assert.strictEqual(E.assemblePart(g), true);
  assert.strictEqual(g.rover.assembled, 1);
  assert.strictEqual(g.rover.built, false);
});

test("two parts build the rover; the rover can reach Sam and end the story", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  for (let i = 0; i < E.CONFIG.rover.partsNeeded; i++) { g.studied = 4; E.sendResearch(g); advance(g, 50, IN); E.assemblePart(g); }
  assert.strictEqual(g.rover.built, true);
  g.battery = 60;
  assert.strictEqual(E.roverTravel(g, "far").reason, "explore_first", "Sam waits until every place is found");
  E.EXPLORE_ORDER.forEach((id) => E.discover(g, id));
  const m0 = g.min, b0 = g.battery;
  assert.strictEqual(E.roverTravel(g, "far").ok, true);
  assert(g.battery < b0 && g.min > m0, "a trip costs battery and time");
  assert.strictEqual(E.meetCrew(g), true);
  assert.strictEqual(g.status, "won");
  assert(E.starRating(g) >= 1);
});

test("endless mode: meeting Sam does not end the game; you can finish whenever you like", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, Infinity);
  assert.strictEqual(g.endless, true);
  g.schedule.forEach((f) => assert(f.day >= 2 && f.day < 41));
  assert(g.schedule.length >= 8, "endless mode plans many flares");
  g.rover.built = true; g.battery = 80; g.crystalUnlocked = true;
  assert.strictEqual(E.roverTravel(g, "far").ok, true, "no exploring needed in endless mode");
  assert.strictEqual(E.meetCrew(g), true);
  assert.strictEqual(g.status, "playing");
  for (let i = 0; i < 20 && g.status === "playing"; i++) { g.min = 20 * 60; E.sleep(g); }
  assert.strictEqual(g.status, "playing", "no day limit");
  assert.strictEqual(E.endMission(g), true);
  assert.strictEqual(g.status, "won");
});

test("after the rover is built, the story asks you to find every place before Sam", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 7);
  g.mq.done.ice = true; g.mq.done.harvest = true; g.rover.built = true;
  g.missions = []; E.topUp(g);
  assert(g.missions.some((m) => m.type === "explore"), "an explore mission appears");
  assert(!g.missions.some((m) => m.type === "meet"));
  E.EXPLORE_ORDER.forEach((id) => E.discover(g, id));
  g.missions = []; E.topUp(g);
  assert(g.missions.some((m) => m.type === "meet"), "then the Sam mission appears");
});

test("the rover refuses trips when unsafe: no rover, flare, low battery, too late", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  assert.strictEqual(E.roverTravel(g, "crater").reason, "no_rover");
  g.rover.built = true; g.crystalUnlocked = true;
  g.battery = 10; assert.strictEqual(E.roverTravel(g, "crater").reason, "power");
  g.battery = 60; g.siren = 5; assert.strictEqual(E.roverTravel(g, "crater").reason, "flare");
  g.siren = 0; g.min = 20 * 60; assert.strictEqual(E.roverTravel(g, "crater").reason, "late");
  g.min = 12 * 60; assert.strictEqual(E.roverTravel(g, "crater").ok, true);
  assert.strictEqual(E.roverTravel(g, "home").ok, true, "you can always ride home");
});

test("metal and crystals are worth more science than rocks", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  labReady(g);
  g.player.metal = 1; g.player.crystal = 1; g.player.rocks = 1; E.depositSamples(g);
  advance(g, 35, IN);
  assert.strictEqual(g.science, 10 + 15 + 20);
});

test("running out of days without Sam ends as 'timeup'", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 3);
  while (g.status === "playing") { untilMin(g, 20 * 60, IN); if (g.status === "playing") E.sleep(g); }
  assert.strictEqual(g.status, "timeup");
});

test("missions: first is getting ice, never more than 2 at once, new ones appear when done", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  assert.strictEqual(g.missions[0].type, "ice");
  assert(g.missions.length <= E.CONFIG.maxActiveMissions);
  g.player.ice = 3; E.pourIce(g);
  const m = g.missions.find((x) => x.type === "ice");
  if (m) { m.done = true; E.claimMission(g, m); }
  assert(g.missions.length <= 2);
  assert(!g.missions.some((x) => x.type === "ice" && !x.done), "ice mission is not repeated");
});

test("tutorial: air generator starts OFF and the three lessons are tracked", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8, { tutorial: true });
  assert.strictEqual(g.systems.life.level, 0);
  assert(g.tutorial && g.tutorial.air === false);
});

test("Zorp's gift unlocks the Crystal Crater; before that the rover refuses", () => {
  const g = E.newGame(1, ARCHIVED_FLARES, 8);
  g.rover.built = true; g.battery = 80;
  assert.notStrictEqual(E.roverTravel(g, "crater").ok, true, "crater is locked at first");
  E.zorpGift(g);
  assert.strictEqual(g.crystalUnlocked, true);
  assert.strictEqual(E.roverTravel(g, "crater").ok, true);
});

test("a flare gives a phone call warning ahead of time", () => {
  const g = E.newGame(2, ARCHIVED_FLARES, 8);
  g.day = g.schedule[0].day; const f = g.schedule[0]; f.alerted = true;
  g.min = f.startMin - E.CONFIG.callLeadMin + 1;
  g.systems.life.level = 1;
  let called = false;
  for (let i = 0; i < 40 && !called; i++) { E.step(g, 0.5, IN); called = g.events.some((e) => e.t === "flare_call"); }
  assert(called, "flare_call event should fire");
});

// ---------- robot players ----------
function finish(g) { return { status: g.status, science: g.science, rescues: g.rescues, day: g.day, incidents: g.incidents.map((i) => i.type) }; }

// 1) Does nothing but sleep.
function idler(seed, days) {
  const g = E.newGame(seed, ARCHIVED_FLARES, days);
  while (g.status === "playing") {
    untilMin(g, 20 * 60, IN);
    if (g.status === "playing") E.sleep(g);
  }
  return finish(g);
}

// 2) Turns every machine on, keeps them busy, never cleans.
function greedy(seed, days) {
  const g = E.newGame(seed, ARCHIVED_FLARES, days);
  while (g.status === "playing") {
    // keeps every machine busy (machines with nothing to do would switch themselves OFF)
    g.systems.greenhouse.level = 1; g.systems.lab.level = 1; g.systems.shield.level = 2;
    g.water = 99; g.plots = g.plots.map(() => 0); g.labQueue = Array(30).fill("rock");
    untilMin(g, 20 * 60, IN);
    if (g.status === "playing") E.sleep(g);
  }
  return finish(g);
}

// 3) Never goes to bed.
function nightOwl(seed, days) {
  const g = E.newGame(seed, ARCHIVED_FLARES, days);
  while (g.status === "playing") untilMin(g, E.CONFIG.faintMin + 5, IN);
  return finish(g);
}

// What a sensible player does after a blackout: restart life support, then the shield.
function tend(g) {
  if (g.blackout) return;
  if (g.systems.life.level === 0 && !g.systems.life.switching) E.requestSwitch(g, "life", 1);
  else if (g.systems.shield.level === 0 && !g.systems.shield.switching) E.requestSwitch(g, "shield", 1);
}

// The rover story: send research, build parts, explore every place, then drive to Sam.
const ROVER_PLACES = { crystalcrater: "crater", alpha: "landing", southpole: "south", northpole: "north" };
function roverWork(g) {
  if (E.researchReady(g) && E.commsOk(g)) E.sendResearch(g);
  E.deliverParts(g);
  while (E.partWaiting(g)) E.assemblePart(g);
  if (!g.rover.built || g.rover.location !== "home") return;
  const ok = () => g.min + 90 <= 20 * 60 && g.battery >= 25 && !g.flare && g.siren <= 0;
  // places you can walk to from the base (free)
  ["cave", "zorp", "tranquility", "earth", "lander"].forEach((id) => E.discover(g, id));
  if (!g.zorpMet) E.zorpGift(g);
  if (!E.mayMeetCrew(g)) {
    const id = Object.keys(ROVER_PLACES).find((k) => !g.discovered[k]);
    if (id && ok()) { if (E.roverTravel(g, ROVER_PLACES[id]).ok) { E.discover(g, id); E.roverTravel(g, "home"); } }
    return;
  }
  if (g.min + 40 <= 20 * 60 && g.battery >= 15 && !g.flare && g.siren <= 0) {
    E.roverTravel(g, "far");
    E.meetCrew(g);
  }
}

// 4) A careful player: does trips (with travel time), manages machines, boosts the shield for forecast flares.
function careful(seed, days) {
  const g = E.newGame(seed, ARCHIVED_FLARES, days);
  let guard = 0;
  while (g.status === "playing" && guard++ < 200) {
    E.openComputer(g);
    tend(g);
    const today = g.day;
    const gone = () => g.day !== today || g.status !== "playing";

    // Morning: boost shield if a flare is forecast for today or tomorrow, and eat.
    const fc = E.forecast(g);
    if (fc.length && g.systems.shield.level < 2) E.requestSwitch(g, "shield", 2);
    E.eat(g);

    // Clean panels when dusty (trip to the solar field)
    if (g.dust > 0.3) { advance(g, 6, OUT); E.cleanPanels(g); advance(g, 6, OUT); advance(g, 6, IN); }
    tend(g);
    if (gone()) continue;

    // Ice run for the greenhouse
    if (g.water < 3) {
      advance(g, 14, OUT); for (let i = 0; i < 3; i++) { E.mineIce(g); advance(g, 2, OUT); } advance(g, 14, OUT);
      advance(g, 6, IN);
      E.pourIce(g);
      if (g.systems.greenhouse.level === 0) E.requestSwitch(g, "greenhouse", 1);
    }
    if (gone()) continue;

    // Rock run, then lab ON
    advance(g, 15, OUT); for (let i = 0; i < 4; i++) { E.collectRock(g); advance(g, 2, OUT); } advance(g, 15, OUT);
    advance(g, 6, IN);
    E.depositRocks(g);
    if (E.effectiveLevel(g, "lab") === 0 && !g.systems.lab.switching) E.requestSwitch(g, "lab", 1);
    if (gone()) continue;
    roverWork(g);
    if (gone()) continue;

    // Stay safe inside during the flare window (11:00-18:00 + warning)
    // Wait inside; turn the lab off to save power if the battery is low.
    for (let k = 0; k < 40 && !gone(); k++) {
      advance(g, 5, IN);
      tend(g);
      if (g.battery < 35 && g.systems.lab.level === 1 && !g.systems.lab.switching) E.requestSwitch(g, "lab", 0);
      if (g.battery < 35 && g.systems.greenhouse.level === 1 && g.plots.every((p) => p >= 1)) E.requestSwitch(g, "greenhouse", 0);
      if (E.harvest(g) > 0) { /* food! */ }
      roverWork(g);
      if (g.status !== "playing") break;
      if (g.min > 19 * 60) break;
    }
    if (gone()) continue;
    // Eat, shield back to normal, bed.
    E.eat(g);
    if (g.systems.shield.level === 2 && !g.flare && g.schedule.every((f) => f.day !== g.day + 1 || !f.alerted)) E.requestSwitch(g, "shield", 1);
    untilMin(g, 20 * 60, IN);
    if (!gone()) E.sleep(g);
  }
  return finish(g);
}

function summarize(name, fn, days) {
  const N = 60;
  const out = { won: 0, evac: 0, sci: 0, rescues: 0, blackout: 0, stars: [0, 0, 0, 0] };
  for (let seed = 1; seed <= N; seed++) {
    const r = fn(seed, days);
    if (r.status === "won") { out.won++; out.sci += r.science; }
    if (r.status === "timeup") out.timeup = (out.timeup || 0) + 1;
    if (r.status === "won" || r.status === "timeup") out.fin = (out.fin || 0) + 1;
    if (r.status === "evacuated") out.evac++;
    out.rescues += r.rescues;
    if (r.incidents.includes("blackout")) out.blackout++;
  }
  console.log(
    name.padEnd(34) + "won " + String(out.won).padStart(2) + "/" + N + "  timeup " + String(out.timeup || 0).padStart(2) + "  evacuated " + String(out.evac).padStart(2) +
    "  avg science " + String(out.won ? Math.round(out.sci / out.won) : 0).padStart(4) +
    "  avg rescues " + (out.rescues / N).toFixed(1) + "  blackouts " + out.blackout + "/" + N
  );
  return Object.assign(out, { N: N });
}

console.log("\nRobot players (7-day missions, 60 seeds each):");
const R = {
  idler: summarize("Does nothing, just sleeps", idler, 7),
  greedy: summarize("All machines ON, never cleans", greedy, 7),
  owl: summarize("Never goes to bed", nightOwl, 7),
  careful: summarize("Careful explorer", careful, 7)
};
console.log("\nShort mission (5 days):");
summarize("Careful explorer", careful, 5);

test("never going to bed ends the mission (Zorp gets tired)", () => assert(R.owl.evac === R.owl.N));
test("doing nothing (never cleaning panels) fails the mission and scores nothing", () => { assert(R.idler.evac + (R.idler.timeup || 0) === R.idler.N); assert(R.idler.won === 0); assert(R.idler.sci === 0); });
test("running everything causes blackouts", () => assert(R.greedy.blackout > R.greedy.N * 0.8));
test("a careful explorer usually finishes AND reaches Sam", () => assert(R.careful.won >= R.careful.N * 0.8, "won " + R.careful.won));
test("a careful explorer earns science", () => assert(R.careful.sci / Math.max(1, R.careful.won) > 120));

test("Mars dust storms have a severity: stronger storms cut solar power more, and build up then fade", () => {
  const g = E.newGame(5, ARCHIVED_FLARES, 7, { planet: "mars" });
  const d = g.storms[0];
  g.day = d; g.stormSev[d] = 1;
  g.min = 8 * 60; assert.strictEqual(E.stormLevel(g), 0);
  g.min = 10.5 * 60; const strong = E.stormLevel(g); assert.ok(strong > 0.95);
  const pStrong = E.powerReport(g).gain;
  g.stormSev[d] = 0.4; const weak = E.stormLevel(g); assert.ok(weak < strong);
  assert.ok(E.powerReport(g).gain > pStrong);
  g.min = 9.2 * 60; assert.ok(E.stormLevel(g) < weak);      // builds up slowly
  g.min = 16.9 * 60; assert.ok(E.stormLevel(g) < 0.1);       // fades away
});
test("the bag stops at 4 ice or 4 samples", () => {
  const g = E.newGame(3, ARCHIVED_FLARES, 7);
  g.player.energy = 100;
  for (let i = 0; i < 6; i++) E.mineIce(g);
  assert.strictEqual(g.player.ice, 4);
  for (let i = 0; i < 6; i++) E.collectRock(g);
  assert.strictEqual(E.carried(g), 4);
});

test("the first time radiation builds up, Dr. Nova relates it to the radiation badge (once)", () => {
  const g = E.newGame(2, ARCHIVED_FLARES, 5);
  g.clock = 20; g.player.rad = 6; g.coachCool = 0;
  E.step(g, 0.1, { inBase: true, moving: false });
  const first = g.events.filter((e) => e.t === "coach" && e.id === "radbadge").length;
  assert.strictEqual(first, 1);
  g.coachCool = 0; E.step(g, 0.1, { inBase: true, moving: false });
  assert.strictEqual(g.events.filter((e) => e.t === "coach" && e.id === "radbadge").length, 1);
});
test("claiming the ice mission asks the player to switch the greenhouse ON", () => {
  const g = E.newGame(2, ARCHIVED_FLARES, 5);
  g.systems.greenhouse.level = 0;
  const i = g.missions.findIndex((m) => m.type === "ice");
  g.food = 0;
  if (i >= 0) { g.missions[i].done = true; E.claimMission(g, i); assert.ok(g.events.some((e) => e.t === "hint" && e.id === "gh_ask")); }
});
test("with more than 3 apples already, nobody nags about the greenhouse", () => {
  const g = E.newGame(2, ARCHIVED_FLARES, 5);
  g.systems.greenhouse.level = 0; g.food = 4;
  const i = g.missions.findIndex((m) => m.type === "ice");
  if (i >= 0) { g.missions[i].done = true; E.claimMission(g, i); assert.ok(!g.events.some((e) => e.t === "hint" && e.id === "gh_ask")); }
});

test("with more than 10 apples, Earth does not push the player to switch the greenhouse on", () => {
  const g = E.newGame(2, ARCHIVED_FLARES, 5);
  g.systems.greenhouse.level = 0; g.food = 11;
  const i = g.missions.findIndex((m) => m.type === "ice");
  if (i >= 0) { g.missions[i].done = true; E.claimMission(g, i); assert.ok(!g.events.some((e) => e.t === "hint" && e.id === "gh_ask")); }
});

test("jump facts come every 10-15 jumps and at most 4 per day", () => {
  const st = {}; let shown = 0, gaps = [], last = 0;
  for (let i = 1; i <= 400; i++) { if (E.jumpFactStep(st, 1)) { shown++; gaps.push(i - last); last = i; } }
  assert.strictEqual(shown, 4, "max 4 on one day");
  assert.ok(gaps.every((x) => x >= 10 && x <= 15), "gaps " + gaps);
  let shown2 = 0; for (let i = 0; i < 60; i++) if (E.jumpFactStep(st, 2)) shown2++;
  assert.ok(shown2 >= 1 && shown2 <= 4, "new day resets the count");
});
test("Mars has plenty of gravity facts and the lander discovery has Viking photos", () => {
  const D = require("../data.js");
  assert.ok(D.MARS_GRAVITY_FACTS.length >= 8);
  assert.ok(D.MARS_DISCOVERIES.lander.pages.filter((p) => p.localPhoto).length === 2);
  assert.ok(D.MARS_DISCOVERIES.crystalcrater.pages.some((p) => /sulfur/.test(p.localPhoto || "")));
});

console.log("\n" + passed + " checks passed");
