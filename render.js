// render.js — DRAWING. Turns the game's numbers into little pixel pictures.
// Everything is drawn with simple rectangles and shapes (no image files needed!).
// The picture is tiny (480 x 270) and gets scaled up, which gives the chunky pixel look.

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); ctx.fill();
}
function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function ctx_dome(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(Math.round(cx), Math.round(cy), rx, ry, 0, Math.PI, 0); ctx.fill();
}
function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath(); ctx.fill();
}

// -----------------------------------------------------------------------
// The ground, painted once (it never changes)
// -----------------------------------------------------------------------
function buildBackground(planet) {
  const c = document.createElement("canvas");
  c.width = WORLD.w; c.height = WORLD.h;
  const x = c.getContext("2d");
  const rng = makeRng(4242);

  px(x, 0, 0, WORLD.w, WORLD.h, "#0d0f18");
  const speck = ["#7b7e89", "#9a9da8", "#6e717c", "#a4a7b2"];
  REGION_IDS.forEach((id) => {
    const R = REGIONS[id];
    px(x, R.x, R.y, R.w, R.h, "#262935");
    px(x, R.x + RIM, R.y + RIM, R.w - 2 * RIM, R.h - 2 * RIM, R.ground || "#8b8e99");
    const area = (R.w * R.h) / (1800 * 1300);
    for (let i = 0; i < 170 * area + 12; i++) {
      const rx = 40 + rng() * 120;
      oval(x, R.x + RIM + rng() * (R.w - 2 * RIM), R.y + RIM + rng() * (R.h - 2 * RIM), rx, rx * 0.6,
           rng() < 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.04)");
    }
    for (let i = 0; i < 11000 * area + 500; i++) {
      px(x, R.x + RIM + rng() * (R.w - 2 * RIM), R.y + RIM + rng() * (R.h - 2 * RIM), rng() < 0.3 ? 2 : 1, 1, speck[Math.floor(rng() * speck.length)]);
    }
  });

  // Craters
  function crater(cx, cy, r) {
    oval(x, cx, cy + 2, r + 2, r * 0.7 + 2, "rgba(40,42,55,0.30)");
    oval(x, cx, cy, r, r * 0.68, "#7a7d88");
    oval(x, cx + 2, cy + 3, r * 0.82, r * 0.52, "#6c6f7b");
    x.strokeStyle = "#aeb1bd"; x.lineWidth = 2;
    x.beginPath(); x.ellipse(cx, cy, r, r * 0.68, 0, Math.PI * 1.05, Math.PI * 1.75); x.stroke();
  }
  for (let i = 0; i < 46; i++) {
    const cx = RIM + 60 + rng() * (1800 - 2 * RIM - 120);
    const cy = RIM + 60 + rng() * (1300 - 2 * RIM - 120);
    if (Math.hypot(cx - BASE.x, cy - BASE.y) < BASE.radius + 110) continue;
    if (Math.hypot(cx - ICE_CRATER.x, cy - ICE_CRATER.y) < 200) continue;
    if (Math.hypot(cx - 1650, cy - 880) < 150) continue;
    crater(cx, cy, 14 + rng() * 40);
  }

  // Footprint trails to the ice crater and the rock field (a hint for explorers)
  function trail(tx, ty) {
    const sx = BASE.x, sy = BASE.y - 10;
    const n = Math.floor(Math.hypot(tx - sx, ty - sy) / 16);
    for (let i = 4; i < n - 6; i++) {
      const k = i / n;
      const wob = Math.sin(k * 9) * 10;
      px(x, sx + (tx - sx) * k + wob, sy + (ty - sy) * k, 3, 2, "rgba(60,62,74,0.45)");
    }
  }
  trail(ICE_CRATER.x - 40, ICE_CRATER.y + 70);
  trail(ROCK_FIELD.x + 60, ROCK_FIELD.y + 60);

  // Round concrete pad under the base
  x.save();
  oval(x, BASE.x, BASE.y, BASE.radius - 14, BASE.radius - 14, "#7b808e");
  x.beginPath(); x.arc(BASE.x, BASE.y, BASE.radius - 20, 0, 6.2832); x.fillStyle = "#b3b8c4"; x.fill(); x.clip();
  for (let gx = BASE.x - BASE.radius; gx < BASE.x + BASE.radius; gx += 42) px(x, gx, BASE.y - BASE.radius, 1, BASE.radius * 2, "#a0a5b2");
  for (let gy = BASE.y - BASE.radius; gy < BASE.y + BASE.radius; gy += 42) px(x, BASE.x - BASE.radius, gy, BASE.radius * 2, 1, "#a0a5b2");
  x.restore();

  // Ice crater
  oval(x, ICE_CRATER.x, ICE_CRATER.y + 4, ICE_CRATER.r + 8, ICE_CRATER.r * 0.78 + 8, "rgba(30,34,50,0.35)");
  oval(x, ICE_CRATER.x, ICE_CRATER.y, ICE_CRATER.r, ICE_CRATER.r * 0.78, "#69728a");
  oval(x, ICE_CRATER.x, ICE_CRATER.y + 6, ICE_CRATER.r * 0.82, ICE_CRATER.r * 0.6, "#4d566e");
  oval(x, ICE_CRATER.x, ICE_CRATER.y + 10, ICE_CRATER.r * 0.55, ICE_CRATER.r * 0.4, "#3c4459");
  x.strokeStyle = "#b9bdcb"; x.lineWidth = 3;
  x.beginPath(); x.ellipse(ICE_CRATER.x, ICE_CRATER.y, ICE_CRATER.r, ICE_CRATER.r * 0.78, 0, Math.PI * 1.05, Math.PI * 1.8); x.stroke();

  // Rock field
  oval(x, ROCK_FIELD.x, ROCK_FIELD.y, ROCK_FIELD.r + 20, ROCK_FIELD.r * 0.7, "#7f828d");
  for (let i = 0; i < 40; i++) {
    const a = rng() * 6.28, d = rng() * ROCK_FIELD.r;
    const rx = ROCK_FIELD.x + Math.cos(a) * d * 1.1, ry = ROCK_FIELD.y + Math.sin(a) * d * 0.65;
    px(x, rx, ry, 2 + Math.floor(rng() * 3), 2, rng() < 0.5 ? "#6a6c77" : "#9a9ca6");
  }

  // Old lander
  (function lander(cx, cy) {
    oval(x, cx, cy + 14, 42, 9, "rgba(0,0,0,0.25)");
    ["#6b7280"].forEach((c) => {
      x.strokeStyle = c; x.lineWidth = 3;
      x.beginPath(); x.moveTo(cx - 14, cy - 2); x.lineTo(cx - 36, cy + 14); x.moveTo(cx + 14, cy - 2); x.lineTo(cx + 36, cy + 14);
      x.moveTo(cx - 6, cy + 2); x.lineTo(cx - 14, cy + 15); x.moveTo(cx + 6, cy + 2); x.lineTo(cx + 14, cy + 15); x.stroke();
    });
    px(x, cx - 40, cy + 13, 9, 3, "#9ca3af"); px(x, cx + 31, cy + 13, 9, 3, "#9ca3af");
    px(x, cx - 18, cy - 14, 36, 18, "#d4a62f");            // gold foil body
    px(x, cx - 18, cy - 14, 36, 3, "#f0c85a");
    px(x, cx - 12, cy - 9, 10, 8, "#7c5f14");
    px(x, cx + 3, cy - 9, 10, 8, "#7c5f14");
    px(x, cx - 1, cy - 26, 2, 12, "#9ca3af"); px(x, cx - 6, cy - 28, 12, 3, "#e5e7eb");  // antenna dish
    px(x, cx + 18, cy - 8, 20, 12, "#2c5aa0"); px(x, cx + 18, cy - 8, 20, 2, "#6ea0e0"); // little solar panel
  })(planet === "mars" ? 2760 : 270, planet === "mars" ? 335 : 1086);

  // Zorp's cave
  (function cave(cx, cy) {
    poly(x, [[cx - 70, cy + 20], [cx - 52, cy - 36], [cx - 20, cy - 54], [cx + 24, cy - 56], [cx + 56, cy - 34], [cx + 74, cy + 20]], "#5b5e6e");
    poly(x, [[cx - 54, cy + 20], [cx - 40, cy - 26], [cx - 14, cy - 42], [cx + 22, cy - 44], [cx + 44, cy - 26], [cx + 58, cy + 20]], "#6d7083");
    poly(x, [[cx - 30, cy + 20], [cx - 24, cy - 8], [cx - 6, cy - 20], [cx + 14, cy - 20], [cx + 30, cy - 6], [cx + 34, cy + 20]], "#1b1630");
    // crystals
    [[-62, 6, "#c084fc"], [-50, 12, "#a855f7"], [52, 8, "#c084fc"], [62, 14, "#7c3aed"], [-22, 22, "#e9d5ff"], [26, 22, "#a855f7"]].forEach((k) => {
      poly(x, [[cx + k[0] - 4, cy + k[1] + 4], [cx + k[0], cy + k[1] - 14], [cx + k[0] + 4, cy + k[1] + 4]], k[2]);
    });
  })(1500, 1080);

  // Earth lookout platform
  (function lookout(cx, cy) {
    oval(x, cx, cy + 6, 48, 22, "rgba(0,0,0,0.25)");
    oval(x, cx, cy, 44, 19, "#7d8394");
    oval(x, cx, cy - 2, 38, 15, "#b8bdca");
    // telescope
    if (planet !== "mars") {                               // (the Mars telescope is painted after the colour grade, so it stays silver)
      x.strokeStyle = "#475569"; x.lineWidth = 3;
      x.beginPath(); x.moveTo(cx - 8, cy + 6); x.lineTo(cx, cy - 6); x.lineTo(cx + 8, cy + 6); x.stroke();
      x.save(); x.translate(cx, cy - 8); x.rotate(-0.7);
      px(x, -14, -4, 30, 8, "#e5e7eb"); px(x, 12, -5, 6, 10, "#94a3b8"); px(x, -14, -4, 4, 8, "#334155");
      x.restore();
    }
  })(1632, 640);

  // ----- Rover Bay (a flat landing pad next to the base) -----
  (function bay() {
    const b = BAY;
    px(x, b.x - 3, b.y - 3, b.w + 6, b.h + 6, "#6d7385");
    px(x, b.x, b.y, b.w, b.h, "#a7aebd");
    for (let i = 0; i < b.w; i += 12) { px(x, b.x + i, b.y, 6, 4, "#facc15"); px(x, b.x + i, b.y + b.h - 4, 6, 4, "#facc15"); }
    for (let i = 0; i < b.h; i += 12) { px(x, b.x, b.y + i, 4, 6, "#facc15"); px(x, b.x + b.w - 4, b.y + i, 4, 6, "#facc15"); }
    x.strokeStyle = "#e2e8f0"; x.lineWidth = 2; x.beginPath(); x.arc(b.x + b.w / 2, b.y + b.h / 2 + 2, 20, 0, 6.3); x.stroke();
  })();

  // ----- A small rover pad in every far-away region -----
  ROVER_REGIONS.forEach((id) => {
    const p = padOf(id);
    px(x, p.x - 30, p.y - 14, 76, 40, "#6d7385"); px(x, p.x - 28, p.y - 12, 72, 36, "#a7aebd");
    for (let i = 0; i < 72; i += 12) { px(x, p.x - 28 + i, p.y - 12, 6, 3, "#facc15"); px(x, p.x - 28 + i, p.y + 21, 6, 3, "#facc15"); }
  });

  // ----- Crystal Crater: a purple bowl full of crystals -----
  (function crystalCrater(cx, cy, r) {
    oval(x, cx, cy + 4, r + 10, r * 0.72 + 10, "rgba(30,20,50,0.35)");
    oval(x, cx, cy, r, r * 0.72, "#5b4a7a");
    oval(x, cx, cy + 6, r * 0.8, r * 0.55, "#41335e");
    oval(x, cx, cy + 10, r * 0.5, r * 0.34, "#2d2244");
    x.strokeStyle = "#c9b8e8"; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, r, r * 0.72, 0, Math.PI * 1.05, Math.PI * 1.8); x.stroke();
    for (let i = 0; i < 22; i++) {
      const a = rng() * 6.28, d = r * (0.9 + rng() * 0.25);
      const px0 = cx + Math.cos(a) * d, py0 = cy + Math.sin(a) * d * 0.72, h = 6 + rng() * 10;
      { const pal = [["#facc15", "#fde68a"], ["#f8fafc", "#cbd5e1"], ["#22c55e", "#86efac"], ["#ef4444", "#fca5a5"]][Math.floor(rng() * 4)]; poly(x, [[px0 - 3, py0 + 3], [px0, py0 - h], [px0 + 3, py0 + 3]], pal[0]); poly(x, [[px0 - 1, py0 + 3], [px0, py0 - h + 2], [px0 + 1, py0 + 3]], pal[1]); }
    }
  })(CRYSTAL_CRATER.x, CRYSTAL_CRATER.y, CRYSTAL_CRATER.r);

  // ----- Landing Site Alpha: an old landing stage and scattered metal -----
  (function alpha(cx, cy) {
    oval(x, cx, cy + 16, 46, 9, "rgba(0,0,0,0.25)");
    x.strokeStyle = "#6b7280"; x.lineWidth = 3;
    x.beginPath(); x.moveTo(cx - 12, cy); x.lineTo(cx - 36, cy + 16); x.moveTo(cx + 12, cy); x.lineTo(cx + 36, cy + 16); x.stroke();
    px(x, cx - 40, cy + 15, 9, 3, "#9ca3af"); px(x, cx + 31, cy + 15, 9, 3, "#9ca3af");
    px(x, cx - 20, cy - 14, 40, 18, "#c9a227"); px(x, cx - 20, cy - 14, 40, 3, "#eac95a");
    px(x, cx - 6, cy - 22, 12, 8, "#9ca3af");
    for (let i = 0; i < 14; i++) {
      const sx = METAL_FIELD.x + (rng() - 0.5) * 220, sy = METAL_FIELD.y + (rng() - 0.5) * 120;
      px(x, sx, sy, 3 + Math.floor(rng() * 4), 2, rng() < 0.5 ? "#b8c0cc" : "#8a94a6");
    }
  })(2240, 748);

  // ----- South Pole: a very dark crater with ice and a bright peak -----
  (function south(cx, cy) {
    oval(x, cx, cy + 4, 120, 80, "rgba(20,30,60,0.35)");
    oval(x, cx, cy, 112, 70, "#4b5878"); oval(x, cx, cy + 8, 84, 48, "#2c3652"); oval(x, cx + 4, cy + 12, 50, 28, "#1c2339");
    for (let i = 0; i < 16; i++) px(x, cx - 50 + rng() * 100, cy - 10 + rng() * 50, 2, 2, "#bfe9ff");
    poly(x, [[cx + 190, cy + 40], [cx + 230, cy - 60], [cx + 270, cy + 40]], "#e5e9f5");
    poly(x, [[cx + 230, cy - 60], [cx + 270, cy + 40], [cx + 238, cy + 40]], "#b7bfd6");
    oval(x, cx + 240, cy + 44, 50, 8, "rgba(0,0,0,0.25)");
  })(2230, 1270);

  // ----- North Pole: tall peaks with long shadows -----
  (function north(cx, cy) {
    [[-110, 40], [-20, 20], [90, 50], [170, 10]].forEach((k) => {
      const bx = cx + k[0], by = cy + k[1];
      poly(x, [[bx - 34, by + 30], [bx, by - 54], [bx + 34, by + 30]], "#c4c9d8");
      poly(x, [[bx, by - 54], [bx + 34, by + 30], [bx + 6, by + 30]], "#8f96ab");
      poly(x, [[bx + 34, by + 30], [bx + 110, by + 44], [bx + 30, by + 40]], "rgba(20,24,40,0.25)");
    });
  })(2930, 240);

  // ----- Far Side Camp: Sam's tent, panels and radio mast -----
  (function camp(cx, cy) {
    oval(x, cx, cy + 40, 60, 10, "rgba(0,0,0,0.25)");
    px(x, cx - 30, cy - 10, 60, 40, "#d9dee9");
    ctx_dome(x, cx, cy - 10, 30, 26, "#f1f4fa");
    px(x, cx - 8, cy + 8, 16, 22, "#3b6ea8");
    px(x, cx - 24, cy + 0, 10, 8, "#7dd3fc"); px(x, cx + 14, cy + 0, 10, 8, "#7dd3fc");
    px(x, cx + 44, cy - 6, 2, 36, "#94a3b8"); px(x, cx + 38, cy - 8, 14, 3, "#e5e7eb");
    for (let i = 0; i < 3; i++) { px(x, cx - 90 + i * 26, cy + 30, 24, 14, "#2c5aa0"); px(x, cx - 90 + i * 26, cy + 30, 24, 2, "#7fb0ee"); }
  })(3040, 700);

  // ----- Tranquility Base: Eagle's descent stage, the flag and footprints -----
  (function marsSite(cx, cy) {
    if (planet !== "mars") return;
    // Ingenuity's airfield: a landing pad with the little helicopter, and a Wright Flyer wing patch
    oval(x, cx, cy + 14, 46, 12, "rgba(0,0,0,0.25)");
    oval(x, cx, cy + 10, 40, 10, "#b9805c"); oval(x, cx, cy + 10, 34, 8, "#a86f4d");
    x.strokeStyle = "#e5d3c0"; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy + 10, 26, 6, 0, 0, 6.3); x.stroke();
    px(x, cx - 1, cy - 14, 2, 22, "#2b2d36");                          // mast
    px(x, cx - 24, cy - 16, 48, 2, "#e5e7eb"); px(x, cx - 24, cy - 21, 48, 2, "#cbd5e1");   // rotor blades
    px(x, cx - 6, cy - 8, 12, 12, "#f1f5f9"); px(x, cx - 6, cy - 8, 12, 2, "#fff");        // body
    px(x, cx - 10, cy + 4, 2, 6, "#94a3b8"); px(x, cx + 8, cy + 4, 2, 6, "#94a3b8");       // legs
    px(x, cx - 8, cy - 4, 4, 5, "#1d4ed8"); px(x, cx + 4, cy - 4, 4, 5, "#1d4ed8");        // solar panel
    for (let i = 0; i < 9; i++) px(x, cx + 50 + i * 8, cy + 34 + (i % 2) * 5 - i * 2, 4, 6, "rgba(90,50,35,0.45)");   // wheel tracks
  })(1630, 880);
  (function tranquility(cx, cy) {
    if (planet === "mars") return;
    oval(x, cx, cy + 22, 44, 11, "rgba(0,0,0,0.28)");
    // landing legs and footpads
    x.strokeStyle = "#8b93a3"; x.lineWidth = 3;
    x.beginPath(); x.moveTo(cx - 14, cy + 4); x.lineTo(cx - 36, cy + 22); x.moveTo(cx + 14, cy + 4); x.lineTo(cx + 36, cy + 22); x.moveTo(cx - 4, cy + 8); x.lineTo(cx - 10, cy + 24); x.moveTo(cx + 4, cy + 8); x.lineTo(cx + 10, cy + 24); x.stroke();
    px(x, cx - 41, cy + 21, 10, 3, "#b4bac8"); px(x, cx + 31, cy + 21, 10, 3, "#b4bac8"); px(x, cx - 15, cy + 23, 10, 3, "#b4bac8"); px(x, cx + 5, cy + 23, 10, 3, "#b4bac8");
    // the gold-foil descent stage (an eight-sided platform)
    poly(x, [[cx - 22, cy - 6], [cx - 14, cy - 16], [cx + 14, cy - 16], [cx + 22, cy - 6], [cx + 22, cy + 6], [cx + 14, cy + 12], [cx - 14, cy + 12], [cx - 22, cy + 6]], "#c9a227");
    poly(x, [[cx - 22, cy - 6], [cx - 14, cy - 16], [cx + 14, cy - 16], [cx + 22, cy - 6]], "#e9cb62");
    px(x, cx - 20, cy - 3, 40, 2, "#a8861a"); px(x, cx - 20, cy + 3, 40, 2, "#a8861a");
    px(x, cx - 7, cy - 12, 14, 7, "#2b2d36"); px(x, cx - 5, cy - 10, 10, 3, "#5b6070");   // engine bell hole
    // ladder and plaque
    px(x, cx + 22, cy - 2, 3, 22, "#cbd5e1"); for (let i = 0; i < 4; i++) px(x, cx + 20, cy + i * 5, 7, 1, "#cbd5e1");
    px(x, cx + 28, cy + 6, 9, 6, "#d9dee9"); px(x, cx + 29, cy + 7, 7, 1, "#6b7280"); px(x, cx + 29, cy + 9, 7, 1, "#6b7280");
    // footprints
    for (let i = 0; i < 9; i++) { px(x, cx + 20 + i * 8, cy + 34 + (i % 2) * 5 - i * 2, 3, 5, "rgba(70,72,84,0.55)"); }
    // the American flag, planted a little way from the lander
    const fx = cx + 74, fy = cy - 8;
    oval(x, fx, fy + 24, 8, 3, "rgba(0,0,0,0.25)");
    px(x, fx, fy - 40, 2, 64, "#e5e7eb"); px(x, fx, fy - 40, 36, 2, "#9ca3af");      // pole and the rod along the top
    px(x, fx + 2, fy - 38, 34, 22, "#fff");
    for (let i = 0; i < 4; i++) px(x, fx + 2, fy - 38 + i * 6, 34, 3, "#d9302b");
    px(x, fx + 2, fy - 38, 15, 12, "#1d3f9e");
    for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 4; c2++) px(x, fx + 4 + c2 * 3.4, fy - 36 + r2 * 3.6, 1, 1, "#fff");
  })(1630, 880);

  // ----- Moon cave: dark rock, glowing crystals, a bright skylight -----
  (function caveInside() {
    const Rc = REGIONS.cave, cx0 = Rc.x + RIM, cy0 = Rc.y + RIM, w = Rc.w - 2 * RIM, h = Rc.h - 2 * RIM;
    px(x, cx0, cy0, w, h, "#3b3550");
    for (let i = 0; i < 60; i++) oval(x, cx0 + rng() * w, cy0 + rng() * h, 20 + rng() * 60, 10 + rng() * 26, rng() < 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.08)");
    // a skylight shaft with a beam of sunlight
    poly(x, [[Rc.x + 300, cy0], [Rc.x + 360, cy0], [Rc.x + 420, Rc.y + 400], [Rc.x + 230, Rc.y + 400]], "rgba(253,230,138,0.10)");
    oval(x, Rc.x + 330, Rc.y + 400, 90, 22, "rgba(253,230,138,0.14)");
    // stalagmites and crystals
    for (let i = 0; i < 26; i++) {
      const sx = cx0 + 20 + rng() * (w - 40), sy = cy0 + 30 + rng() * (h - 60);
      if (Math.hypot(sx - 2900, sy - 1296) < 60 || Math.hypot(sx - 2700, sy - 1456) < 70) continue;
      const hh = 10 + rng() * 22;
      poly(x, [[sx - 6, sy + 4], [sx, sy - hh], [sx + 6, sy + 4]], rng() < 0.5 ? "#5f5878" : "#4a4560");
      if (rng() < 0.5) poly(x, [[sx + 6, sy + 4], [sx + 10, sy - hh * 0.6], [sx + 14, sy + 4]], rng() < 0.5 ? "#a855f7" : "#c084fc");
    }
    // Zorp's glowing pool
    oval(x, 2900, 1300, 70, 26, "rgba(168,85,247,0.22)"); oval(x, 2900, 1300, 46, 16, "rgba(216,180,254,0.25)");
    // the way out (a bright opening)
    px(x, 2676, 1420, 48, 44, "#0b0f1d"); px(x, 2680, 1424, 40, 40, "#fde68a"); px(x, 2684, 1428, 32, 36, "#fff7c2");
  })();

  // Mountain wall around the edge of every region
  function ridge(horizontal, fixed, length, dir, off, cols, gap) {
    cols = cols || ["#4a4e60", "#7a8096"];
    for (let i = 0; i < length; i += 18) {
      if (gap && off + i + 20 > gap[0] && off + i < gap[1]) continue;      // leave the gap in the wall open
      const h = RIM - 6 + rng() * 22;
      const a = off + i, b = off + i + 20, m = off + i + 10;
      const pts = horizontal
        ? [[a, fixed], [m, fixed + dir * h], [b, fixed]]
        : [[fixed, a], [fixed + dir * h, m], [fixed, b]];
      poly(x, pts, cols[0]);
      const pts2 = horizontal
        ? [[m - 4, fixed + dir * (h - 10)], [m, fixed + dir * h], [m + 5, fixed + dir * (h - 8)]]
        : [[fixed + dir * (h - 10), m - 4], [fixed + dir * h, m], [fixed + dir * (h - 8), m + 5]];
      poly(x, pts2, cols[1]);
    }
  }
  REGION_IDS.forEach((id) => {
    const R = REGIONS[id];
    const cc = id === "cave" ? ["#2a2540", "#5a5078"] : null;
    const gTop = GATES.find((q) => q.region === id && q.side === "top"), gBot = GATES.find((q) => q.region === id && q.side === "bottom");
    const gr = (gt) => gt ? [gt.x - GAP_W / 2, gt.x + GAP_W / 2] : null;
    ridge(true, R.y + RIM + 4, R.w, -1, R.x, cc, gr(gTop));
    ridge(true, R.y + R.h - RIM - 4, R.w, 1, R.x, cc, gr(gBot));
    ridge(false, R.x + RIM + 4, R.h, -1, R.y, cc);
    ridge(false, R.x + R.w - RIM - 4, R.h, 1, R.y, cc);
    const band = (y, g2) => {
      if (!g2) { px(x, R.x, y, R.w, RIM - 10, "#262935"); return; }
      px(x, R.x, y, g2[0] - R.x, RIM - 10, "#262935"); px(x, g2[1], y, R.x + R.w - g2[1], RIM - 10, "#262935");
    };
    band(R.y, gr(gTop)); band(R.y + R.h - RIM + 10, gr(gBot));
    px(x, R.x, R.y, RIM - 10, R.h, "#262935"); px(x, R.x + R.w - RIM + 10, R.y, RIM - 10, R.h, "#262935");
  });
  // The pathways through the wall: a lit path with yellow edge stripes and arrows
  GATES.forEach((gt) => {
    const R = REGIONS[gt.region], top = gt.side === "top";
    const y0 = top ? R.y : R.y + R.h - RIM - 14, h = RIM + 14;
    px(x, gt.x - GAP_W / 2, y0, GAP_W, h, R.ground || "#8b8e99");
    px(x, gt.x - 34, y0, 68, h, "#a7aebd"); px(x, gt.x - 30, y0, 60, h, "#c4c9d6");
    for (let j = 0; j < h; j += 12) { px(x, gt.x - 34, y0 + j, 3, 6, "#facc15"); px(x, gt.x + 31, y0 + j, 3, 6, "#facc15"); }
    for (let j = 0; j < 3; j++) {
      const ay = top ? y0 + 12 + j * 16 : y0 + h - 12 - j * 16;
      poly(x, top ? [[gt.x - 8, ay + 6], [gt.x, ay - 4], [gt.x + 8, ay + 6]] : [[gt.x - 8, ay - 6], [gt.x, ay + 4], [gt.x + 8, ay - 6]], "rgba(250,204,21,0.8)");
    }
    // two little lamp posts at the mouth of the path
    [-GAP_W / 2 + 6, GAP_W / 2 - 6].forEach((ox) => { const ly = top ? y0 + h + 4 : y0 - 4; px(x, gt.x + ox - 1, ly - 10, 2, 12, "#475569"); px(x, gt.x + ox - 2, ly - 12, 4, 3, "#fde68a"); });
  });

  // Boulders
  BOULDERS.forEach((b) => {
    oval(x, b.x + 2, b.y + b.r * 0.6, b.r * 1.1, b.r * 0.5, "rgba(0,0,0,0.28)");
    oval(x, b.x, b.y, b.r, b.r * 0.85, b.shade < 0.5 ? "#6f727e" : "#80838f");
    oval(x, b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.55, b.r * 0.4, "#9a9dab");
  });
  if (planet === "mars") {                            // butterscotch sky-lit ground, rusty rocks
    x.globalCompositeOperation = "multiply";
    x.fillStyle = "#e0905f"; x.fillRect(0, 0, WORLD.w, WORLD.h);
    x.globalCompositeOperation = "source-over";
    // Earth lookout telescope: silver with a black stripe, drawn after the grade so it does not blend into the red ground
    (function marsScope(cx, cy) {
      x.strokeStyle = "#0b0f19"; x.lineWidth = 4;
      x.beginPath(); x.moveTo(cx - 9, cy + 7); x.lineTo(cx, cy - 6); x.lineTo(cx + 9, cy + 7); x.stroke();
      x.strokeStyle = "#d1d5db"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(cx - 9, cy + 7); x.lineTo(cx, cy - 6); x.lineTo(cx + 9, cy + 7); x.stroke();
      x.save(); x.translate(cx, cy - 8); x.rotate(-0.7);
      px(x, -16, -6, 36, 12, "#0b0f19");                   // dark outline
      px(x, -15, -5, 34, 10, "#e5e7eb");                   // silver tube
      px(x, -15, -5, 34, 3, "#ffffff");                    // shine
      px(x, -4, -5, 6, 10, "#0b0f19");                     // black stripe
      px(x, 6, -5, 3, 10, "#0b0f19");                      // second thin stripe
      px(x, 13, -7, 7, 14, "#0b0f19"); px(x, 14, -6, 5, 12, "#9ca3af");   // eyepiece end
      px(x, -15, -5, 4, 10, "#374151");                    // lens cap
      x.restore();
    })(1632, 640);
  }
  return c;
}

// -----------------------------------------------------------------------
// Characters
// -----------------------------------------------------------------------
function drawAstronaut(ctx, x, y, dir, walkFrame, moving, carry, lift) {
  lift = lift || 0;
  oval(ctx, x, y, Math.max(3, 7 - lift / 8), 3, "rgba(0,0,0,0.3)");
  y = y - lift;
  const step = moving ? (walkFrame % 2 ? 1 : 0) : 0;
  const bob = moving && step ? 1 : 0;
  // legs and boots
  px(ctx, x - 4, y - 6 + (step ? -1 : 0), 3, 6, "#cbd5e1");
  px(ctx, x + 1, y - 6 + (step ? 0 : -1), 3, 6, "#cbd5e1");
  px(ctx, x - 4, y - 2 + (step ? -1 : 0), 3, 2, "#64748b");
  px(ctx, x + 1, y - 2 + (step ? 0 : -1), 3, 2, "#64748b");
  // body
  px(ctx, x - 5, y - 15 - bob, 10, 10, "#f1f5f9");
  px(ctx, x - 5, y - 7 - bob, 10, 2, "#cbd5e1");
  px(ctx, x - 2, y - 12 - bob, 4, 2, "#f97316");
  // backpack
  if (dir === "up") px(ctx, x - 4, y - 14 - bob, 8, 8, "#94a3b8");
  else if (dir === "left") px(ctx, x + 4, y - 14 - bob, 3, 8, "#94a3b8");
  else if (dir === "right") px(ctx, x - 7, y - 14 - bob, 3, 8, "#94a3b8");
  else { px(ctx, x - 7, y - 13 - bob, 2, 6, "#94a3b8"); px(ctx, x + 5, y - 13 - bob, 2, 6, "#94a3b8"); }
  // arms
  if (dir === "left" || dir === "right") px(ctx, x - 1, y - 13 - bob, 3, 6, "#e2e8f0");
  else { px(ctx, x - 7, y - 14 - bob + 1, 2, 6, "#e2e8f0"); px(ctx, x + 5, y - 14 - bob + 1, 2, 6, "#e2e8f0"); }
  // helmet
  px(ctx, x - 5, y - 24 - bob, 10, 10, "#f8fafc");
  px(ctx, x - 6, y - 22 - bob, 12, 6, "#f8fafc");
  if (dir === "down") { px(ctx, x - 4, y - 22 - bob, 8, 6, "#1e3a8a"); px(ctx, x - 4, y - 22 - bob, 3, 2, "#93c5fd"); }
  else if (dir === "left") { px(ctx, x - 6, y - 22 - bob, 6, 6, "#1e3a8a"); px(ctx, x - 6, y - 22 - bob, 2, 2, "#93c5fd"); }
  else if (dir === "right") { px(ctx, x, y - 22 - bob, 6, 6, "#1e3a8a"); px(ctx, x + 3, y - 22 - bob, 2, 2, "#93c5fd"); }
  else { px(ctx, x - 1, y - 27 - bob, 2, 3, "#94a3b8"); }
  drawCarry(ctx, x, y, bob, carry);
}

// What you are carrying: ice on top, then rocks / metal / crystals in rows
function drawCarry(ctx, x, y, bob, carry) {
  if (carry.ice > 0) { for (let i = 0; i < carry.ice; i++) px(ctx, x - 6 + i * 4, y - 31 - bob, 3, 4, "#bfe9ff"); }
  let row = 0;
  const lines = [["rocks", "#b08968"], ["metal", "#cbd5e1"], ["crystal", "#c084fc"]];
  lines.forEach((l) => {
    const n = carry[l[0]] || 0;
    if (!n) return;
    for (let i = 0; i < n; i++) px(ctx, x - 8 + i * 4, y - (carry.ice > 0 ? 36 : 31) - row * 5 - bob, 3, 3, l[1]);
    row++;
  });
}

// On Mars you play a ROBOT (no human has ever been to Mars)
function drawRobot(ctx, x, y, dir, walkFrame, moving, carry, lift) {
  lift = lift || 0;
  oval(ctx, x, y, Math.max(3, 7 - lift / 8), 3, "rgba(0,0,0,0.3)");
  y = y - lift;
  const step = moving ? (walkFrame % 2 ? 1 : 0) : 0, bob = moving && step ? 1 : 0;
  // wheels
  disc(ctx, x - 4, y - 3, 3, "#1f2937"); disc(ctx, x + 4, y - 3, 3, "#1f2937");
  px(ctx, x - 4 + (step ? 1 : 0), y - 4, 1, 2, "#9ca3af"); px(ctx, x + 4 - (step ? 1 : 0), y - 4, 1, 2, "#9ca3af");
  // body
  px(ctx, x - 6, y - 15 - bob, 12, 10, "#d7dce6"); px(ctx, x - 6, y - 15 - bob, 12, 2, "#f1f5f9"); px(ctx, x - 6, y - 7 - bob, 12, 2, "#9aa3b5");
  px(ctx, x - 2, y - 12 - bob, 4, 3, "#f97316");                              // chest light
  px(ctx, x - 9, y - 13 - bob, 3, 7, "#9aa3b5"); px(ctx, x + 6, y - 13 - bob, 3, 7, "#9aa3b5");   // arms
  // head with a camera eye and an antenna
  px(ctx, x - 5, y - 23 - bob, 10, 8, "#e5e9f2"); px(ctx, x - 5, y - 23 - bob, 10, 2, "#ffffff");
  if (dir === "up") px(ctx, x - 3, y - 21 - bob, 6, 4, "#9aa3b5");
  else if (dir === "left") { px(ctx, x - 5, y - 21 - bob, 6, 5, "#0f172a"); px(ctx, x - 4, y - 20 - bob, 3, 3, "#38bdf8"); }
  else if (dir === "right") { px(ctx, x - 1, y - 21 - bob, 6, 5, "#0f172a"); px(ctx, x + 1, y - 20 - bob, 3, 3, "#38bdf8"); }
  else { px(ctx, x - 4, y - 21 - bob, 8, 5, "#0f172a"); px(ctx, x - 3, y - 20 - bob, 2, 3, "#38bdf8"); px(ctx, x + 1, y - 20 - bob, 2, 3, "#38bdf8"); }
  px(ctx, x, y - 27 - bob, 1, 4, "#94a3b8"); disc(ctx, x + 0.5, y - 28 - bob, 1.5, Math.floor(performance.now() / 400) % 2 ? "#ef4444" : "#7f1d1d");
  drawCarry(ctx, x, y, bob, carry);
}

// The rover, with YOU sitting inside (facing left flips the picture)
function drawDrivenRover(ctx, x, y, dir, t, robot, moving) {
  ctx.save();
  if (dir === "left") { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
  const yb = y + (moving ? Math.sin(t * 20) * 0.6 : 0);
  drawRover(ctx, x, yb, 3, t, false);
  // the driver, seen through the cabin window
  if (robot) { px(ctx, x + 8, yb - 22, 9, 8, "#e5e9f2"); px(ctx, x + 11, yb - 20, 6, 4, "#0f172a"); px(ctx, x + 13, yb - 19, 2, 2, "#38bdf8"); px(ctx, x + 12, yb - 26, 1, 4, "#94a3b8"); }
  else { px(ctx, x + 9, yb - 22, 8, 8, "#f8fafc"); px(ctx, x + 11, yb - 20, 6, 5, "#1e3a8a"); px(ctx, x + 11, yb - 20, 2, 2, "#93c5fd"); }
  ctx.restore();
}
function drawBolt(ctx, x, y, t) {
  const off = Math.sin(t * 4) * 2;
  oval(ctx, x, y, 5, 2, "rgba(0,0,0,0.25)");
  px(ctx, x - 4, y - 12 + off, 8, 6, "#fbbf24");
  px(ctx, x - 3, y - 14 + off, 6, 2, "#fde68a");
  px(ctx, x - 2, y - 11 + off, 4, 2, "#111827");
  px(ctx, x - 1, y - 11 + off, 1, 1, "#67e8f9");
  px(ctx, x, y - 18 + off, 1, 4, "#9ca3af");
  px(ctx, x - 1, y - 19 + off, 3, 2, Math.floor(t * 2) % 2 ? "#f87171" : "#fecaca");
  px(ctx, x - 3, y - 5 + off, 6, 1, "rgba(125,211,252,0.7)");
}

function drawZorp(ctx, x, y, t, wave) {
  oval(ctx, x, y, 8, 3, "rgba(0,0,0,0.25)");
  const bob = Math.sin(t * 3) * 1;
  oval(ctx, x, y - 8 + bob, 7, 8, "#86efac");
  oval(ctx, x, y - 6 + bob, 5, 5, "#bbf7d0");
  px(ctx, x - 4, y - 13 + bob, 3, 4, "#111827"); px(ctx, x + 1, y - 13 + bob, 3, 4, "#111827");
  px(ctx, x - 3, y - 13 + bob, 1, 1, "#fff"); px(ctx, x + 2, y - 13 + bob, 1, 1, "#fff");
  px(ctx, x - 2, y - 7 + bob, 4, 1, "#166534");
  px(ctx, x - 5, y - 20 + bob, 1, 5, "#4ade80"); px(ctx, x + 4, y - 20 + bob, 1, 5, "#4ade80");
  disc(ctx, x - 5, y - 21 + bob, 2, "#f0abfc"); disc(ctx, x + 5, y - 21 + bob, 2, "#f0abfc");
  const armUp = wave && Math.floor(t * 6) % 2 ? -4 : 0;
  px(ctx, x - 9, y - 9 + bob + armUp, 3, 2, "#4ade80");
  px(ctx, x + 6, y - 9 + bob, 3, 2, "#4ade80");
}

// ---- tiny helpers: little pictures (glyphs) for the signs ----
const GLYPHS = {
  earth(c, x, y) { disc(c, x + 4, y + 4, 4, "#2563eb"); px(c, x + 2, y + 2, 3, 2, "#22c55e"); px(c, x + 4, y + 5, 3, 2, "#22c55e"); },
  air(c, x, y) { px(c, x, y + 1, 8, 2, "#e0f2fe"); px(c, x + 1, y + 4, 7, 2, "#bae6fd"); px(c, x, y + 7, 6, 1, "#e0f2fe"); },
  shield(c, x, y) { poly(c, [[x, y], [x + 8, y], [x + 8, y + 4], [x + 4, y + 9], [x, y + 4]], "#22d3ee"); poly(c, [[x + 2, y + 2], [x + 6, y + 2], [x + 6, y + 4], [x + 4, y + 7], [x + 2, y + 4]], "#0e7490"); },
  leaf(c, x, y) { poly(c, [[x, y + 8], [x + 1, y + 2], [x + 8, y], [x + 7, y + 7]], "#4ade80"); px(c, x + 1, y + 7, 6, 1, "#166534"); },
  flask(c, x, y) { px(c, x + 3, y, 3, 3, "#e2e8f0"); poly(c, [[x + 3, y + 3], [x + 6, y + 3], [x + 9, y + 9], [x, y + 9]], "#67e8f9"); px(c, x + 1, y + 7, 7, 2, "#a855f7"); },
  apple(c, x, y) { disc(c, x + 4, y + 5, 3.5, "#ef4444"); px(c, x + 4, y, 1, 3, "#7c5a3c"); px(c, x + 5, y + 1, 3, 2, "#22c55e"); },
  moon(c, x, y) { disc(c, x + 4, y + 4, 4, "#fde68a"); disc(c, x + 6, y + 3, 3.4, "#312e81"); },
  sun(c, x, y) { disc(c, x + 4, y + 4, 2.6, "#fde047"); [[4, 0], [4, 8], [0, 4], [8, 4]].forEach((p) => px(c, x + p[0], y + p[1], 1, 1, "#fde047")); },
  rocket(c, x, y) { poly(c, [[x + 4, y], [x + 7, y + 4], [x + 7, y + 8], [x + 1, y + 8], [x + 1, y + 4]], "#e2e8f0"); px(c, x + 3, y + 3, 2, 2, "#38bdf8"); poly(c, [[x + 1, y + 8], [x - 1, y + 10], [x + 2, y + 8]], "#ef4444"); poly(c, [[x + 7, y + 8], [x + 9, y + 10], [x + 6, y + 8]], "#ef4444"); },
  flag(c, x, y) { px(c, x + 1, y, 1, 10, "#e5e7eb"); px(c, x + 2, y + 1, 7, 5, "#fff"); px(c, x + 2, y + 2, 7, 1, "#ef4444"); px(c, x + 2, y + 4, 7, 1, "#ef4444"); px(c, x + 2, y + 1, 3, 3, "#1d4ed8"); },
  cave(c, x, y) { poly(c, [[x, y + 9], [x + 1, y + 3], [x + 4, y], [x + 7, y + 3], [x + 8, y + 9]], "#6b7280"); poly(c, [[x + 2, y + 9], [x + 3, y + 5], [x + 5, y + 5], [x + 6, y + 9]], "#1b1630"); },
  rover(c, x, y) { px(c, x, y + 3, 9, 3, "#e2e8f0"); px(c, x + 2, y + 1, 4, 2, "#93c5fd"); disc(c, x + 2, y + 7, 1.6, "#475569"); disc(c, x + 7, y + 7, 1.6, "#475569"); }
};

// A name plate: [picture] NAME. Optionally a colored status pill to the right.
function sign(ctx, cx, y, glyph, label, color, pill) {
  ctx.font = "bold 8px 'Trebuchet MS', Verdana, sans-serif";
  const tw = Math.ceil(ctx.measureText(label).width);
  let pw = 0;
  if (pill) pw = Math.ceil(ctx.measureText(pill.text).width) + 6;
  const w = 14 + tw + 5, total = w + (pill ? pw + 2 : 0);
  const x0 = Math.round(cx - total / 2);
  px(ctx, x0 - 1, y - 1, w + 2, 13, "#0b1022");
  px(ctx, x0, y, w, 11, color);
  px(ctx, x0, y, w, 1, "rgba(255,255,255,0.45)");
  if (GLYPHS[glyph]) GLYPHS[glyph](ctx, x0 + 3, y + 1);
  ctx.fillStyle = "#fff"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillText(label, x0 + 14, y + 8.5);
  if (pill) {
    const px0 = x0 + w + 2;
    px(ctx, px0 - 1, y - 1, pw + 2, 13, "#0b1022");
    px(ctx, px0, y, pw, 11, pill.bg);
    ctx.fillStyle = pill.fg || "#fff"; ctx.fillText(pill.text, px0 + 3, y + 8.5);
    if (pill.progress !== undefined) { px(ctx, px0, y + 12, pw, 3, "#0b1022"); px(ctx, px0 + 1, y + 13, Math.round((pw - 2) * pill.progress), 1, "#facc15"); }
  }
}

// What a machine's pill says: ON / OFF / BOOST / ... (changing) / NO POWER
function machinePill(g, key, t) {
  const s = g.systems[key];
  const blink = Math.floor(t * 3) % 2;
  if (g.blackout) return { text: "NO POWER", bg: blink ? "#dc2626" : "#7f1d1d" };
  if (s.switching) return { text: "WAIT", bg: blink ? "#ca8a04" : "#854d0e", progress: s.progress };
  if (s.level === 2) return { text: "BOOST", bg: "#0891b2" };
  if (s.level === 1) return { text: "ON", bg: "#16a34a" };
  return { text: "OFF", bg: blink ? "#dc2626" : "#991b1b" };
}

// -----------------------------------------------------------------------
// Buildings. Each one shows what is going on inside it.
// -----------------------------------------------------------------------
function shadow(ctx, b, k) { oval(ctx, b.x + b.w / 2, b.y + b.h, b.w * (k || 0.58), 5, "rgba(0,0,0,0.25)"); }

function drawPod(ctx, b, g, t, night) {
  // A cozy moon house. The big window is a cutaway: you can see the bed inside.
  shadow(ctx, b, 0.62);
  const cx = b.x + b.w / 2, bot = b.y + b.h, lit = !g.blackout;
  px(ctx, b.x - 3, bot - 6, b.w + 6, 6, "#8f9ab0"); px(ctx, b.x - 3, bot - 6, b.w + 6, 1, "#cfd6e4");            // platform
  px(ctx, b.x + 2, b.y + 28, b.w - 4, b.h - 34, "#eef2f8");                                                     // walls
  px(ctx, b.x + 2, b.y + 28, 4, b.h - 34, "#ffffff"); px(ctx, b.x + b.w - 8, b.y + 28, 6, b.h - 34, "#c3ccdb");
  px(ctx, b.x + 2, bot - 12, b.w - 4, 3, "#b6bfce");
  ctx_dome(ctx, cx, b.y + 32, b.w / 2, 30, "#d3dbe8"); ctx_dome(ctx, cx, b.y + 32, b.w / 2 - 5, 24, "#f3f6fb");   // rounded roof
  px(ctx, b.x - 1, b.y + 30, b.w + 2, 3, "#aab4c6");
  for (let i = -2; i <= 2; i++) px(ctx, cx + i * 12, b.y + 12 + Math.abs(i) * 5, 1, 17 - Math.abs(i) * 4, "#cbd5e1");
  px(ctx, cx - 14, b.y + 8, 28, 7, "#2c5aa0"); px(ctx, cx - 14, b.y + 8, 28, 1, "#7fb0ee"); px(ctx, cx - 1, b.y + 8, 1, 7, "#1f3f73"); // roof solar strip
  px(ctx, cx + 22, b.y + 2, 1, 12, "#94a3b8"); disc(ctx, cx + 22, b.y + 1, 2, Math.floor(t * 2) % 2 ? "#f87171" : "#7f1d1d");   // little antenna light
  // the cutaway bedroom window
  const wx = b.x + 8, wy = b.y + 36, ww = 46, wh = 26;
  px(ctx, wx - 2, wy - 2, ww + 4, wh + 4, "#475569");
  px(ctx, wx, wy, ww, wh, lit ? "#44547a" : "#1b2335");
  px(ctx, wx, wy, ww, 8, lit ? "#4f6290" : "#222b40");
  px(ctx, wx, wy + wh - 5, ww, 5, "#8b5e3c"); px(ctx, wx, wy + wh - 5, ww, 1, "#a47148");                          // wooden floor
  disc(ctx, wx + ww - 9, wy + 8, 5, "#0f172a"); disc(ctx, wx + ww - 9, wy + 8, 3.6, "#2563eb"); px(ctx, wx + ww - 10, wy + 7, 2, 2, "#22c55e"); // porthole to Earth
  // the bed: headboard, mattress, blue blanket with stripes, pillow
  px(ctx, wx + 2, wy + wh - 22, 3, 17, "#6b4a2f");
  px(ctx, wx + 3, wy + wh - 11, 31, 6, "#8b5e3c"); px(ctx, wx + 3, wy + wh - 5, 3, 2, "#6b4a2f"); px(ctx, wx + 31, wy + wh - 5, 3, 2, "#6b4a2f");
  px(ctx, wx + 5, wy + wh - 15, 29, 5, "#f8fafc");
  px(ctx, wx + 13, wy + wh - 17, 21, 7, "#3b82f6"); px(ctx, wx + 13, wy + wh - 17, 21, 2, "#93c5fd"); px(ctx, wx + 20, wy + wh - 17, 2, 7, "#1d4ed8"); px(ctx, wx + 27, wy + wh - 17, 2, 7, "#1d4ed8");
  px(ctx, wx + 5, wy + wh - 19, 9, 5, "#fef3c7"); px(ctx, wx + 5, wy + wh - 19, 9, 1, "#fffbeb");
  if (night && lit && Math.floor(t * 0.7) % 2) { ctx.font = "bold 8px 'Trebuchet MS', sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText("z", wx + 12, wy + 6); }
  // bedside lamp
  px(ctx, wx + 38, wy + wh - 12, 2, 8, "#9ca3af"); px(ctx, wx + 35, wy + wh - 16, 8, 5, lit ? "#fde68a" : "#6b7280");
  if (lit) disc(ctx, wx + 39, wy + wh - 13, 9, "rgba(253,230,138,0.20)");
  px(ctx, wx, wy, 5, wh, "rgba(255,255,255,0.10)");                                                                 // glass shine
  // round airlock door
  const dx = b.x + b.w - 22;
  px(ctx, dx - 1, b.y + 38, 17, bot - b.y - 44, "#64748b"); px(ctx, dx, b.y + 39, 15, bot - b.y - 46, "#3b6ea8"); px(ctx, dx + 6, b.y + 39, 2, bot - b.y - 46, "#274a75");
  disc(ctx, dx + 11, b.y + 52, 1.6, "#e5e7eb"); disc(ctx, dx + 7, b.y + 42, 2.2, lit ? "#4ade80" : "#475569");
  sign(ctx, cx, b.y - 12, "moon", "BED", "#4338ca");
}

function drawComputer(ctx, b, g, t, attention) {
  shadow(ctx, b, 0.55);
  px(ctx, b.x, b.y + 14, b.w, b.h - 14, "#d7dde8");
  px(ctx, b.x - 2, b.y + 10, b.w + 4, 6, "#8aa0b8");
  px(ctx, b.x + 6, b.y + 20, b.w - 12, 16, "#0f172a");
  if (!g.blackout) {
    for (let i = 0; i < 3; i++) px(ctx, b.x + 9, b.y + 23 + i * 4, 10 + ((i * 7 + Math.floor(t * 2)) % 14), 2, "#4ade80");
    disc(ctx, b.x + b.w - 14, b.y + 28, 4, "#2563eb"); px(ctx, b.x + b.w - 16, b.y + 26, 3, 2, "#22c55e");
  }
  // big satellite dish on the roof
  px(ctx, b.x + b.w / 2 - 1, b.y - 6, 3, 18, "#94a3b8");
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y - 7); ctx.rotate(Math.sin(t * 0.6) * 0.35 - 0.5);
  oval(ctx, 0, 0, 14, 6, "#e5e7eb"); oval(ctx, 0, 1.5, 11, 4, "#94a3b8"); px(ctx, -1, -9, 2, 9, "#cbd5e1"); disc(ctx, 0, -10, 2, "#f87171");
  ctx.restore();
  const need = attention;
  sign(ctx, b.x + b.w / 2, b.y - 30, "earth", "EARTH", need ? "#ca8a04" : "#15803d", g.blackout ? { text: "NO POWER", bg: "#dc2626" } : null);
  if (need) {
    const hop = Math.abs(Math.sin(t * 5)) * 5;
    disc(ctx, b.x + b.w / 2, b.y - 50 - hop, 9, "#facc15"); px(ctx, b.x + b.w / 2 - 1, b.y - 56 - hop, 3, 8, "#111827"); px(ctx, b.x + b.w / 2 - 1, b.y - 46 - hop, 3, 3, "#111827");
  }
}

function drawLife(ctx, b, g, t) {
  shadow(ctx, b, 0.62);
  const on = g.systems.life.level > 0 && !g.blackout;
  const cx = b.x + b.w / 2;
  // a tall tank with rings
  px(ctx, b.x + 2, b.y + 8, b.w - 4, b.h - 8, "#d5dbe6");
  oval(ctx, cx, b.y + 8, b.w / 2 - 2, 6, "#eef2f8");
  [14, 24, 34].forEach((o) => px(ctx, b.x + 2, b.y + o, b.w - 4, 3, "#9fb0c6"));
  px(ctx, b.x + 2, b.y + 8, 3, b.h - 8, "#eef2f8");
  // fan window
  const fy = b.y + 28;
  disc(ctx, cx, fy, 10, "#374151"); disc(ctx, cx, fy, 8, "#4b5563");
  ctx.save(); ctx.translate(cx, fy); ctx.rotate(on ? t * 7 : 0.4);
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); px(ctx, 1, -2, 7, 4, on ? "#e5e7eb" : "#9ca3af"); }
  ctx.restore(); disc(ctx, cx, fy, 2, "#111827");
  px(ctx, b.x + b.w, b.y + 16, 4, 20, "#94a3b8");
  if (on) for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; px(ctx, b.x + b.w + 4 + k * 10, b.y + 14 - k * 10, 3, 3, "rgba(190,233,255," + (0.8 - k * 0.8).toFixed(2) + ")"); }
  // alarm light on top: spins red when life support is OFF
  const alarm = !on;
  disc(ctx, cx, b.y + 3, 4, alarm && Math.floor(t * 4) % 2 ? "#ef4444" : alarm ? "#7f1d1d" : "#22c55e");
  sign(ctx, cx, b.y - 20, "air", g.planet === "mars" ? "LINK" : "AIR", "#0369a1", machinePill(g, "life", t));
  if (alarm && Math.floor(t * 3) % 2) { disc(ctx, cx, b.y - 36, 7, "#ef4444"); px(ctx, cx - 1, b.y - 41, 3, 6, "#fff"); px(ctx, cx - 1, b.y - 33, 3, 3, "#fff"); }
}

function drawShieldTower(ctx, b, g, t) {
  shadow(ctx, b, 0.7);
  px(ctx, b.x, b.y + 16, b.w, b.h - 16, "#aab4c4");
  px(ctx, b.x + 4, b.y + 10, b.w - 8, 8, "#c7cfdb");
  const cx = b.x + 14;
  poly(ctx, [[cx - 4, b.y + 12], [cx, b.y - 24], [cx + 4, b.y + 12]], "#cbd5e1");
  const lvl = g.blackout ? 0 : g.systems.shield.level;
  const cy = b.y - 26;
  if (lvl > 0) {
    const pulse = 1 + Math.sin(t * (lvl === 2 ? 9 : 3)) * (lvl === 2 ? 2.5 : 1);
    disc(ctx, cx, cy, 10 + pulse, lvl === 2 ? "rgba(165,243,252,0.35)" : "rgba(34,211,238,0.25)");
    disc(ctx, cx, cy, 6, lvl === 2 ? "#a5f3fc" : "#22d3ee");
    ctx.strokeStyle = "rgba(190,250,255,0.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 4, t * 2, 0, 6.3); ctx.stroke();
  } else disc(ctx, cx, cy, 6, "#475569");
  sign(ctx, cx, b.y - 52, "shield", "SHIELD", "#0e7490", machinePill(g, "shield", t));
}

function drawGreenhouse(ctx, b, g, t) {
  shadow(ctx, b, 0.55);
  const cx = b.x + b.w / 2;
  px(ctx, b.x, b.y + 30, b.w, b.h - 30, "#2e4b3f");
  px(ctx, b.x + 4, b.y + 38, b.w - 8, 12, "#5b3a29");
  for (let i = 0; i < 4; i++) {
    const gx = b.x + 14 + i * 22, gy = b.y + 46, gr = g.plots[i];
    if (gr < 0.05) { px(ctx, gx, gy - 2, 2, 2, "#4d7c0f"); continue; }
    const h = 4 + Math.round(gr * 16);
    px(ctx, gx + 1, gy - h, 2, h, "#4ade80");
    px(ctx, gx - 3, gy - h + 3, 5, 3, "#22c55e"); px(ctx, gx + 2, gy - h + 6, 5, 3, "#22c55e");
    if (gr >= 1) { disc(ctx, gx + 1, gy - h - 2, 3.5, "#ef4444"); disc(ctx, gx + 6, gy - h + 1, 2.5, "#ef4444"); if (Math.floor(t * 3) % 2) px(ctx, gx + 6, gy - h - 5, 2, 2, "#fff"); }
  }
  // glass dome with frame lines
  ctx_dome(ctx, cx, b.y + 32, b.w / 2, 30, "rgba(167,243,208,0.30)");
  ctx.strokeStyle = "rgba(226,232,240,0.9)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(cx, b.y + 32, b.w / 2, 30, 0, Math.PI, 0); ctx.stroke();
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(cx, b.y + 32, Math.abs(i) * 12 + 1, 30, 0, Math.PI, 0); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(b.x + 6, b.y + 20); ctx.lineTo(b.x + b.w - 6, b.y + 20); ctx.stroke();
  px(ctx, b.x, b.y + b.h - 3, b.w, 3, "#e2e8f0");
  // door with a water inlet (this is where ice goes!)
  px(ctx, cx - 8, b.y + b.h - 14, 16, 14, "#1e293b"); px(ctx, cx - 6, b.y + b.h - 12, 12, 12, "#38bdf8");
  px(ctx, cx - 1, b.y + b.h - 12, 2, 12, "#1e293b");
  // water tank
  px(ctx, b.x + b.w + 4, b.y + 18, 10, 34, "#1f2937");
  const wh = Math.round(32 * g.water / CONFIG.waterMax);
  px(ctx, b.x + b.w + 5, b.y + 19 + 32 - wh, 8, wh, "#38bdf8");
  px(ctx, b.x + b.w + 6, b.y + 14, 6, 4, "#94a3b8");
  ctx.font = "bold 7px 'Trebuchet MS', sans-serif"; ctx.fillStyle = "#bae6fd"; ctx.textAlign = "center";
  ctx.fillText(Math.round(g.water * 10) / 10 + "💧".slice(0, 0), b.x + b.w + 9, b.y + 61);
  if (g.plots.some((p) => p >= 1)) {
    const pulse = 0.25 + Math.sin(t * 6) * 0.15;
    disc(ctx, cx, b.y + 40, 52 + Math.sin(t * 6) * 4, "rgba(253,224,71," + pulse.toFixed(2) + ")");
    sign(ctx, cx, b.y - 24 - Math.round(Math.abs(Math.sin(t * 5)) * 3), "leaf", "APPLES READY!", Math.floor(t * 3) % 2 ? "#dc2626" : "#b91c1c");
  }
  sign(ctx, cx, b.y - 8, "leaf", "FOOD", "#15803d", machinePill(g, "greenhouse", t));
}

function drawLab(ctx, b, g, t) {
  shadow(ctx, b, 0.55);
  const cx = b.x + b.w / 2;
  const on = g.systems.lab.level > 0 && !g.blackout;
  px(ctx, b.x, b.y + 18, b.w, b.h - 18, "#d4dae6");
  poly(ctx, [[b.x - 3, b.y + 18], [b.x + 12, b.y + 6], [b.x + b.w - 12, b.y + 6], [b.x + b.w + 3, b.y + 18]], "#8b9bb4");   // angled roof
  px(ctx, b.x + 12, b.y + 6, b.w - 24, 2, "#b6c3d8");
  px(ctx, b.x + 8, b.y + 24, 16, 10, on ? "#67e8f9" : "#334155");
  px(ctx, b.x + b.w - 24, b.y + 24, 16, 10, on ? "#67e8f9" : "#334155");
  if (on) for (let i = 0; i < 3; i++) px(ctx, b.x + 10 + ((Math.floor(t * 3) + i * 3) % 12), b.y + 28, 3, 2, "#0e7490");
  px(ctx, cx - 6, b.y + b.h - 16, 12, 16, "#1e293b"); px(ctx, cx - 4, b.y + b.h - 14, 8, 14, on ? "#a5f3fc" : "#3b6ea8");
  ctx.save(); ctx.translate(b.x + b.w - 16, b.y + 4); ctx.rotate(-0.6 + Math.sin(t * 0.5) * 0.1);
  px(ctx, -12, -3, 24, 6, "#e5e7eb"); px(ctx, 10, -4, 5, 8, "#94a3b8"); ctx.restore();
  // crate with the samples waiting to be studied
  px(ctx, b.x + b.w + 4, b.y + 30, 16, 20, "#8b5e3c"); px(ctx, b.x + b.w + 4, b.y + 30, 16, 3, "#a47148");
  const cols = { rock: "#b08968", metal: "#cbd5e1", crystal: "#c084fc" };
  for (let i = 0; i < Math.min(6, g.labQueue.length); i++) px(ctx, b.x + b.w + 5 + (i % 3) * 5, b.y + 25 - Math.floor(i / 3) * 5 + 4, 4, 4, cols[g.labQueue[i]] || "#b08968");
  if (on && g.labQueue.length > 0) { px(ctx, b.x + 8, b.y + b.h + 12, 56, 4, "#111827"); px(ctx, b.x + 9, b.y + b.h + 13, Math.round(54 * g.labProgress), 2, "#67e8f9"); }
  sign(ctx, cx, b.y - 12, "flask", "LAB", "#6d28d9", machinePill(g, "lab", t));
}

function drawApple(ctx, x, y) {
  disc(ctx, x, y, 3.4, "#dc2626"); px(ctx, x - 2, y - 2, 2, 2, "#fca5a5");
  px(ctx, x, y - 5, 1, 2, "#7c5a3c"); px(ctx, x + 1, y - 5, 3, 2, "#22c55e");
}
function drawTable(ctx, b, g) {
  shadow(ctx, b, 0.65);
  px(ctx, b.x + 3, b.y + 12, 3, 10, "#7c5a3c"); px(ctx, b.x + b.w - 6, b.y + 12, 3, 10, "#7c5a3c");
  px(ctx, b.x, b.y + 8, b.w, 8, "#b08968"); px(ctx, b.x, b.y + 8, b.w, 2, "#d4a373");
  // a bowl with real apples
  oval(ctx, b.x + b.w / 2, b.y + 11, 12, 4, "#f1f5f9");
  const n = Math.min(6, g.food);
  for (let i = 0; i < n; i++) drawApple(ctx, b.x + b.w / 2 - 9 + (i % 3) * 9, b.y + 9 - Math.floor(i / 3) * 5);
  if (g.food === 0) { ctx.font = "bold 7px 'Trebuchet MS', sans-serif"; ctx.fillStyle = "#fecaca"; ctx.textAlign = "center"; ctx.fillText("empty", b.x + b.w / 2, b.y + 12); }
  sign(ctx, b.x + b.w / 2, b.y - 16, "apple", "FOOD ×" + g.food, "#b45309");
}

function drawSolar(ctx, b, g, t) {
  oval(ctx, b.x + b.w / 2, b.y + b.h - 2, b.w * 0.55, 5, "rgba(0,0,0,0.22)");
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = b.x + 2 + c * 26, y = b.y + 4 + r * 26;
      px(ctx, x, y + 3, 24, 18, "#1f3f73"); px(ctx, x, y, 24, 18, "#2c5aa0"); px(ctx, x, y, 24, 2, "#7fb0ee");
      px(ctx, x + 8, y, 1, 18, "#1f3f73"); px(ctx, x + 16, y, 1, 18, "#1f3f73"); px(ctx, x, y + 9, 24, 1, "#1f3f73");
      const sl = typeof stormLevel === "function" ? stormLevel(g) : 0;
      if (sl > 0.02) {   // storm dust settles on the panels, more for a stronger storm
        px(ctx, x, y, 24, 18, "rgba(190,130,70," + (sl * 0.65).toFixed(2) + ")");
        const drift = Math.floor((t * 30 + c * 7 + r * 3) % 24);
        px(ctx, x + drift, y + 4 + ((c + r) % 3) * 4, 5, 1, "rgba(235,185,130," + Math.min(1, sl + 0.2).toFixed(2) + ")");
      }
      if (g.dust > 0.05) {
        px(ctx, x, y, 24, 18, "rgba(160,135,100," + (g.dust * 0.7).toFixed(2) + ")");
        if (g.dust > 0.4) { px(ctx, x + 4, y + 5, 3, 2, "rgba(190,165,125,0.8)"); px(ctx, x + 15, y + 11, 4, 2, "rgba(190,165,125,0.8)"); }
      }
    }
  }
  const pct = Math.round(g.dust * 100), bad = g.dust > CONFIG.dustWarn, blink = Math.floor(t * 3) % 2;
  if (bad) {
    // RED WARNING: more than half of the panel is covered in dust
    ctx.strokeStyle = blink ? "rgba(248,113,113,1)" : "rgba(127,29,29,0.9)"; ctx.lineWidth = 2;
    ctx.strokeRect(b.x - 2, b.y - 1, b.w + 4, b.h - 2);
    const hop = Math.abs(Math.sin(t * 5)) * 3;
    poly(ctx, [[b.x + b.w / 2, b.y - 44 - hop], [b.x + b.w / 2 + 9, b.y - 28 - hop], [b.x + b.w / 2 - 9, b.y - 28 - hop]], "#facc15");
    px(ctx, b.x + b.w / 2 - 1, b.y - 40 - hop, 2, 7, "#111827"); px(ctx, b.x + b.w / 2 - 1, b.y - 31 - hop, 2, 2, "#111827");
  }
  sign(ctx, b.x + b.w / 2, b.y - 14, "sun", "SOLAR", bad ? (blink ? "#b91c1c" : "#7f1d1d") : "#a16207", { text: bad ? "DIRTY " + pct + "%" : "dust " + pct + "%", bg: bad ? "#dc2626" : "#475569" });
}

// ---- The launcher: sends your research up to Earth ----
function drawLauncher(ctx, b, g, t, launchT) {
  shadow(ctx, b, 0.7);
  const cx = b.x + b.w / 2, bot = b.y + b.h;
  px(ctx, b.x - 2, bot - 8, b.w + 4, 8, "#8f9ab0"); px(ctx, b.x - 2, bot - 8, b.w + 4, 2, "#cfd6e4");
  for (let i = 0; i < b.w; i += 10) px(ctx, b.x + i, bot - 4, 5, 2, "#facc15");
  // launch tower with a swing arm
  for (let i = 0; i < 6; i++) { px(ctx, b.x + 4, bot - 14 - i * 9, 6, 9, "#b0382c"); px(ctx, b.x + 4, bot - 14 - i * 9, 6, 1, "#7f1d1d"); px(ctx, b.x + 5, bot - 12 - i * 9, 4, 1, "#e5e7eb"); }
  px(ctx, b.x + 4, bot - 58, 26, 3, "#b0382c");
  // the rocket (rises when launched, then a new one is rolled out)
  const flying = launchT >= 0 && launchT < 4.2, rise = flying ? Math.pow(launchT, 2) * 46 : 0;
  if (!(launchT >= 4.2 && launchT < 5)) {
    const rx = cx + 8, ry = bot - 10 - rise;
    px(ctx, rx - 6, ry - 40, 12, 40, "#f8fafc"); px(ctx, rx - 6, ry - 40, 3, 40, "#ffffff"); px(ctx, rx + 3, ry - 40, 3, 40, "#cbd5e1");
    px(ctx, rx - 6, ry - 24, 12, 4, "#e07b39");
    poly(ctx, [[rx - 6, ry - 40], [rx, ry - 54], [rx + 6, ry - 40]], "#ef4444");
    poly(ctx, [[rx - 6, ry - 8], [rx - 12, ry], [rx - 6, ry]], "#ef4444"); poly(ctx, [[rx + 6, ry - 8], [rx + 12, ry], [rx + 6, ry]], "#ef4444");
    disc(ctx, rx, ry - 32, 2.5, "#38bdf8");
    if (flying) {
      const f = 12 + launchT * 14;
      poly(ctx, [[rx - 5, ry], [rx, ry + f], [rx + 5, ry]], "#f97316"); poly(ctx, [[rx - 3, ry], [rx, ry + f * 0.7], [rx + 3, ry]], "#fde047");
      for (let i = 0; i < 8; i++) disc(ctx, rx + Math.sin(i * 2 + launchT * 5) * (6 + launchT * 4), bot - 6 - ((i * 7 + launchT * 20) % 22), 5 + launchT, "rgba(235,235,240,0.5)");
    }
  }
  const L = launcherInfo(g);
  const pill = L.ready ? { text: "LAUNCH!", bg: Math.floor(t * 3) % 2 ? "#16a34a" : "#166534" } : L.done ? { text: L.label + " \u2713 DONE", bg: "#15803d" } : { text: L.label, bg: "#475569" };
  sign(ctx, cx, b.y - 20, "rocket", "LAUNCHER", "#be123c", pill);
}

// Little signs for the places you can walk into
function drawPlaces(ctx, g, t, region) {
  if (region === "home") {
    sign(ctx, 1500, 1000, "cave", DISCOVERIES.cave.title.toUpperCase(), "#4338ca");
    sign(ctx, 1630, 846, "flag", DISCOVERIES.tranquility.title.toUpperCase(), "#1d4ed8");
  }
}

// ---- Rover and its bay ----
function drawRover(ctx, x, y, stage, t, ready) {
  oval(ctx, x, y + 2, 26, 5, "rgba(0,0,0,0.28)");
  if (stage >= 1) {   // chassis + wheels
    px(ctx, x - 20, y - 12, 40, 8, "#cbd5e1"); px(ctx, x - 20, y - 12, 40, 2, "#f1f5f9");
    [-15, 0, 15].forEach((o) => { disc(ctx, x + o, y - 3, 5, "#1f2937"); disc(ctx, x + o, y - 3, 2, "#9ca3af"); });
  }
  if (stage >= 2) {   // solar wing + battery
    px(ctx, x - 18, y - 22, 20, 10, "#2c5aa0"); px(ctx, x - 18, y - 22, 20, 2, "#7fb0ee"); px(ctx, x - 9, y - 22, 1, 10, "#1f3f73");
    px(ctx, x + 6, y - 18, 10, 6, "#475569");
  }
  if (stage >= 3) {   // cabin + dish
    poly(ctx, [[x + 2, y - 12], [x + 6, y - 24], [x + 18, y - 24], [x + 20, y - 12]], "#f1f5f9");
    poly(ctx, [[x + 8, y - 13], [x + 10, y - 22], [x + 17, y - 22], [x + 18, y - 13]], "#38bdf8");
    px(ctx, x - 4, y - 30, 1, 8, "#94a3b8"); oval(ctx, x - 4, y - 31, 5, 2, "#e5e7eb");
    if (ready) disc(ctx, x + 12, y - 28, 2, Math.floor(t * 4) % 2 ? "#4ade80" : "#166534");
  }
}
function drawCrate(ctx, x, y, t) {
  const hop = Math.abs(Math.sin(t * 5)) * 3;
  if (typeof Renderer !== "undefined" && Renderer.planet === "mars") {
    // on Mars the brown crate disappeared into the red ground, so it is bright lime green with a dark outline and a glow
    disc(ctx, x, y - 4, 17 + Math.sin(t * 4) * 2, "rgba(254,240,138," + (0.28 + Math.sin(t * 4) * 0.1).toFixed(2) + ")");
    px(ctx, x - 11, y - 14 - hop, 22, 18, "#052e16");
    px(ctx, x - 9, y - 12 - hop, 18, 14, "#84cc16"); px(ctx, x - 9, y - 12 - hop, 18, 3, "#d9f99d"); px(ctx, x - 1, y - 12 - hop, 2, 14, "#3f6212");
    px(ctx, x - 3, y - 20 - hop, 6, 6, "#fde047"); px(ctx, x - 1, y - 19 - hop, 2, 3, "#111827"); px(ctx, x - 1, y - 15 - hop, 2, 1, "#111827");
    return;
  }
  px(ctx, x - 9, y - 12 - hop, 18, 14, "#a47148"); px(ctx, x - 9, y - 12 - hop, 18, 3, "#c28a5a"); px(ctx, x - 1, y - 12 - hop, 2, 14, "#7c5a3c");
  px(ctx, x - 3, y - 20 - hop, 6, 6, "#facc15"); px(ctx, x - 1, y - 19 - hop, 2, 3, "#111827"); px(ctx, x - 1, y - 15 - hop, 2, 1, "#111827");
}
function drawBay(ctx, g, t) {
  const R = g.rover, b = BAY, cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 10;
  if (!R.built) drawRover(ctx, cx, cy, R.assembled, t, false);       // (the finished rover is drawn wherever it is parked)
  if (R.delivered > R.assembled) drawCrate(ctx, b.x + b.w - 14, b.y + b.h - 4, t);
  let pill;
  if (R.built) pill = { text: "GO!", bg: "#16a34a" };
  else if (R.delivered > R.assembled) pill = { text: "BUILD ME", bg: Math.floor(t * 3) % 2 ? "#ca8a04" : "#854d0e" };
  else pill = { text: R.assembled + "/" + CONFIG.rover.partsNeeded + " parts", bg: "#475569" };
  sign(ctx, cx, b.y - 22, "rover", "ROVER BAY", "#b45309", pill);
}

// Sam, your friend on the far side
function drawCrew(ctx, x, y, t, robot) {
  if (robot) {                                   // on Mars Sam is a robot too (no human has ever been to Mars)
    drawRobot(ctx, x, y, "down", 0, false, { ice: 0, rocks: 0, metal: 0, crystal: 0 }, 0);
    px(ctx, x - 9, y - 13 - (Math.floor(t * 4) % 2 ? 4 : 0), 3, 7, "#9aa3b5");   // waving arm
    px(ctx, x - 2, y - 12, 4, 3, "#22d3ee");                                    // a different chest light so you can tell them apart
    px(ctx, x - 6, y - 23, 12, 2, "#fb923c");                                   // orange stripe on the head
    ctx.font = "bold 8px 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("Sam", x, y - 36);
    return;
  }
  oval(ctx, x, y, 7, 3, "rgba(0,0,0,0.3)");
  px(ctx, x - 4, y - 6, 3, 6, "#fb923c"); px(ctx, x + 1, y - 6, 3, 6, "#fb923c");
  px(ctx, x - 5, y - 15, 10, 10, "#fdba74"); px(ctx, x - 2, y - 12, 4, 2, "#1e40af");
  px(ctx, x - 7, y - 14, 2, 6, "#fb923c"); px(ctx, x + 5, y - 14 - (Math.floor(t * 4) % 2 ? 4 : 0), 2, 6, "#fb923c");   // waving arm
  px(ctx, x - 5, y - 24, 10, 10, "#f8fafc"); px(ctx, x - 6, y - 22, 12, 6, "#f8fafc");
  px(ctx, x - 4, y - 22, 8, 6, "#7c2d12"); px(ctx, x - 4, y - 22, 3, 2, "#fdba74");
  ctx.font = "bold 8px 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("Sam", x, y - 30);
}

function drawMat(ctx, s, color, glow, t, label) {
  const W = 60, H = 16, x0 = s.x - W / 2;
  const a = glow ? 0.95 : 0.75;
  ctx.globalAlpha = a; px(ctx, x0 - 1, s.y - 8, W + 2, H + 2, "#0b1022"); ctx.globalAlpha = 1;
  px(ctx, x0, s.y - 7, W, H, color);
  px(ctx, x0, s.y - 7, W, 1, "rgba(255,255,255,0.5)");
  // a little picture of the thing you drop here (the same look as in the game)
  const iconType = label === "ICE" ? "ice" : label === "ROCKS" ? "rock" : null;
  if (iconType) drawNode(ctx, { type: iconType, x: x0 + 13, y: s.y + 4, x0: 0 }, 0);
  else GLYPHS.apple(ctx, x0 + 6, s.y - 4);
  // the word always fits inside the box
  let size = 8; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
  const room = W - 26;
  ctx.font = "bold " + size + "px 'Trebuchet MS', sans-serif";
  while (ctx.measureText(label).width > room && size > 5) { size -= 0.5; ctx.font = "bold " + size + "px 'Trebuchet MS', sans-serif"; }
  ctx.fillText(label, x0 + 25, s.y + 4);
  // a bouncing arrow when it is time to use the mat
  if (glow) { ctx.strokeStyle = "rgba(255,255,255," + (0.5 + Math.sin(t * 8) * 0.4).toFixed(2) + ")"; ctx.lineWidth = 1; ctx.strokeRect(x0 - 0.5, s.y - 7.5, W + 1, H + 1); }
}

function drawNode(ctx, n, t) {
  oval(ctx, n.x, n.y + 3, 8, 3, "rgba(0,0,0,0.25)");
  if (n.type === "ice") {
    poly(ctx, [[n.x - 6, n.y + 2], [n.x - 2, n.y - 10], [n.x + 1, n.y + 2]], "#9bdcff");
    poly(ctx, [[n.x - 1, n.y + 3], [n.x + 4, n.y - 13], [n.x + 8, n.y + 3]], "#d6f1ff");
    poly(ctx, [[n.x + 2, n.y + 3], [n.x + 5, n.y - 6], [n.x + 8, n.y + 3]], "#7dd3fc");
    if (Math.floor(t * 2 + n.x) % 3 === 0) px(ctx, n.x + 4, n.y - 15, 2, 2, "#ffffff");
  } else if (n.type === "crystal") {
    const cp = [["#eab308", "#fde047", "#facc15"], ["#cbd5e1", "#ffffff", "#e2e8f0"], ["#16a34a", "#86efac", "#4ade80"], ["#dc2626", "#fca5a5", "#f87171"]][Math.abs(Math.floor(n.x * 7 + n.y * 3)) % 4];
    poly(ctx, [[n.x - 7, n.y + 3], [n.x - 4, n.y - 9], [n.x - 1, n.y + 3]], cp[0]);
    poly(ctx, [[n.x - 2, n.y + 3], [n.x + 2, n.y - 14], [n.x + 6, n.y + 3]], cp[1]);
    poly(ctx, [[n.x + 3, n.y + 3], [n.x + 6, n.y - 6], [n.x + 9, n.y + 3]], cp[2]);
    if (Math.floor(t * 3 + n.x) % 3 === 0) px(ctx, n.x + 3, n.y - 17, 2, 2, "#fff");
  } else if (n.type === "metal") {
    px(ctx, n.x - 7, n.y - 3, 10, 6, "#8a94a6"); px(ctx, n.x - 7, n.y - 3, 10, 2, "#cbd5e1");
    poly(ctx, [[n.x, n.y + 3], [n.x + 3, n.y - 7], [n.x + 9, n.y - 5], [n.x + 8, n.y + 3]], "#aab4c4");
    px(ctx, n.x + 2, n.y - 4, 2, 2, "#e2e8f0");
    if (Math.floor(t * 2 + n.y) % 3 === 0) px(ctx, n.x + 5, n.y - 10, 2, 2, "#fff");
  } else {
    poly(ctx, [[n.x - 7, n.y + 3], [n.x - 4, n.y - 5], [n.x + 3, n.y - 6], [n.x + 8, n.y + 3]], "#8a6a4d");
    poly(ctx, [[n.x - 4, n.y - 5], [n.x + 3, n.y - 6], [n.x + 2, n.y - 2], [n.x - 4, n.y - 1]], "#b28d68");
    px(ctx, n.x + 2, n.y - 1, 2, 2, "#d9b38c");
    if (Math.floor(t * 2 + n.y) % 3 === 0) px(ctx, n.x + 5, n.y - 9, 2, 2, "#ffe9a8");
  }
}

// -----------------------------------------------------------------------
// The whole picture
// -----------------------------------------------------------------------
const Renderer = {
  canvas: null, ctx: null, bg: null, dark: null, darkCtx: null,
  cam: { x: 0, y: 0 },
  dust: [],

  init(canvas) {
    this.canvas = canvas;
    // The picture is drawn at 3x size so text and edges stay sharp, but every number in the game
    // still uses the small 480 x 270 grid (we just scale up with setTransform).
    this.S = 3;
    canvas.width = VIEW.w * this.S; canvas.height = VIEW.h * this.S;
    this.ctx = canvas.getContext("2d");
    this.planet = "moon"; this.bgs = {}; this.bg = this.bgs.moon = buildBackground("moon"); this.domeCache = {};
    this.dark = document.createElement("canvas");
    this.dark.width = VIEW.w; this.dark.height = VIEW.h;
    this.darkCtx = this.dark.getContext("2d");
  },

  setPlanet(p) {
    this.planet = p;
    if (!this.bgs[p]) this.bgs[p] = buildBackground(p);
    this.bg = this.bgs[p];
  },

  // A honeycomb of hexagons, drawn once for each shield level. Normal: light edge band that fades to clear.
  // Boost: purple, the whole disc filled with fading hexagons.
  domeImage(level) {
    if (this.domeCache[level]) return this.domeCache[level];
    const r = BASE.radius, boost = level === 2, c = document.createElement("canvas");
    c.width = c.height = Math.ceil(r * 2) + 8;
    const d = c.getContext("2d"), cx = c.width / 2, cy = c.height / 2, hr = 20;       // hr = hexagon radius
    const dx = hr * Math.sqrt(3), dy = hr * 1.5, rgb = boost ? "196,140,255" : "125,225,255";
    d.save(); d.beginPath(); d.arc(cx, cy, r, 0, Math.PI * 2); d.clip();
    for (let row = -Math.ceil(r / dy) - 1; row <= Math.ceil(r / dy) + 1; row++) {
      for (let col = -Math.ceil(r / dx) - 1; col <= Math.ceil(r / dx) + 1; col++) {
        const hx = cx + col * dx + (row & 1 ? dx / 2 : 0), hy = cy + row * dy, k = Math.hypot(hx - cx, hy - cy) / r;
        if (k > 1.08) continue;
        const a = boost ? 0.10 + 0.5 * Math.pow(k, 2.2) : Math.max(0, (k - 0.55) / 0.45) * 0.62;
        if (a < 0.02) continue;
        d.beginPath();
        for (let s = 0; s < 6; s++) { const ang = Math.PI / 6 + s * Math.PI / 3; d.lineTo(hx + Math.cos(ang) * (hr - 1.5), hy + Math.sin(ang) * (hr - 1.5)); }
        d.closePath();
        d.fillStyle = "rgba(" + rgb + "," + (a * (boost ? 0.35 : 0.22)).toFixed(3) + ")"; d.fill();
        d.strokeStyle = "rgba(" + rgb + "," + a.toFixed(3) + ")"; d.lineWidth = 1.5; d.stroke();
      }
    }
    d.restore();
    this.domeCache[level] = c;
    return c;
  },

  follow(p, instant) {
    const R = REGIONS[regionAt(p.x, p.y)];
    const tx = clampN(p.x - VIEW.w / 2, R.x, R.x + R.w - VIEW.w);
    const ty = clampN(p.y - (p.z || 0) * 0.3 - VIEW.h / 2 - 10, R.y, R.y + R.h - VIEW.h);
    if (instant) { this.cam.x = tx; this.cam.y = ty; }
    else { this.cam.x += (tx - this.cam.x) * 0.12; this.cam.y += (ty - this.cam.y) * 0.12; }
  },

  toScreen(wx, wy) { return { x: wx - Math.round(this.cam.x), y: wy - Math.round(this.cam.y) }; },

  // scene = { g, t, player, bolt, zorp, nodes, action, shake }
  draw(scene) {
    const { g, t, player, bolt, zorp, nodes, action } = scene;
    const ctx = this.ctx;
    ctx.setTransform(this.S, 0, 0, this.S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    let camX = Math.round(this.cam.x), camY = Math.round(this.cam.y);
    if (scene.shake) { camX += Math.round((Math.random() - 0.5) * scene.shake); camY += Math.round((Math.random() - 0.5) * scene.shake); }
    ctx.drawImage(this.bg, camX, camY, VIEW.w, VIEW.h, 0, 0, VIEW.w, VIEW.h);

    ctx.save();
    ctx.translate(-camX, -camY);

    const hour = g.min / 60;
    const night = hour >= 19.5;

    // permanent footprints from your jump landings
    if (scene.prints) {
      const x0 = camX - 8, x1 = camX + VIEW.w + 8, y0 = camY - 8, y1 = camY + VIEW.h + 8;
      for (let i = 0; i < scene.prints.length; i++) {
        const q = scene.prints[i];
        if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) continue;
        const dk = this.planet === "mars" ? "rgba(70,30,20,0.55)" : "rgba(60,62,76,0.6)";
        px(ctx, q.x - 4, q.y - 2, 3, 5, dk); px(ctx, q.x + 1, q.y - 1, 3, 5, dk);
      }
    }

    // mats on the ground
    const spotById = {}; SPOTS.forEach((s) => (spotById[s.id] = s));
    const ripe = g.plots.some((p) => p >= 1);
    drawMat(ctx, spotById.ghmat, "#2563eb", player.ice > 0 || ripe, t, player.ice > 0 || !ripe ? "ICE" : "FOOD");
    drawMat(ctx, spotById.labmat, "#a16207", player.rocks + player.metal + player.crystal > 0, t, "ROCKS");
    // ring on the ground where the arrow wants you to stand
    if (scene.goal) {
      const gr = 12 + Math.sin(t * 6) * 3;
      ctx.strokeStyle = "rgba(253,224,71,0.95)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(scene.goal.x, scene.goal.y, gr + 6, (gr + 6) * 0.45, 0, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(scene.goal.x, scene.goal.y, gr, gr * 0.45, 0, 0, 6.3); ctx.stroke();
    }

    // shield bubble (drawn under the buildings so it looks like a dome around them)
    this.drawBubble(ctx, g, t);

    // everything that stands up is sorted by its feet so things overlap correctly
    const list = [];
    const B = BUILDINGS;
    list.push({ y: B.solar.y + B.solar.h, f: () => drawSolar(ctx, B.solar, g, t) });
    list.push({ y: B.pod.y + B.pod.h, f: () => drawPod(ctx, B.pod, g, t, night) });
    list.push({ y: B.computer.y + B.computer.h, f: () => drawComputer(ctx, B.computer, g, t, scene.attention) });
    list.push({ y: B.life.y + B.life.h, f: () => drawLife(ctx, B.life, g, t) });
    list.push({ y: B.shield.y + B.shield.h, f: () => drawShieldTower(ctx, B.shield, g, t) });
    list.push({ y: B.greenhouse.y + B.greenhouse.h, f: () => drawGreenhouse(ctx, B.greenhouse, g, t) });
    list.push({ y: B.lab.y + B.lab.h, f: () => drawLab(ctx, B.lab, g, t) });
    list.push({ y: B.table.y + B.table.h, f: () => drawTable(ctx, B.table, g) });
    list.push({ y: B.launcher.y + B.launcher.h, f: () => drawLauncher(ctx, B.launcher, g, t, scene.launchT === undefined ? -1 : scene.launchT) });
    list.push({ y: BAY.y + BAY.h - 6, f: () => drawBay(ctx, g, t) });
    if (scene.parked && !scene.driving) list.push({ y: scene.parked.y + 2, f: () => drawRover(ctx, scene.parked.x, scene.parked.y, 3, t, true) });
    if (regionAt(player.x, player.y) === "far") list.push({ y: 760, f: () => drawCrew(ctx, 2960, 760, t, this.planet === "mars") });
    nodes.forEach((n) => { if (n.alive) list.push({ y: n.y + 3, f: () => drawNode(ctx, n, t) }); });
    if (zorp) list.push({ y: zorp.y, f: () => drawZorp(ctx, zorp.x, zorp.y, t, zorp.wave) });
    const preg = regionAt(player.x, player.y);
    if (preg === "cave") {
      const near = Math.hypot(player.x - 2900, player.y - 1296) < 120;
      list.push({ y: 1290, f: () => { drawZorp(ctx, 2900, 1290, t, near); if (!g.zorpMet) sign(ctx, 2900, 1236, "cave", "ZORP", "#7c3aed"); } });
      list.push({ y: 1460, f: () => sign(ctx, 2700, 1404, "cave", "EXIT", "#4338ca") });
    }
    list.push({ y: 99999, f: () => drawPlaces(ctx, g, t, preg) });
    list.push({ y: bolt.y, f: () => drawBolt(ctx, bolt.x, bolt.y, t) });
    if (!scene.hidePlayer) {
      const robot = this.planet === "mars";
      if (scene.driving) list.push({ y: player.y, f: () => drawDrivenRover(ctx, player.x, player.y, player.dir, t, robot, player.moving) });
      else list.push({ y: player.y, f: () => (robot ? drawRobot : drawAstronaut)(ctx, player.x, player.y, player.dir, player.walkFrame, player.moving, g.player, player.z) });
    }
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f());

    // crystals glow at the cave entrance
    for (let i = 0; i < 5; i++) {
      const a = 0.25 + Math.sin(t * 2 + i) * 0.15;
      disc(ctx, 1500 + (i - 2) * 28, 1088 - (i % 2) * 8, 9, "rgba(216,180,254," + a.toFixed(2) + ")");
    }
    if (preg === "cave") for (let i = 0; i < 14; i++) disc(ctx, 2660 + (i * 97) % 520, 1130 + (i * 61) % 380, 12, "rgba(192,132,252," + (0.12 + Math.sin(t * 2 + i) * 0.08).toFixed(2) + ")");
    // crystals glow in the Crystal Crater
    for (let i = 0; i < 6; i++) disc(ctx, CRYSTAL_CRATER.x + (i - 2.5) * 30, CRYSTAL_CRATER.y - 8 + (i % 2) * 14, 10, ["rgba(253,224,71,", "rgba(255,255,255,", "rgba(134,239,172,", "rgba(252,165,165,"][i % 4] + (0.2 + Math.sin(t * 2 + i) * 0.12).toFixed(2) + ")");
    // footstep dust
    this.dust = this.dust.filter((d) => d.life > 0);
    this.dust.forEach((d) => { d.life -= 0.04; px(ctx, d.x, d.y - (1 - d.life) * 6, 3, 2, "rgba(200,200,210," + (d.life * 0.6).toFixed(2) + ")"); });

    // timed action bar above the player
    if (action) {
      const w = 34, k = 1 - action.left / action.total, by = player.y - 31 - (player.z || 0);
      px(ctx, player.x - w / 2 - 2, by - 1, w + 4, 9, "#ffffff");
      px(ctx, player.x - w / 2 - 1, by, w + 2, 7, "#111827");
      px(ctx, player.x - w / 2, by + 1, Math.round(w * k), 5, "#facc15");
    }
    ctx.restore();

    this.drawLight(g, player, t, night);
    this.drawWeather(g, t, scene);
  },

  drawBubble(ctx, g, t) {
    const lvl = g.blackout ? 0 : g.systems.shield.level;
    const r = BASE.radius;
    if (lvl === 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.setLineDash([6, 8]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(BASE.x, BASE.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const strong = lvl === 2, rgb = strong ? "196,140,255" : "125,225,255";
    const img = this.domeImage(lvl);
    ctx.globalAlpha = 0.85 + Math.sin(t * 2) * 0.1;
    ctx.drawImage(img, BASE.x - img.width / 2, BASE.y - img.height / 2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(" + rgb + "," + (strong ? 0.9 : 0.55) + ")"; ctx.lineWidth = strong ? 3 : 2;
    ctx.beginPath(); ctx.arc(BASE.x, BASE.y, r, 0, Math.PI * 2); ctx.stroke();
    // a shimmer that travels around the rim
    ctx.strokeStyle = "rgba(255,255,255," + (strong ? 0.6 : 0.35) + ")"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = t * (strong ? 1.2 : 0.5) + i * 2.1;
      ctx.beginPath(); ctx.arc(BASE.x, BASE.y, r - 2, a, a + 0.35); ctx.stroke();
    }
    // sparks bouncing off the shield during a flare (more for stronger flares)
    if (g.flare) {
      const I = g.flare.def.I !== undefined ? g.flare.def.I : 0.5, n = Math.round(4 + 14 * I);
      for (let i = 0; i < n; i++) {
        const a = (t * 0.7 + i * 6.28 / n) % (Math.PI * 2);
        const rr = r + Math.sin(t * 12 + i) * 3;
        px(ctx, BASE.x + Math.cos(a) * rr, BASE.y + Math.sin(a) * rr, 3, 3, "rgba(255,230,150,0.9)");
      }
    }
  },

  // Darkness for night and blackouts, with a light around the astronaut
  drawLight(g, player, t, night) {
    let a = 0;
    const inCave = regionAt(player.x, player.y) === "cave";
    if (night) a = Math.min(0.55, (g.min / 60 - 19.5) / 6 * 0.55 + 0.1);
    if (inCave) a = Math.max(a, 0.5);
    if (g.blackout) a = Math.max(a, 0.62);
    if (g.min / 60 < 6.8) a = Math.max(a, (6.8 - g.min / 60) * 0.5);
    if (a <= 0.01) return;
    const d = this.darkCtx;
    d.globalCompositeOperation = "source-over";
    d.clearRect(0, 0, VIEW.w, VIEW.h);
    d.fillStyle = g.blackout ? "rgba(2,3,12," + a + ")" : "rgba(8,12,40," + a + ")";
    d.fillRect(0, 0, VIEW.w, VIEW.h);
    const s = this.toScreen(player.x, player.y - 10);
    d.globalCompositeOperation = "destination-out";
    const grad = d.createRadialGradient(s.x, s.y, 8, s.x, s.y, 90);
    grad.addColorStop(0, "rgba(0,0,0,0.95)"); grad.addColorStop(1, "rgba(0,0,0,0)");
    d.fillStyle = grad; d.fillRect(0, 0, VIEW.w, VIEW.h);
    // warm glow from buildings when the lights are on
    if (!g.blackout) {
      [[BUILDINGS.pod, 40, 34], [BUILDINGS.computer, 28, 24], [BUILDINGS.lab, 36, 30], [BUILDINGS.greenhouse, 50, 34]].forEach((o) => {
        const p = this.toScreen(o[0].x + o[0].w / 2, o[0].y + o[0].h / 2);
        const gr = d.createRadialGradient(p.x, p.y, 4, p.x, p.y, 60);
        gr.addColorStop(0, "rgba(0,0,0,0.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        d.fillStyle = gr; d.fillRect(p.x - 60, p.y - 60, 120, 120);
      });
    }
    if (inCave) {   // glowing crystals and Zorp's pool light up the cave
      [[2900, 1300, 90], [2700, 1450, 70], [2760, 1200, 55], [3010, 1420, 55], [2840, 1150, 50]].forEach((o) => {
        const p = this.toScreen(o[0], o[1]);
        const gr = d.createRadialGradient(p.x, p.y, 4, p.x, p.y, o[2]);
        gr.addColorStop(0, "rgba(0,0,0,0.7)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        d.fillStyle = gr; d.fillRect(p.x - o[2], p.y - o[2], o[2] * 2, o[2] * 2);
      });
    }
    d.globalCompositeOperation = "source-over";
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this.dark, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  },

  // Flare, siren and radiation-sickness screen effects
  drawWeather(g, t, scene) {
    const ctx = this.ctx;
    // The south: a darker, gloomier view on the Moon (deep shadow), a frosty cold view on Mars
    if (scene.player && regionAt(scene.player.x, scene.player.y) === "south") {
      if (this.planet === "mars") {
        ctx.fillStyle = "rgba(150,205,255,0.16)"; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
        const fg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 70, VIEW.w / 2, VIEW.h / 2, 300);
        fg.addColorStop(0, "rgba(220,240,255,0)"); fg.addColorStop(1, "rgba(220,240,255,0.55)");
        ctx.fillStyle = fg; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
        // icy crystals creeping in from the corners of the screen + drifting snow sparkles
        ctx.fillStyle = "rgba(240,250,255,0.7)";
        for (let i = 0; i < 16; i++) {
          const cx = i % 2 ? VIEW.w : 0, cy = i < 8 ? 0 : VIEW.h, a = i * 0.9 + 1, l = 14 + (i * 7) % 22;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (cx ? -1 : 1) * l * Math.cos(a % 1.5), cy + (cy ? -1 : 1) * l * Math.sin(a % 1.5) * 1.4); ctx.lineTo(cx + (cx ? -1 : 1) * l * 0.4, cy + (cy ? -1 : 1) * 4); ctx.fill();
        }
        for (let i = 0; i < 26; i++) {
          const sx = (i * 97 + t * (10 + i % 5 * 4)) % VIEW.w, sy = (i * 53 + t * (14 + i % 3 * 6)) % VIEW.h;
          ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.3 * Math.sin(t * 3 + i)).toFixed(2) + ")"; ctx.fillRect(sx, sy, 2, 2);
        }
      } else {
        const vg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 50, VIEW.w / 2, VIEW.h / 2, 290);
        vg.addColorStop(0, "rgba(0,0,12,0.12)"); vg.addColorStop(0.55, "rgba(0,0,12,0.5)"); vg.addColorStop(1, "rgba(0,0,10,0.9)");
        ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      }
    }
    if (g.siren > 0 && !g.flare) {
      const k = 0.5 + Math.sin(t * 8) * 0.5;
      const gr = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 90, VIEW.w / 2, VIEW.h / 2, 280);
      gr.addColorStop(0, "rgba(255,0,0,0)"); gr.addColorStop(1, "rgba(255,30,30," + (0.25 + k * 0.3).toFixed(2) + ")");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }
    if (g.flare) {
      const I = g.flare.def.I !== undefined ? g.flare.def.I : 0.5;
      const inside = !!scene.inside;
      const leak = inside ? Math.min(1, scene.leak || 0) : 1;     // how much radiation gets through to you
      const glow = 0.5 * I * (inside ? 0.25 : 1);
      if (glow > 0.02) {
        const gr = ctx.createRadialGradient(VIEW.w * 0.9, 0, 10, VIEW.w * 0.9, 0, 520);
        gr.addColorStop(0, "rgba(255,230,140," + glow.toFixed(2) + ")"); gr.addColorStop(1, "rgba(255,120,30," + (glow * 0.2).toFixed(2) + ")");
        ctx.fillStyle = gr; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      }
      // vignette: only outside the shield, and stronger for stronger flares
      const vig = inside ? 0 : 0.7 * Math.pow(Math.max(0, (I - 0.12) / 0.88), 1.3);
      if (vig > 0.02) {
        const gv = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 110, VIEW.w / 2, VIEW.h / 2, 300);
        gv.addColorStop(0, "rgba(255,60,20,0)"); gv.addColorStop(1, "rgba(200,30,10," + vig.toFixed(2) + ")");
        ctx.fillStyle = gv; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      }
      // radiation rain: few streaks for weak flares, many for strong ones; inside the dome only what leaks through
      const n = Math.round((4 + 56 * I) * leak);
      ctx.strokeStyle = "rgba(255,240,180," + (0.3 + 0.35 * I).toFixed(2) + ")"; ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const sx = ((i * 97 + t * 260) % (VIEW.w + 80)) - 40, sy = ((i * 53 + t * 190) % (VIEW.h + 80)) - 40;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 14, sy - 9); ctx.stroke();
      }
    }
    // Mars dust storm: a tan haze, wind-blown streaks and a dim sun. Stronger storms look much worse.
    const sl = typeof stormLevel === "function" ? stormLevel(g) : 0;
    if (sl > 0.02) {
      const inD = !!scene.inside, k = sl * (inD ? 0.55 : 1);
      ctx.fillStyle = "rgba(196,120,56," + (0.42 * k).toFixed(3) + ")"; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      const gv = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 70, VIEW.w / 2, VIEW.h / 2, 300);
      gv.addColorStop(0, "rgba(120,60,20,0)"); gv.addColorStop(1, "rgba(92,44,16," + (0.7 * k).toFixed(3) + ")");
      ctx.fillStyle = gv; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      const n = Math.round((20 + 150 * sl) * (inD ? 0.6 : 1));
      for (let i = 0; i < n; i++) {
        const sp = 220 + (i % 7) * 60 + sl * 260;
        const sx = ((i * 71 + t * sp) % (VIEW.w + 120)) - 60, sy = (i * 37 + Math.sin(t * 1.3 + i) * 6) % VIEW.h;
        ctx.strokeStyle = (i % 3 ? "rgba(230,170,110," : "rgba(160,95,50,") + (0.22 + 0.4 * sl).toFixed(2) + ")"; ctx.lineWidth = 1 + (i % 3 === 0 ? 1 : 0);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 16 - 24 * sl, sy + 2); ctx.stroke();
      }
      ctx.font = "bold 9px 'Trebuchet MS', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(VIEW.w / 2 - 70, 22, 140, 13);
      ctx.fillStyle = "#fde7c7"; ctx.fillText("🌪️ DUST STORM · " + (sl > 0.7 ? "HUGE" : sl > 0.4 ? "STRONG" : "MILD"), VIEW.w / 2, 32);
    }
    const rad = g.player.rad;
    if (rad > 30) {
      ctx.fillStyle = "rgba(120,255,90," + Math.min(0.35, (rad - 30) / 200).toFixed(2) + ")";
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }
    if (g.player.air < 30) {
      const k = (30 - g.player.air) / 30;
      const gr = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 80, VIEW.w / 2, VIEW.h / 2, 260);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0," + (0.35 + k * 0.5).toFixed(2) + ")");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }
  },

  puff(x, y) { this.dust.push({ x: x + (Math.random() - 0.5) * 4, y: y, life: 1 }); }
};

function clampN(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
