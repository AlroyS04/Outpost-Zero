// art.js — little animated pictures for the "Did you know?" facts, discovery cards and help cards.
// Each picture is a tiny drawing program. The canvas is 240 x 144 (drawn at 2x so text stays sharp).
// To add one: write a function in ART below and use its name as the "art" word in data.js.

const Art = {
  list: [], planet: "moon",
  marsNative: { familyphoto: 1, jezero: 1, ingenuity: 1, wright: 1, moxie: 1, marsday: 1, marstemp: 1, phobos: 1, marssun: 1, olympus: 1, marsdust: 1, hammerfeather: 1, crystals: 1, lander: 1 },
  // HTML for a picture. Call Art.mount(element) after putting the HTML on the page.
  html(key, cls) { return '<canvas class="art ' + (cls || "") + '" data-art="' + key + '" width="480" height="288"></canvas>'; },
  mount(root) {
    root.querySelectorAll("canvas[data-art]").forEach((cv) => {
      if (!this.list.some((o) => o.cv === cv)) this.list.push({ cv: cv, key: cv.dataset.art, t0: performance.now() });
    });
    if (!this.running) { this.running = true; requestAnimationFrame((ts) => this.loop(ts)); }
    this.drawAll(performance.now());
  },
  loop(ts) {
    this.list = this.list.filter((o) => o.cv.isConnected);
    if (!this.list.length) { this.running = false; return; }
    this.drawAll(ts);
    requestAnimationFrame((t2) => this.loop(t2));
  },
  drawAll(ts) {
    this.list.forEach((o) => {
      if (!o.cv.offsetParent && o.cv.offsetWidth === 0) return;
      const c = o.cv.getContext("2d"), fn = Art.pics[o.key] || Art.pics.moonplain;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 240, 144);
      c.save(); c.beginPath(); c.rect(0, 0, 240, 144); c.clip();
      try { fn(c, (ts - o.t0) / 1000); } catch (e) { /* a broken picture must never stop the game */ }
      // On Mars, pictures that were drawn for the Moon get a rusty tint
      if (Art.planet === "mars" && !Art.marsNative[o.key]) { c.globalCompositeOperation = "multiply"; c.fillStyle = "#e0905f"; c.fillRect(0, 0, 240, 144); }
      c.restore();
    });
  }
};

(function () {
// ---- tiny drawing helpers ----
const W = 240, H = 144;
function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function D(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
function O(c, x, y, rx, ry, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fill(); }
function P(c, pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); }
function L(c, x1, y1, x2, y2, col, w) { c.strokeStyle = col; c.lineWidth = w || 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function T(c, s, x, y, col, size, align) { c.font = "bold " + (size || 10) + "px 'Trebuchet MS', sans-serif"; c.fillStyle = col || "#fff"; c.textAlign = align || "center"; c.textBaseline = "alphabetic"; c.fillText(s, x, y); }
// a tiny astronaut standing on the ground at (x, y = feet), looking at you
function miniAstro(c, x, y) {
  O(c, x, y, 5, 1.5, "rgba(0,0,0,0.3)");
  R(c, x - 3, y - 5, 2.5, 5, "#e5e7eb"); R(c, x + 0.5, y - 5, 2.5, 5, "#e5e7eb");
  R(c, x - 3.5, y - 1.5, 3, 1.5, "#6b7280"); R(c, x + 0.5, y - 1.5, 3, 1.5, "#6b7280");
  R(c, x - 4.5, y - 13, 9, 8.5, "#f8fafc"); R(c, x - 6, y - 12, 1.8, 6, "#e5e7eb"); R(c, x + 4.2, y - 12, 1.8, 6, "#e5e7eb");
  R(c, x - 1.5, y - 10, 3, 2, "#f97316");
  O(c, x, y - 17, 4.2, 4.2, "#f8fafc"); O(c, x, y - 17, 2.8, 2.6, "#1e3a8a"); R(c, x - 1.6, y - 18.4, 1.6, 1, "rgba(255,255,255,0.7)");
}
function space(c, t) {
  R(c, 0, 0, W, H, "#050816");
  for (let i = 0; i < 34; i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i)); c.fillStyle = "rgba(255,255,255," + a.toFixed(2) + ")"; c.fillRect((i * 71) % W, (i * 37) % (H - 30), 1.4, 1.4); }
}
function ground(c, y, col) { R(c, 0, y, W, H - y, col || "#8b8e99"); R(c, 0, y, W, 2, "#b8bbc6"); for (let i = 0; i < 14; i++) R(c, (i * 53) % W, y + 6 + (i * 17) % (H - y - 8), 2, 1, "#6b6e79"); }
// Real continent outlines (rough longitude/latitude), turned into a spinning globe so you can really see the land
const LAND = [
  [[-168,66],[-140,70],[-95,72],[-80,70],[-62,60],[-55,50],[-67,45],[-76,35],[-81,25],[-97,22],[-105,20],[-118,32],[-125,48],[-140,60]],            // North America
  [[-80,10],[-62,11],[-50,0],[-35,-6],[-40,-22],[-58,-38],[-65,-55],[-74,-50],[-72,-30],[-80,-8]],                                                  // South America
  [[-17,21],[-5,36],[10,37],[32,31],[43,12],[51,12],[40,-15],[32,-29],[18,-35],[12,-17],[9,4],[-8,5],[-17,14]],                                    // Africa
  [[-10,36],[-9,44],[2,51],[10,58],[25,70],[60,70],[100,77],[140,72],[180,68],[150,45],[130,32],[122,22],[108,10],[104,1],[98,8],[80,8],[73,20],[60,25],[48,30],[36,36],[28,41],[10,44]], // Europe + Asia
  [[114,-22],[130,-12],[142,-11],[153,-26],[146,-39],[130,-32],[114,-34]],                                                                          // Australia
  [[-55,60],[-20,70],[-20,82],[-60,82]],                                                                                                            // Greenland
  [[-180,-70],[-90,-72],[0,-70],[90,-72],[180,-70],[180,-90],[-180,-90]]                                                                             // Antarctica
];
function earth(c, x, y, r, rot) {
  const lon0 = ((rot || 0) * 360 - 40) * Math.PI / 180, lat0 = 12 * Math.PI / 180;
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, "#3b82f6"); g.addColorStop(1, "#0b2a78");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
  c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.clip();
  LAND.forEach((poly, pi) => {
    c.beginPath();
    poly.forEach((p, i) => {
      const lo = p[0] * Math.PI / 180 - lon0, la = p[1] * Math.PI / 180;
      let px = Math.cos(la) * Math.sin(lo), py = Math.cos(lat0) * Math.sin(la) - Math.sin(lat0) * Math.cos(la) * Math.cos(lo);
      const z = Math.sin(lat0) * Math.sin(la) + Math.cos(lat0) * Math.cos(la) * Math.cos(lo);
      if (z < 0) { const l = Math.hypot(px, py) || 1; px /= l; py /= l; }          // far side: push to the edge
      i ? c.lineTo(x + px * r, y - py * r) : c.moveTo(x + px * r, y - py * r);
    });
    c.closePath();
    c.fillStyle = pi === 6 ? "#f1f5f9" : pi === 2 || pi === 4 ? "#7aa83c" : "#3da05b";
    c.fill(); c.strokeStyle = "rgba(10,60,30,0.7)"; c.lineWidth = Math.max(0.6, r * 0.03); c.stroke();
  });
  // clouds drift a little faster than the land
  [[-0.5, -0.45, 0.5, 0.1], [0.25, 0.1, 0.55, 0.09], [-0.2, 0.55, 0.5, 0.08], [0.6, -0.4, 0.35, 0.08]].forEach((b, i) => {
    const bx = ((b[0] + (rot || 0) * 3 * (1 + i * 0.1) + 3) % 2.6) - 1.3;
    O(c, x + bx * r, y + b[1] * r, r * b[2], r * b[3], "rgba(255,255,255,0.75)");
  });
  // night shade for a 3D look
  const sh = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.4, x, y, r * 1.05);
  sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,10,40,0.55)");
  c.fillStyle = sh; c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
  c.strokeStyle = "rgba(147,197,253,0.55)"; c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.stroke();
}
function moonBall(c, x, y, r, lit) {
  D(c, x, y, r, "#cfd2dc"); D(c, x - r * 0.3, y - r * 0.2, r * 0.18, "#a9acb8"); D(c, x + r * 0.3, y + r * 0.3, r * 0.25, "#a9acb8"); D(c, x + r * 0.1, y - r * 0.5, r * 0.12, "#a9acb8");
  if (lit !== undefined) { c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.clip(); c.fillStyle = "rgba(5,8,22,0.82)"; c.fillRect(x - r + lit * r * 2, y - r, r * 2, r * 2); c.restore(); }
}
function sun(c, x, y, r, t) { D(c, x, y, r * 1.5, "rgba(253,224,71,0.25)"); D(c, x, y, r, "#fde047"); for (let i = 0; i < 8; i++) { const a = i * 0.785 + (t || 0) * 0.3; L(c, x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2, x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7, "#fde047", 1.5); } }
function astro(c, x, y, s, dir) {
  s = s || 1; O(c, x, y, 8 * s, 2.5 * s, "rgba(0,0,0,0.3)");
  R(c, x - 5 * s, y - 8 * s, 4 * s, 8 * s, "#cbd5e1"); R(c, x + 1 * s, y - 8 * s, 4 * s, 8 * s, "#cbd5e1");
  R(c, x - 6 * s, y - 19 * s, 12 * s, 12 * s, "#f1f5f9"); R(c, x - 3 * s, y - 15 * s, 6 * s, 3 * s, "#f97316");
  R(c, x - 6 * s, y - 31 * s, 12 * s, 12 * s, "#f8fafc"); R(c, x - 5 * s + (dir || 0) * s, y - 28 * s, 8 * s, 7 * s, "#1e3a8a"); R(c, x - 4 * s + (dir || 0) * s, y - 28 * s, 3 * s, 2 * s, "#93c5fd");
}
function apple(c, x, y, s) { D(c, x, y, 4 * (s || 1), "#ef4444"); R(c, x - 0.5, y - 6 * (s || 1), 1.5, 3, "#7c5a3c"); P(c, [[x, y - 5 * (s || 1)], [x + 5, y - 7 * (s || 1)], [x + 3, y - 3 * (s || 1)]], "#22c55e"); }
function panel(c, x, y, w, h, dust) {
  R(c, x, y + 3, w, h, "#1f3f73"); R(c, x, y, w, h, "#2c5aa0"); R(c, x, y, w, 2, "#7fb0ee");
  for (let i = 1; i < 4; i++) R(c, x + (w / 4) * i, y, 1, h, "#1f3f73"); R(c, x, y + h / 2, w, 1, "#1f3f73");
  if (dust > 0) { c.fillStyle = "rgba(168,140,100," + (dust * 0.8).toFixed(2) + ")"; c.fillRect(x, y, w, h); }
  R(c, x + w / 2 - 1, y + h + 3, 3, 12, "#94a3b8");
}
function battery(c, x, y, w, h, pct, col) {
  R(c, x - 1, y - 1, w + 2, h + 2, "#0b1022"); R(c, x + w + 1, y + h / 3, 3, h / 3, "#94a3b8");
  R(c, x, y, w * pct, h, col || (pct < 0.3 ? "#f87171" : pct < 0.55 ? "#facc15" : "#4ade80"));
}
function arrowR(c, x, y, len, col) { L(c, x, y, x + len, y, col || "#fde047", 2); P(c, [[x + len + 4, y], [x + len - 2, y - 4], [x + len - 2, y + 4]], col || "#fde047"); }
function foot(c, x, y) { O(c, x, y, 3, 5, "#6f727e"); R(c, x - 2, y + 4, 4, 2, "#6f727e"); R(c, x - 3, y + 7, 6, 3, "#6f727e"); }
function label(c, s, x, y, col, size) {
  c.font = "bold " + (size || 9) + "px 'Trebuchet MS', sans-serif"; const w = c.measureText(s).width + 8;
  R(c, x - w / 2, y - 9, w, 12, "rgba(5,8,22,0.8)"); T(c, s, x, y, col || "#fff", size || 9);
}

const ART = Art.pics = {
  moonplain(c, t) { space(c, t); moonBall(c, 120, 74, 44); },

  // ===== Tutorial =====
  noair(c, t) {
    space(c, t); ground(c, 108, "#8b8e99");
    // left: no air outside
    astro(c, 52, 108, 1.3, 0); label(c, "Oxygen: 0 %", 52, 40, "#fca5a5", 10);
    T(c, "✖", 52, 58, "#ef4444", 22);
    // right: the air generator
    R(c, 150, 66, 54, 42, "#d5dbe6"); R(c, 150, 66, 54, 5, "#eef2f8"); R(c, 156, 78, 14, 30, "#374151");
    R(c, 210, 82, 3, 26, "#94a3b8");
    P(c, [[168, 40], [172, 48], [164, 48]], "#38bdf8"); D(c, 168, 49, 4, "#38bdf8");   // water drop
    T(c, "water", 168, 34, "#bae6fd", 8);
    for (let i = 0; i < 6; i++) { const k = (t * 0.5 + i / 6) % 1; D(c, 190 + Math.sin(i * 2 + t) * 6, 76 - k * 40, 2.6 + (i % 2) * 1.2, i % 3 ? "rgba(147,197,253,0.9)" : "rgba(254,202,202,0.9)"); }
    label(c, "O₂ to breathe", 192, 24, "#93c5fd", 9);
    L(c, 120, 90, 146, 90, "#fde047", 2); P(c, [[148, 90], [142, 86], [142, 94]], "#fde047");
    label(c, "Air generator", 178, 120, "#fff", 9); D(c, 160, 100, 3, Math.floor(t * 3) % 2 ? "#4ade80" : "#166534");
  },
  icefood(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); ground(c, 112, "#8b8e99");
    P(c, [[20, 112], [34, 56], [46, 112]], "#9bdcff"); P(c, [[40, 112], [58, 40], [76, 112]], "#d6f1ff"); P(c, [[60, 112], [72, 70], [84, 112]], "#7dd3fc");
    if (Math.floor(t * 3) % 3 === 0) R(c, 60, 34, 3, 3, "#fff");
    label(c, "ICE crystals", 52, 30, "#bae6fd", 9);
    arrowR(c, 92, 80, 24); P(c, [[142, 58], [147, 68], [137, 68]], "#38bdf8"); D(c, 142, 70, 5.5, "#38bdf8"); label(c, "water", 142, 52, "#bae6fd", 9);
    arrowR(c, 156, 80, 18);
    R(c, 190, 96, 28, 16, "#8b5e3c"); const k = (t * 0.35) % 1, h = 6 + k * 32;
    R(c, 203, 96 - h, 3, h, "#4ade80"); P(c, [[205, 96 - h * 0.6], [220, 96 - h * 0.6 - 6], [208, 96 - h * 0.6 + 4]], "#22c55e"); P(c, [[204, 96 - h * 0.3], [190, 96 - h * 0.3 - 5], [201, 96 - h * 0.3 + 4]], "#22c55e");
    if (k > 0.75) apple(c, 205, 96 - h - 4, 1);
    label(c, "plants → apples", 204, 126, "#fff", 9);
  },
  solardirty(c, t) {
    space(c, t); ground(c, 110, "#8b8e99");
    const k = (Math.sin(t * 0.9) + 1) / 2;       // 0 = clean, 1 = dirty
    panel(c, 70, 50, 100, 48, k * 0.85);
    sun(c, 30, 28, 9, t);
    for (let i = 0; i < 8; i++) { const a = (t * 0.6 + i / 8) % 1; L(c, 40 + a * 40, 34 + a * 18, 46 + a * 40, 37 + a * 18, "rgba(253,224,71," + (0.9 - k * 0.6) + ")", 1.5); }
    for (let i = 0; i < 10; i++) { const a = (t * 0.4 + i / 10) % 1; R(c, 80 + i * 8, 20 + a * 28, 2, 2, "rgba(190,165,125,0.9)"); }
    battery(c, 90, 124, 60, 10, 0.95 - k * 0.55);
    T(c, k > 0.5 ? "DIRTY: weak power" : "CLEAN: strong power", 120, 14, k > 0.5 ? "#fca5a5" : "#86efac", 10);
  },

  // ===== Coach help cards =====
  battery(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); const p = 0.5 + Math.sin(t) * 0.35;
    battery(c, 70, 52, 100, 30, p); T(c, Math.round(p * 100) + "%", 120, 73, "#06140f", 14);
    sun(c, 30, 30, 9, t); arrowR(c, 44, 36, 20, "#86efac"); T(c, "makes power", 40, 56, "#86efac", 8);
    R(c, 190, 24, 22, 20, "#475569"); T(c, "⚙", 201, 40, "#fff", 14); arrowR(c, 176, 34, -12, "#fca5a5"); T(c, "use power", 200, 56, "#fca5a5", 8);
  },
  energy(c, t) { R(c, 0, 0, W, H, "#0b1530"); astro(c, 70, 112, 1.5, 0); const b = 0.25 + (Math.sin(t * 2) + 1) * 0.15; R(c, 120, 44, 80, 12, "#0a0d1c"); R(c, 121, 45, 78 * b, 10, "#facc15"); T(c, "energy", 160, 40, "#fde68a", 10); apple(c, 160, 96, 2.2); T(c, "eat!", 160, 124, "#fff", 12); },
  air(c, t) { R(c, 0, 0, W, H, "#0b1530"); D(c, 90, 76, 36, "#f8fafc"); D(c, 90, 78, 28, "#1e3a8a"); R(c, 74, 62, 14, 4, "#93c5fd"); const a = 0.3 + (Math.sin(t * 1.5) + 1) * 0.1; R(c, 150, 40, 14, 70, "#0a0d1c"); R(c, 151, 109 - 68 * a, 12, 68 * a, "#f87171"); T(c, "AIR", 157, 34, "#bae6fd", 10); T(c, "low!", 157, 126, "#fca5a5", 10); },
  radiation(c, t) { R(c, 0, 0, W, H, "#0b1530"); sun(c, 36, 40, 12, t); for (let i = 0; i < 6; i++) { const k = (t * 0.7 + i / 6) % 1; L(c, 60 + k * 90, 40 + (i - 2.5) * 8 * (1 - k * 0.2), 70 + k * 90, 40 + (i - 2.5) * 8 * (1 - k * 0.2), "#fde047", 2); } R(c, 160, 24, 8, 80, "rgba(125,235,255,0.7)"); astro(c, 195, 112, 1.2, 0); T(c, "shield", 164, 20, "#a5f3fc", 9); },

  // ===== Did-you-know pictures =====
  flarescale(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); const cols = ["#86efac", "#bef264", "#fde047", "#fb923c", "#f87171"], names = ["A", "B", "C", "M", "X"];
    for (let i = 0; i < 5; i++) { const h = 10 + i * 20; R(c, 24 + i * 40, 112 - h, 28, h, cols[i]); T(c, names[i], 38 + i * 40, 128, "#fff", 12); if (i) T(c, "×10", 24 + i * 40 - 6, 112 - h - 4, "#fff", 8); }
    if (Math.floor(t * 2) % 2) R(c, 24 + 4 * 40, 112 - 90, 28, 3, "#fff");
  },
  lighttime(c, t) {
    space(c, t); sun(c, 26, 70, 14, t); moonBall(c, 206, 70, 16);
    const k = (t * 0.5) % 1; D(c, 40 + k * 150, 70, 4, "#fff"); T(c, "light: 8 minutes", 116, 54, "#fde047", 10);
    const k2 = (t * 0.1) % 1; O(c, 40 + k2 * 150, 100, 12, 6, "rgba(251,146,60,0.8)"); T(c, "solar cloud: 1-3 days", 116, 126, "#fb923c", 10);
  },
  magfield(c, t) {
    space(c, t); earth(c, 70, 72, 20, t * 0.05);
    c.strokeStyle = "rgba(147,197,253,0.7)"; c.lineWidth = 1.2; [28, 38, 48].forEach((r) => { c.beginPath(); c.ellipse(70, 72, r * 1.3, r, 0, -1.2, 1.2); c.stroke(); });
    for (let i = 0; i < 5; i++) { const k = (t * 0.6 + i / 5) % 1; const x = 0 + k * 70, y = 20 + i * 24; D(c, x, y + (k > 0.5 ? Math.sin(k * 6) * 10 : 0), 2, "#fde047"); }
    moonBall(c, 196, 72, 16); for (let i = 0; i < 5; i++) { const k = (t * 0.6 + i / 5) % 1; D(c, 120 + k * 70, 30 + i * 20, 2, "#fde047"); }
    label(c, "Earth: protected", 70, 128, "#86efac"); label(c, "Moon: no shield", 196, 128, "#fca5a5");
  },
  regolith(c, t) {
    space(c, t); ground(c, 100, "#8b8e99"); ctx_d(c);
    function ctx_d(cc) { cc.fillStyle = "#e9eef7"; cc.beginPath(); cc.ellipse(120, 100, 40, 36, 0, Math.PI, 0); cc.fill(); cc.fillStyle = "#7d7f8c"; cc.beginPath(); cc.ellipse(120, 102, 62, 46, 0, Math.PI, 0); cc.fill(); cc.fillStyle = "#e9eef7"; cc.beginPath(); cc.ellipse(120, 100, 32, 28, 0, Math.PI, 0); cc.fill(); }
    for (let i = 0; i < 5; i++) { const k = (t * 0.7 + i / 5) % 1; if (k < 0.55) L(c, 20 + i * 12 + k * 40, 10 + k * 70, 28 + i * 12 + k * 40, 16 + k * 70, "#fde047", 2); }
    label(c, "Moon soil on top = shield", 120, 130, "#fff");
  },
  dosimeter(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); R(c, 80, 30, 80, 60, "#e2e8f0"); R(c, 80, 30, 80, 8, "#94a3b8"); R(c, 90, 46, 60, 22, "#0f172a");
    T(c, (Math.floor(t * 3) % 40 + 10) + " µSv", 120, 62, "#4ade80", 12); D(c, 120, 80, 3, "#ef4444"); R(c, 112, 16, 16, 14, "#475569");
    label(c, "radiation badge", 120, 112, "#fff", 10); astro(c, 30, 120, 0.8, 0);
  },
  nightlength(c, t) {
    space(c, t); R(c, 20, 60, 100, 24, "#fde047"); R(c, 120, 60, 100, 24, "#1e293b"); T(c, "DAY ≈ 2 weeks", 70, 76, "#422006", 10); T(c, "NIGHT ≈ 2 weeks", 170, 76, "#94a3b8", 10);
    sun(c, 70, 38, 8, t); moonBall(c, 170, 36, 8); const x = 20 + ((t * 20) % 200); R(c, x - 1, 54, 3, 36, "#fff");
    panel(c, 40, 100, 40, 14, 0); T(c, "no sun = no power!", 170, 112, "#fca5a5", 10);
  },
  dust(c, t) {
    space(c, t); ground(c, 108); panel(c, 40, 48, 90, 44, 0.5 + Math.sin(t) * 0.2);
    for (let i = 0; i < 12; i++) { const k = (t * 0.3 + i / 12) % 1; R(c, 150 + (i % 4) * 14, 24 + k * 40 + (i % 3) * 8, 2, 2, "#c9b793"); }
    P(c, [[170, 100], [178, 84], [186, 96], [196, 80], [200, 104], [184, 110]], "#b8a07a"); label(c, "sharp, sticky dust grain", 170, 126, "#fff", 8);
  },
  distance(c, t) {
    space(c, t); earth(c, 36, 72, 22, t * 0.1); moonBall(c, 204, 72, 10);
    L(c, 62, 72, 192, 72, "rgba(255,255,255,0.3)", 1); const k = (t * 0.7) % 1; D(c, 62 + k * 130, 72, 4, "#fde047");
    T(c, "384,000 km", 120, 56, "#fff", 12); T(c, "radio: 1.3 seconds", 120, 100, "#fde047", 11);
  },
  radio(c, t) { ART.distance(c, t); },
  plants(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); R(c, 90, 90, 60, 26, "#8b5e3c"); R(c, 90, 90, 60, 5, "#a47148");
    const k = (t * 0.3) % 1, h = 8 + k * 54; R(c, 119, 90 - h, 3, h, "#4ade80");
    [0.3, 0.6, 0.9].forEach((f, i) => P(c, [[120, 90 - h * f], [120 + (i % 2 ? 16 : -16), 90 - h * f - 8], [120, 90 - h * f + 5]], "#22c55e"));
    if (k > 0.8) apple(c, 120, 90 - h - 6, 1.2);
    L(c, 30, 20, 100, 60, "rgba(253,224,71,0.35)", 8); T(c, "grow lamp", 36, 14, "#fde047", 9); label(c, "fresh food in space!", 120, 134, "#fff", 10);
  },
  iceshadow(c, t) {
    space(c, t); sun(c, 30, 26, 8, t); L(c, 38, 32, 100, 66, "rgba(253,224,71,0.5)", 3);
    P(c, [[0, 70], [70, 70], [96, 96], [160, 96], [190, 66], [240, 66], [240, 144], [0, 144]], "#8b8e99"); R(c, 98, 96, 60, 48, "#2c3652");
    for (let i = 0; i < 8; i++) if (Math.floor(t * 3 + i) % 3) R(c, 104 + i * 6, 106 + (i % 3) * 8, 2, 2, "#bfe9ff");
    label(c, "always dark = ice stays frozen", 128, 134, "#bae6fd", 9);
  },
  electrolysis(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); R(c, 80, 50, 80, 70, "#38bdf8"); R(c, 80, 50, 80, 6, "#7dd3fc"); R(c, 98, 34, 4, 70, "#cbd5e1"); R(c, 138, 34, 4, 70, "#cbd5e1");
    for (let i = 0; i < 8; i++) { const k = (t * 0.6 + i / 8) % 1; D(c, i % 2 ? 100 : 140, 100 - k * 56, 2 + (i % 2), i % 2 ? "#fff" : "#fecaca"); }
    T(c, "H₂", 100, 28, "#fff", 10); T(c, "O₂", 140, 28, "#fecaca", 10); T(c, "⚡ power", 120, 134, "#fde047", 10);
  },
  daynight(c, t) {
    space(c, t); moonBall(c, 120, 66, 36, (Math.sin(t * 0.8) + 1) / 2 * 0.9 + 0.05); T(c, "sunny ≈ 2 weeks, dark ≈ 2 weeks", 120, 120, "#fde047", 10); sun(c, 30, 66, 9, t);
  },
  temps(c, t) {
    space(c, t); const hot = Math.floor(t * 0.6) % 2 === 0;
    R(c, 106, 20, 28, 84, "#e2e8f0"); D(c, 120, 108, 16, hot ? "#ef4444" : "#38bdf8"); R(c, 114, hot ? 28 : 70, 12, hot ? 76 : 34, hot ? "#ef4444" : "#38bdf8");
    T(c, hot ? "127 °C in sunlight" : "-173 °C in the dark", 120, 14, hot ? "#fca5a5" : "#bae6fd", 11); if (hot) sun(c, 36, 60, 10, t); else moonBall(c, 36, 60, 10);
  },
  tidal(c, t) {
    space(c, t); earth(c, 120, 72, 20, t * 0.2); const a = t * 0.6, mx = 120 + Math.cos(a) * 66, my = 72 + Math.sin(a) * 46;
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.beginPath(); c.ellipse(120, 72, 66, 46, 0, 0, 6.3); c.stroke();
    moonBall(c, mx, my, 10); const fx = mx + (120 - mx) / Math.hypot(120 - mx, 72 - my) * 10, fy = my + (72 - my) / Math.hypot(120 - mx, 72 - my) * 10; D(c, fx, fy, 3, "#ef4444");
    T(c, "the red dot always faces Earth", 120, 134, "#fca5a5", 9);
  },
  apollo(c, t) {
    space(c, t); ground(c, 100); L(c, 150, 100, 150, 40, "#e5e7eb", 2); R(c, 150, 40, 40, 24, "#fff"); for (let i = 0; i < 4; i++) R(c, 150, 40 + i * 6, 40, 3, "#ef4444"); R(c, 150, 40, 16, 12, "#1d4ed8");
    for (let i = 0; i < 12; i++) miniAstro(c, 10 + i * 20, 134);     // twelve people have walked on the Moon
    T(c, "1969 – 1972: 12 people", 110, 20, "#fff", 10);
  },
  moonquake(c, t) {
    R(c, 0, 0, W, H, "#0b1530"); R(c, 10, 50, 220, 60, "#06140f"); c.strokeStyle = "#4ade80"; c.lineWidth = 1.5; c.beginPath();
    for (let x = 12; x < 228; x += 2) { const q = Math.exp(-Math.pow(((x - 12 + t * 40) % 220 - 110) / 30, 2)); c.lineTo(x, 80 + Math.sin(x * 0.9 + t * 8) * (2 + q * 24)); } c.stroke(); T(c, "seismometer: moonquake!", 120, 36, "#86efac", 10);
  },
  drift(c, t) {
    space(c, t); earth(c, 40, 72, 22, t * 0.1); const x = 150 + ((t * 2) % 30); moonBall(c, x, 72, 10); arrowR(c, 168 + ((t * 2) % 30) * 0.2, 72, 18, "#fde047"); T(c, "3.8 cm every year", 130, 114, "#fde047", 11); T(c, "like fingernails grow", 130, 128, "#fff", 9);
  },
  iss(c, t) {
    R(c, 0, 0, W, H, "#1b2a4a"); R(c, 20, 20, 200, 104, "#cbd5e1"); R(c, 28, 28, 184, 88, "#94a3b8"); const f = Math.sin(t * 1.2) * 3;
    R(c, 100, 38 + f, 26, 60, "#fb923c"); R(c, 100, 38 + f, 26, 6, "#fdba74"); D(c, 113, 36 + f, 9, "#fdba74"); T(c, "z z z", 145, 44 + f, "#fff", 12); L(c, 113, 30 + f, 113, 24, "#475569", 2); T(c, "no 'down' in space!", 120, 112, "#0f172a", 10);
  },

  // ===== Discovery pictures =====
  lander(c, t) {
    space(c, t); ground(c, 108); const y = 84 + Math.max(0, 22 - (t % 4) * 14) * 0;
    L(c, 100, y + 10, 82, y + 28, "#9ca3af", 3); L(c, 140, y + 10, 158, y + 28, "#9ca3af", 3); R(c, 76, y + 27, 12, 3, "#cbd5e1"); R(c, 152, y + 27, 12, 3, "#cbd5e1");
    R(c, 98, y - 12, 44, 24, "#d4a62f"); R(c, 98, y - 12, 44, 4, "#f0c85a"); R(c, 108, y - 4, 10, 9, "#7c5f14"); R(c, 124, y - 4, 10, 9, "#7c5f14"); R(c, 119, y - 26, 2, 14, "#9ca3af"); O(c, 120, y - 28, 8, 3, "#e5e7eb");
    R(c, 142, y - 2, 26, 14, "#2c5aa0"); label(c, "legs spread to land softly", 120, 132, "#fff", 9);
  },
  mooncave(c, t) {
    R(c, 0, 0, W, 40, "#050816"); R(c, 0, 40, W, H - 40, "#8b8e99"); R(c, 0, 40, W, 3, "#b8bbc6");
    O(c, 120, 92, 96, 26, "#1b1630"); R(c, 24, 90, 192, 28, "#1b1630"); O(c, 120, 118, 96, 10, "#1b1630");
    R(c, 150, 40, 14, 52, "#1b1630"); L(c, 150, 40, 130, 92, "rgba(253,224,71,0.35)", 6);   // skylight
    for (let i = 0; i < 5; i++) P(c, [[40 + i * 38, 108], [46 + i * 38, 92 - (i % 2) * 8], [52 + i * 38, 108]], i % 2 ? "#a855f7" : "#c084fc");
    for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; if (k < 0.5) L(c, 40 + i * 20 + k * 40, 8 + k * 30, 46 + i * 20 + k * 40, 14 + k * 30, "#fde047", 2); }
    astro(c, 90, 116, 0.8, 0); T(c, "radiation hits the roof…", 70, 16, "#fde047", 9); T(c, "…but not you!", 120, 138, "#86efac", 10);
  },
  zorp(c, t) {
    R(c, 0, 0, W, H, "#1b1630"); for (let i = 0; i < 6; i++) P(c, [[20 + i * 40, 144], [28 + i * 40, 90 - (i % 3) * 10], [36 + i * 40, 144]], i % 2 ? "#7c3aed" : "#a855f7");
    const b = Math.sin(t * 3); O(c, 120, 104, 16, 5, "rgba(0,0,0,0.3)"); O(c, 120, 80 + b, 16, 20, "#86efac"); O(c, 120, 84 + b, 11, 12, "#bbf7d0"); R(c, 111, 70 + b, 6, 8, "#111827"); R(c, 123, 70 + b, 6, 8, "#111827"); R(c, 115, 84 + b, 10, 2, "#166534");
    L(c, 110, 56 + b, 108, 44 + b, "#4ade80", 2); L(c, 130, 56 + b, 132, 44 + b, "#4ade80", 2); D(c, 108, 42 + b, 4, "#f0abfc"); D(c, 132, 42 + b, 4, "#f0abfc");
    const g = 0.5 + Math.sin(t * 4) * 0.3; D(c, 160, 70, 14, "rgba(216,180,254," + g.toFixed(2) + ")"); P(c, [[160, 54], [168, 70], [160, 86], [152, 70]], "#e9d5ff"); T(c, "power crystal", 160, 104, "#e9d5ff", 9);
  },
  hammerfeather(c, t) {
    space(c, t); ground(c, 112); astro(c, 70, 112, 1.3, 1);
    const k = (t % 4.5) / 1.4, f = Math.min(1, k), yy = 34 + f * f * 70;
    R(c, 96, yy, 5, 12, "#7c5a3c"); R(c, 92, yy, 13, 5, "#9ca3af");                                  // hammer
    c.save(); c.translate(130, yy + 4); c.rotate(Math.sin(t * 2) * 0.1); P(c, [[0, 0], [3, 8], [0, 14], [-3, 8]], "#f8fafc"); L(c, 0, 0, 0, 14, "#cbd5e1", 1); c.restore();   // feather
    if (f >= 1) { T(c, "Same time!", 120, 30, "#86efac", 13); }
    T(c, "No air: they fall together", 120, 136, "#fde047", 9);
  },
  familyphoto(c, t) {
    R(c, 0, 0, W, H, "#050816"); R(c, 0, 104, W, 40, "#8b8e99"); R(c, 0, 104, W, 2, "#b8bbc6");
    const k = Math.sin(t * 1.5) * 1.5;
    c.save(); c.translate(120, 66 + k); c.rotate(-0.06);
    R(c, -52, -36, 104, 76, "#f8fafc"); R(c, -48, -32, 96, 56, "#c7d2fe");
    [[-30, "#f97316"], [-10, "#3b82f6"], [10, "#22c55e"], [30, "#ec4899"]].forEach((f) => { D(c, f[0], -8, 7, "#fcd9bd"); R(c, f[0] - 8, -1, 16, 20, f[1]); });
    T(c, "family photo", 0, 36, "#475569", 8);
    c.restore();
    O(c, 120, 108, 62, 6, "rgba(0,0,0,0.3)");
    T(c, "left on the Moon in 1972", 120, 132, "#fde047", 9);
  },
  // ===== Mars "Did you know?" pictures =====
  marsday(c, t) {
    R(c, 0, 0, W, H, "#2a1a2e"); R(c, 0, 96, W, 48, "#b5654a"); R(c, 0, 96, W, 2, "#d98b6a");
    D(c, 120, 96, 62, "rgba(251,191,36,0.15)");
    const a = t * 0.8; D(c, 120 + Math.cos(a + 3.14) * 70, 96 - Math.abs(Math.sin(a)) * 66, 9, "#fde68a");
    T(c, "1 sol = 24 h 37 min", 120, 122, "#fff", 11); T(c, "a Mars day", 120, 136, "#fcd9bd", 9);
  },
  marstemp(c, t) {
    R(c, 0, 0, W, H, "#e8a77a"); R(c, 0, 98, W, 46, "#b5654a");
    R(c, 100, 20, 14, 72, "#f1f5f9"); R(c, 102, 22, 10, 68, "#1e293b");
    const lvl = 0.35 + Math.sin(t * 1.5) * 0.04; R(c, 103, 90 - lvl * 66, 8, lvl * 66, "#60a5fa"); D(c, 107, 94, 8, "#60a5fa");
    T(c, "about -60 °C", 170, 52, "#1e3a8a", 12); T(c, "brr! ❄", 170, 70, "#1e3a8a", 10);
    for (let i = 0; i < 5; i++) D(c, 30 + i * 12, 40 + Math.sin(t * 2 + i) * 4, 2, "rgba(255,255,255,0.8)");
  },
  phobos(c, t) {
    space(c, t); D(c, 60, 60, 30, "#c1583a"); D(c, 52, 52, 30, "rgba(0,0,0,0.25)");
    const a = t * 0.8; const x = 60 + Math.cos(a) * 80, y = 60 + Math.sin(a) * 36;
    O(c, x, y, 9, 7, "#8b8479"); D(c, x - 2, y - 1, 2, "#6b655c");
    const b = t * 0.4; O(c, 60 + Math.cos(b + 2) * 105, 60 + Math.sin(b + 2) * 52, 5, 4, "#a39b8e");
    T(c, "Phobos and Deimos", 150, 130, "#fff", 10);
  },
  marssun(c, t) {
    R(c, 0, 0, W, H, "#050816"); D(c, 60, 60, 28, "#fde047"); D(c, 60, 60, 36, "rgba(253,224,71,0.2)"); T(c, "Sun", 60, 104, "#fde047", 9);
    for (let i = 0; i < 6; i++) { const k = (t * 0.6 + i / 6) % 1; D(c, 100 + k * 40, 40 + i * 10, 2, "rgba(253,224,71,0.9)"); }
    D(c, 40, 118, 10, "#3b82f6"); T(c, "Earth: 100%", 40, 138, "#93c5fd", 8);
    D(c, 190, 80, 8, "#c1583a"); for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; D(c, 120 + k * 60, 56 + i * 8, 2, "rgba(253,224,71,0.8)"); }
    T(c, "Mars: about 43%", 190, 104, "#fdba74", 9);
  },
  olympus(c, t) {
    R(c, 0, 0, W, H, "#f0b98e"); R(c, 0, 104, W, 40, "#b5654a");
    P(c, [[20, 104], [80, 52], [160, 52], [226, 104]], "#a3563f"); P(c, [[80, 52], [90, 46], [150, 46], [160, 52]], "#c2785a");
    T(c, "Olympus Mons", 120, 30, "#7c2d12", 12); T(c, "about 22 km tall", 120, 126, "#fff", 10);
    L(c, 200, 104, 200, 52, "#fde047", 1); T(c, "↕ 3x Everest", 205, 40, "#7c2d12", 8, "left");
  },
  marsdust(c, t) {
    R(c, 0, 0, W, H, "#d9936a"); R(c, 0, 100, W, 44, "#b5654a");
    for (let i = 0; i < 40; i++) { const x = (i * 53 + t * 40) % (W + 20) - 10, y = 40 + (i * 29) % 60; D(c, x, y + Math.sin(t * 2 + i) * 3, 2 + (i % 3), "rgba(120,60,30,0.5)"); }
    R(c, 100, 84, 40, 12, "#f1f5f9"); D(c, 108, 100, 5, "#111827"); D(c, 132, 100, 5, "#111827");
    T(c, "rusty iron in the dust", 120, 22, "#7c2d12", 11);
  },
  jezero(c, t) {
    R(c, 0, 0, W, H, "#e8a77a"); R(c, 0, 90, W, 54, "#b5654a"); R(c, 0, 90, W, 2, "#d98b6a"); P(c, [[0, 90], [40, 70], [80, 90]], "#a3563f"); P(c, [[150, 90], [200, 64], [240, 90]], "#a3563f");
    const y = 30 + Math.min(1, (t % 6) / 4) * 46;
    L(c, 100, 8, 100, y, "#f1f5f9", 1); L(c, 140, 8, 140, y, "#f1f5f9", 1); R(c, 92, 4, 56, 8, "#e5e7eb");
    R(c, 100, y, 40, 14, "#f8fafc"); R(c, 104, y + 14, 8, 8, "#111827"); R(c, 128, y + 14, 8, 8, "#111827"); R(c, 112, y - 6, 16, 6, "#94a3b8");
    T(c, "Jezero Crater, Feb 18, 2021", 120, 134, "#fff", 9);
  },
  ingenuity(c, t) {
    R(c, 0, 0, W, H, "#e8a77a"); R(c, 0, 100, W, 44, "#b5654a"); R(c, 0, 100, W, 2, "#d98b6a");
    const h = 14 + Math.min(1, (t % 5) / 2) * 34 * (((t % 5) < 3.5) ? 1 : 0.2);
    const y = 96 - h; O(c, 120, 102, 14, 3, "rgba(0,0,0,0.25)");
    R(c, 114, y, 12, 10, "#e5e7eb"); R(c, 118, y - 6, 4, 6, "#9ca3af"); L(c, 118 - 30 * Math.cos(t * 30), y - 6, 122 + 30 * Math.cos(t * 30), y - 6, "#1f2937", 2);
    L(c, 116, y + 10, 112, y + 16, "#9ca3af", 1); L(c, 124, y + 10, 128, y + 16, "#9ca3af", 1);
    T(c, "First flight on another planet!", 120, 18, "#fff", 10); T(c, "April 19, 2021", 120, 134, "#fde047", 9);
  },
  wright(c, t) {
    R(c, 0, 0, W, H, "#e8a77a"); R(c, 0, 100, W, 44, "#b5654a");
    P(c, [[60, 70], [110, 54], [112, 64], [64, 82]], "#e9d8b4"); L(c, 70, 74, 106, 60, "#a8905f", 1); L(c, 84, 78, 108, 64, "#a8905f", 1);
    const p = 0.5 + Math.sin(t * 3) * 0.3; D(c, 160, 70, 14, "rgba(253,224,71," + p.toFixed(2) + ")"); R(c, 154, 66, 12, 8, "#e9d8b4");
    T(c, "A tiny piece of the first airplane wing", 120, 24, "#fff", 9); T(c, "flew with Ingenuity", 120, 36, "#fff", 9);
  },
  moxie(c, t) {
    R(c, 0, 0, W, H, "#1a1625");
    R(c, 90, 42, 60, 50, "#475569"); R(c, 94, 46, 52, 42, "#64748b"); T(c, "MOXIE", 120, 72, "#fff", 12);
    for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; T(c, "CO₂", 20 + k * 70, 60 + Math.sin(i * 2) * 14, "#fca5a5", 10); }
    for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; T(c, "O₂", 160 + k * 60, 60 + Math.sin(i * 3) * 14, "#86efac", 12); }
    T(c, "Mars air in, oxygen out", 120, 124, "#fde047", 10);
  },
  earthrise(c, t) { space(c, t); ground(c, 112); const mr = Art.planet === "mars"; earth(c, 120, 52, mr ? 7 : 28, t * 0.08); astro(c, 60, 112, 1, 0); label(c, mr ? "Home, seen from Mars" : "Home, seen from the Moon", 120, 136, "#fff", 9); },
  tranquility(c, t) {
    space(c, t); ground(c, 106); L(c, 170, 106, 170, 44, "#e5e7eb", 2); R(c, 170, 44, 40, 24, "#fff"); for (let i = 0; i < 4; i++) R(c, 170, 44 + i * 6, 40, 3, "#ef4444"); R(c, 170, 44, 16, 12, "#1d4ed8");
    R(c, 52, 92, 56, 14, "#c9a227"); P(c, [[52, 92], [60, 82], [100, 82], [108, 92]], "#eac95a"); L(c, 56, 106, 48, 118, "#9ca3af", 2); L(c, 104, 106, 112, 118, "#9ca3af", 2); T(c, "Tranquility Base", 120, 18, "#fff", 12);
  },
  eagle(c, t) {
    space(c, t); ground(c, 108); const y = 28 + Math.max(0, 40 - (t % 5) * 14);
    P(c, [[104, y + 14], [112, y], [128, y], [136, y + 14]], "#e5c453"); R(c, 100, y + 14, 40, 20, "#d4a62f"); R(c, 112, y + 18, 6, 6, "#1e293b"); R(c, 124, y + 18, 6, 6, "#1e293b");
    L(c, 102, y + 34, 90, y + 48, "#9ca3af", 2); L(c, 138, y + 34, 150, y + 48, "#9ca3af", 2);
    if (y < 68) { for (let i = 0; i < 4; i++) { P(c, [[112 + i * 4, y + 34], [120, y + 56 + (t * 40 + i * 9) % 12], [124 - i * 3, y + 34]], "rgba(253,224,71," + (0.8 - i * 0.15) + ")"); } }
    T(c, "July 20, 1969: “The Eagle has landed”", 120, 130, "#fde047", 9);
  },
  flagplant(c, t) {
    space(c, t); ground(c, 108); astro(c, 70, 108, 1.2, 1); astro(c, 150, 108, 1.2, -1); L(c, 110, 108, 110, 46, "#e5e7eb", 2); L(c, 110, 48, 146, 48, "#9ca3af", 1.5); R(c, 110, 48, 36, 22, "#fff"); for (let i = 0; i < 4; i++) R(c, 110, 48 + i * 5.5, 36, 2.6, "#ef4444"); R(c, 110, 48, 14, 11, "#1d4ed8");
    T(c, "no wind, so a rod keeps the flag out", 120, 130, "#fff", 9); if (Math.floor(t * 2) % 2) { R(c, 190, 30, 4, 4, "#fff"); }
  },
  descent(c, t) {
    space(c, t); ground(c, 108); P(c, [[60, 108], [70, 88], [170, 88], [180, 108]], "#c9a227"); R(c, 76, 76, 88, 12, "#eac95a"); R(c, 56, 108, 10, 4, "#9ca3af"); R(c, 174, 108, 10, 4, "#9ca3af");
    R(c, 100, 52, 40, 24, "#e5e7eb"); R(c, 108, 58, 10, 8, "#1e293b"); T(c, "upper part flew away", 120, 20, "#fff", 9); arrowR(c, 120, 46, 0, "#fde047"); L(c, 120, 48, 120, 30, "#fde047", 2);
    label(c, "descent stage: still here", 120, 128, "#fde047", 9); label(c, "plaque", 100, 100, "#fff", 8);
  },
  flagfall(c, t) {
    space(c, t); ground(c, 108); const k = Math.min(1, (t % 4) / 2), a = k * 1.3;
    c.save(); c.translate(170, 108); c.rotate(a); L(c, 0, 0, 0, -56, "#e5e7eb", 2); R(c, 0, -56, 34, 20, "#fff"); for (let i = 0; i < 7; i++) R(c, 0, -56 + i * 20 / 6.5, 34, 20 / 13, "#dc2626");   // 7 red stripes on white
    R(c, 0, -56, 15, 10.8, "#1e3a8a"); for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) R(c, 1.6 + q * 3.3, -54.6 + r * 3.1, 1.1, 1.1, "#fff");   // blue canton with stars
    c.restore();
    // Eagle's ascent stage lifts off, leaving the gold descent stage (the "launch pad") behind
    { const cx = 60, k = (t % 4) / 4, cy = 82 - k * 34;
      R(c, cx - 17, 95, 34, 11, "#c9a227"); R(c, cx - 17, 95, 34, 2, "#e8c547"); L(c, cx - 14, 106, cx - 26, 109, "#9ca3af", 2); L(c, cx + 14, 106, cx + 26, 109, "#9ca3af", 2); R(c, cx - 29, 108, 7, 2, "#9ca3af"); R(c, cx + 22, 108, 7, 2, "#9ca3af");
      for (let i = 0; i < 7; i++) { const d = 12 + ((t * 55 + i * 17) % 52), s = i % 2 ? 1 : -1; O(c, cx + s * d, 107 - (i % 3), 5, 1.6, "rgba(200,200,215," + (0.5 - d / 140).toFixed(2) + ")"); }   // blown-away dust
      const len = 14 + Math.sin(t * 40) * 3 + k * 6;
      P(c, [[cx - 6, cy + 13], [cx, cy + 13 + len], [cx + 6, cy + 13]], "rgba(251,146,60,0.9)"); P(c, [[cx - 3.5, cy + 13], [cx, cy + 13 + len * 0.7], [cx + 3.5, cy + 13]], "#fde047"); P(c, [[cx - 1.5, cy + 13], [cx, cy + 13 + len * 0.4], [cx + 1.5, cy + 13]], "#fff");
      P(c, [[cx - 4, cy + 8], [cx + 4, cy + 8], [cx + 6, cy + 13], [cx - 6, cy + 13]], "#6b7280");                               // engine bell
      P(c, [[cx - 15, cy - 8], [cx - 8, cy - 16], [cx + 8, cy - 16], [cx + 15, cy - 8], [cx + 15, cy + 8], [cx - 15, cy + 8]], "#cbd5e1");   // cabin
      R(c, cx - 15, cy + 3, 30, 5, "#c9a227"); R(c, cx - 4, cy - 21, 8, 5, "#9ca3af");                                           // gold base, docking hatch
      P(c, [[cx - 10, cy - 12], [cx - 3, cy - 12], [cx - 6.5, cy - 5]], "#0f172a"); P(c, [[cx + 3, cy - 12], [cx + 10, cy - 12], [cx + 6.5, cy - 5]], "#0f172a");   // two triangle windows
      R(c, cx - 20, cy - 4, 5, 7, "#94a3b8"); R(c, cx + 15, cy - 4, 5, 7, "#94a3b8");                                           // thruster quads
      L(c, cx + 7, cy - 16, cx + 13, cy - 27, "#e5e7eb", 1); O(c, cx + 13, cy - 27, 4, 2, "#e5e7eb"); }
    T(c, "Eagle blasts off: the exhaust knocks the flag down", 120, 132, "#fca5a5", 9);
  },
  crystals(c, t) {
    R(c, 0, 0, W, H, "#241a38"); for (let i = 0; i < 9; i++) { const h = 30 + (i * 17) % 40, x = 20 + i * 24; P(c, [[x - 8, 124], [x, 124 - h], [x + 8, 124]], ["#facc15", "#f1f5f9", "#22c55e", "#ef4444"][i % 4]); P(c, [[x - 3, 124], [x, 124 - h + 3], [x + 3, 124]], ["#fef08a", "#ffffff", "#86efac", "#fca5a5"][i % 4]); if (Math.floor(t * 3 + i) % 4 === 0) R(c, x - 1, 124 - h - 6, 3, 3, "#fff"); }
    T(c, "yellow, white, green and red crystals", 120, 20, "#fef9c3", 9);
  },
  oldsite(c, t) { space(c, t); ground(c, 108); R(c, 84, 78, 60, 24, "#c9a227"); L(c, 88, 102, 72, 116, "#6b7280", 3); L(c, 140, 102, 156, 116, "#6b7280", 3); for (let i = 0; i < 6; i++) foot(c, 170 + i * 9, 116 - (i % 2) * 6); T(c, "no wind, no rain: it all stays", 120, 20, "#fff", 10); T(c, "for millions of years", 120, 34, "#fde047", 10); },
  southpole(c, t) { space(c, t); R(c, 0, 0, W, H, "rgba(0,0,12,0.45)"); sun(c, 20, 100, 8, t); P(c, [[0, 112], [60, 112], [90, 104], [180, 104], [220, 112], [240, 112], [240, 144], [0, 144]], "#4b526a"); R(c, 90, 104, 90, 40, "#1c2339"); L(c, 26, 100, 200, 94, "rgba(253,224,71,0.25)", 3); for (let i = 0; i < 7; i++) if (Math.floor(t * 3 + i) % 3) R(c, 100 + i * 11, 118 + (i % 3) * 6, 2, 2, "#bfe9ff"); P(c, [[196, 112], [210, 60], [226, 112]], "#e5e9f5"); T(c, "deep dark crater: ice!", 120, 20, "#bae6fd", 10); },
  northpole(c, t) { space(c, t); ground(c, 108, "#9a9fb0"); sun(c, 120, 106, 9, t); [[40, 90], [100, 74], [170, 84], [210, 96]].forEach((p) => { P(c, [[p[0] - 24, 108], [p[0], p[1] - 20], [p[0] + 24, 108]], "#c4c9d8"); P(c, [[p[0], p[1] - 20], [p[0] + 24, 108], [p[0] + 4, 108]], "#8f96ab"); P(c, [[p[0] + 24, 108], [p[0] + 90, 118], [p[0] + 24, 116]], "rgba(20,24,40,0.3)"); }); // half of the Sun peeks in at the top: at the poles the Sun always hangs very low
    c.save(); c.beginPath(); c.rect(0, 0, W, 20); c.clip(); D(c, 120, 0, 24, "rgba(253,224,71,0.25)"); D(c, 120, 0, 15, "#fde047"); for (let i = 0; i < 9; i++) { const ang = 0.15 + i * 0.35 + (t || 0) * 0.1; L(c, 120 + Math.cos(ang) * 18, Math.sin(ang) * 18, 120 + Math.cos(ang) * 26, Math.sin(ang) * 26, "#fde047", 1.5); } c.restore();
    T(c, "sun stays low = long shadows", 120, 38, "#fff", 10); }
};
  Art.earthGlobe = earth;
})();
