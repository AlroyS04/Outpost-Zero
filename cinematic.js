// cinematic.js — the opening film: astronauts leave Earth on a NASA rocket and fly to the Moon.
// The order of events follows NASA's Artemis I mission timeline (see CREDITS in data.js).
// It is drawn with simple shapes on a 960 x 540 canvas. Skip it any time with Esc or the button.


// ---------------------------------------------------------------------------
// Film sound design. Everything is made with the browser's synthesizer (no audio files):
// mission-control radio chatter, a clean countdown, engine rumble and roar, stage separation thuds,
// the hum of space, thruster hiss and a soft landing thump. Muted with the 🔊 button like the rest of the game.
// ---------------------------------------------------------------------------
const FilmSound = {
  master: null,
  makeBuffers(ctx) {
    const n = ctx.sampleRate * 4, white = ctx.createBuffer(1, n, ctx.sampleRate), brown = ctx.createBuffer(1, n, ctx.sampleRate);
    const w = white.getChannelData(0), b = brown.getChannelData(0); let last = 0;
    for (let i = 0; i < n; i++) { const r = Math.random() * 2 - 1; w[i] = r; last = (last + 0.02 * r) / 1.02; b[i] = last * 3.2; }
    this.bufs = { white: white, brown: brown };
  },
  start(mars, ctxIn, t0In) {
    const ctx = ctxIn || (typeof Sound !== "undefined" ? Sound.ctx : null);
    if (!ctx || (!ctxIn && Sound.muted)) return;
    try { if (!ctxIn && ctx.state === "suspended" && ctx.resume) { const rp = ctx.resume(); if (rp && rp.catch) rp.catch(() => {}); } } catch (e) { /* ignore */ }
    this.ctx = ctx; this.t0 = (t0In !== undefined ? t0In : ctx.currentTime) + 0.05;
    this.master = ctx.createGain(); this.master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(ctx.destination);   // keeps loud parts from distorting
    this.makeBuffers(ctx);
    if (mars) this.marsTrip(); else this.moonTrip();
  },
  stop() {
    const m = this.master; if (!m) return; this.master = null;
    try { const t = this.ctx.currentTime; m.gain.cancelScheduledValues(t); m.gain.setValueAtTime(m.gain.value, t); m.gain.linearRampToValueAtTime(0, t + 0.2); } catch (e) { /* ignore */ }
    setTimeout(() => { try { m.disconnect(); } catch (e) { /* ignore */ } }, 400);
  },
  T(s) { return this.t0 + s; },
  // a burst of filtered noise. env = [[seconds, volume], ...] relative to the start
  noise(at, dur, o) {
    const ctx = this.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.bufs[o.buf || "white"]; src.loop = true;
    f.type = o.type || "lowpass"; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.f0, at); f.frequency.linearRampToValueAtTime(o.f1 !== undefined ? o.f1 : o.f0, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    o.env.forEach((p) => g.gain.linearRampToValueAtTime(Math.max(0.0001, p[1]), at + p[0]));
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(at, Math.random() * 2); src.stop(at + dur + 0.05);
  },
  tone(at, dur, f0, f1, type, vol) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(vol, at + Math.min(0.03, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(this.master); o.start(at); o.stop(at + dur + 0.05);
  },
  click(at, vol) { this.noise(at, 0.05, { type: "bandpass", f0: 2200, q: 1.2, env: [[0.002, vol || 0.2], [0.05, 0]] }); },
  // a mission-control radio call: squelch, a "roger" beep, squelch
  radio(at) {
    this.noise(at, 0.16, { type: "bandpass", f0: 2600, q: 0.9, env: [[0.01, 0.1], [0.14, 0.04], [0.16, 0]] });
    this.tone(at + 0.12, 0.07, 1350, 1350, "sine", 0.1); this.tone(at + 0.22, 0.07, 1700, 1700, "sine", 0.1);
    this.noise(at + 0.32, 0.12, { type: "bandpass", f0: 2600, q: 0.9, env: [[0.01, 0.08], [0.12, 0]] });
  },
  // a heavy "thunk" when a part of the rocket separates
  thunk(at) {
    this.tone(at, 0.45, 120, 34, "sine", 0.55);
    this.noise(at, 0.22, { type: "lowpass", f0: 900, env: [[0.01, 0.45], [0.22, 0]], buf: "brown" });
    this.click(at, 0.3);
  },
  // engine roar: deep rumble + hiss + crackle
  roar(at, dur, power) {
    const p = power || 1;
    this.noise(at, dur, { buf: "brown", type: "lowpass", f0: 220, f1: 1100, env: [[Math.min(1.5, dur / 3), 0.45 * p], [dur * 0.6, 0.6 * p], [dur, 0.5 * p]] });
    this.noise(at, dur, { buf: "white", type: "highpass", f0: 2200, env: [[dur * 0.3, 0.04 * p], [dur, 0.1 * p]] });
    this.tone(at, dur, 46, 60, "sine", 0.3 * p);
    for (let i = 0; i < Math.round(dur * 5); i++) this.click(at + Math.random() * dur, 0.08 * p);
  },
  drone(at, dur, v) {
    [98, 147, 196.5].forEach((f, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine"; o.frequency.value = f * (1 + i * 0.002);
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime((v || 0.035) / (i + 1), at + 1.5); g.gain.setValueAtTime((v || 0.035) / (i + 1), at + dur - 1.5); g.gain.linearRampToValueAtTime(0.0001, at + dur);
      o.connect(g); g.connect(this.master); o.start(at); o.stop(at + dur + 0.05);
    });
  },
  opening(mars) {            // 0 to 11 seconds: pad chatter, countdown, ignition (the same on both worlds)
    const T = (s) => this.T(s);
    this.noise(T(0), 11, { buf: "brown", type: "lowpass", f0: 350, env: [[1, 0.05], [10, 0.06], [11, 0]] });          // a light breeze at the pad
    [1.4, 3.1, 4.9, 6.3].forEach((s) => this.radio(T(s)));
    for (let k = 0; k < 8; k++) this.tone(T(6.9 + k * 0.5), 0.09, 1000, 1000, "sine", 0.14);                           // countdown ticks
    this.tone(T(10.5), 0.6, 1400, 1400, "sine", 0.12);                                                                  // "T minus zero" tone
    this.noise(T(9.4), 2.0, { buf: "brown", type: "lowpass", f0: 120, f1: 400, env: [[1.8, 0.35], [2, 0.4]] });        // ignition builds
    this.roar(T(11.2), 8.0, 1);
  },
  moonTrip() {
    const T = (s) => this.T(s);
    this.opening(false);
    this.thunk(T(19.2)); this.roar(T(19.3), 6.0, 0.7);        // side boosters fall away, the core stage keeps burning
    this.thunk(T(25.3));                                       // core stage separates
    this.drone(T(26), 40, 0.04);                               // the quiet hum of space
    this.tone(T(31.6), 1.8, 180, 520, "sawtooth", 0.025);      // solar panels unfold (a little motor)
    [33.4, 34.6, 35.8].forEach((s) => this.click(T(s), 0.3));  // latches click
    this.radio(T(36.4));
    this.noise(T(37.6), 5, { buf: "brown", type: "lowpass", f0: 90, f1: 200, env: [[0.8, 0.4], [4, 0.4], [5, 0]] });   // the big engine burn
    this.tone(T(37.6), 5, 40, 44, "sine", 0.25);
    this.noise(T(51.5), 5, { buf: "white", type: "highpass", f0: 3000, f1: 1800, env: [[0.5, 0.07], [4.5, 0.09], [5, 0]] });   // landing thrusters hiss
    this.tone(T(56.6), 0.6, 90, 28, "sine", 0.5); this.click(T(56.6), 0.25);                                              // touchdown
    this.radio(T(57.1));
  },
  marsTrip() {
    const T = (s) => this.T(s);
    this.opening(true);
    this.thunk(T(19.2));
    this.drone(T(19.6), 11, 0.04);                             // the long, quiet trip
    this.noise(T(30.4), 6.4, { buf: "white", type: "bandpass", f0: 900, f1: 2400, q: 0.5, env: [[1, 0.25], [3.5, 0.35], [5.5, 0.2], [6.4, 0]] });   // rushing into the thin air
    this.noise(T(30.4), 6.4, { buf: "brown", type: "lowpass", f0: 250, env: [[1.5, 0.4], [4, 0.45], [6.4, 0]] });
    for (let i = 0; i < 30; i++) this.click(T(31 + Math.random() * 4), 0.1);               // heat shield crackle
    this.tone(T(34.6), 0.5, 160, 50, "sine", 0.4); this.noise(T(34.6), 0.3, { type: "lowpass", f0: 700, env: [[0.02, 0.3], [0.3, 0]] });   // parachute opens
    this.noise(T(37.2), 4, { buf: "white", type: "highpass", f0: 3000, f1: 1800, env: [[0.4, 0.07], [3.6, 0.09], [4, 0]] });
    this.tone(T(41.3), 0.6, 90, 28, "sine", 0.5); this.click(T(41.3), 0.25);
    this.radio(T(41.8));
  }
};

const Cinematic = {
  playing: false,
  // Each caption: show from "a" to "b" seconds.
  captions: [
    { a: 0.3, b: 6.6, text: "Two astronauts head to the launch pad at NASA's Kennedy Space Center in Florida." },
    { a: 6.8, b: 10.9, text: "Countdown! The rocket is called SLS, the Space Launch System." },
    { a: 11.2, b: 18.8, text: "LIFTOFF! SLS makes about 8.8 million pounds of thrust to leave the ground." },
    { a: 19.2, b: 25, text: "About 2 minutes up, the two side boosters run out of fuel and fall away." },
    { a: 25.4, b: 31, text: "About 8 minutes up, the big orange core stage shuts off and separates." },
    { a: 31.4, b: 37, text: "About 18 minutes up, the capsule (Orion) unfolds its solar panels to make power." },
    { a: 37.4, b: 44, text: "About 1.5 hours after launch, one big engine burn pushes the crew out of Earth's orbit toward the Moon." },
    { a: 44.4, b: 50.4, text: "Then they coast through space for several days." },
    { a: 50.8, b: 57.5, text: "In our game a small pod lands you on the Moon. (Real missions use a separate lander.)" }
  ],
  moonCaptions: null,
  total: 58.5,
  marsCaptions: [
    { a: 0.3, b: 6.6, text: "Remember: no human has ever been to Mars. Robots go first!" },
    { a: 6.8, b: 10.9, text: "Countdown! Real Mars missions launch from Florida on big rockets." },
    { a: 11.2, b: 18.8, text: "LIFTOFF! In our game, YOU are a robot explorer on this rocket." },
    { a: 19.2, b: 30, text: "Then a long, quiet trip through space: about 7 months to Mars." },
    { a: 30.4, b: 36.4, text: "Arrival! The capsule hits Mars's thin air very fast. A heat shield and parachute slow it down." },
    { a: 36.8, b: 41.7, text: "In our game a small pod sets you down gently. (Real rovers use a sky crane.)" }
  ],
  marsTotal: 42.5,

  play(done, mode) {
    if (!this.moonCaptions) this.moonCaptions = this.captions;
    this.mars = mode === "mars";
    this.captions = this.mars ? this.marsCaptions : this.moonCaptions;
    this.total = this.mars ? this.marsTotal : 58.5;
    const src = document.getElementById("film-src");
    if (src) src.textContent = this.mars ? "Source: NASA Mars missions (Perseverance launched July 30, 2020) · a simplified story" : "Source: NASA Artemis I mission timeline · a simplified story";
    const root = document.getElementById("film"), cv = document.getElementById("film-cv"), cap = document.getElementById("film-cap");
    this.root = root; this.cv = cv; this.cap = cap; this.done = done; this.playing = true;
    root.classList.remove("hidden");
    this.t0 = performance.now();
    this.ctx = cv.getContext("2d");
    FilmSound.start(this.mars);
    const loop = (ts) => {
      if (!this.playing) return;
      const t = (ts - this.t0) / 1000;
      if (t >= this.total) { this.finish(); return; }
      this.draw(this.ctx, t);
      const c = this.captions.find((k) => t >= k.a && t <= k.b);
      cap.textContent = c ? c.text : "";
      cap.classList.toggle("hidden", !c);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  skip() { if (this.playing) this.finish(); },
  finish() {
    this.playing = false;
    FilmSound.stop();
    this.root.classList.add("hidden");
    if (this.done) { const d = this.done; this.done = null; d(); }
  },

  // ---------- drawing helpers ----------
  rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); },
  disc(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); },
  poly(c, pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); },
  mix(a, b, k) { k = Math.max(0, Math.min(1, k)); return a.map((v, i) => Math.round(v + (b[i] - v) * k)); },
  stars(c, t, alpha) {
    if (alpha <= 0) return;
    for (let i = 0; i < 90; i++) {
      const x = (i * 137.5) % 960, y = (i * 73.1) % 440, a = alpha * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)));
      c.fillStyle = "rgba(255,255,255," + a.toFixed(2) + ")"; c.fillRect(x, y, 2, 2);
    }
  },
  flame(c, x, y, len, w, t) {
    const f = len * (0.85 + Math.sin(t * 40) * 0.15);
    this.poly(c, [[x - w, y], [x, y + f], [x + w, y]], "#f97316");
    this.poly(c, [[x - w * 0.6, y], [x, y + f * 0.75], [x + w * 0.6, y]], "#fde047");
    this.poly(c, [[x - w * 0.3, y], [x, y + f * 0.4], [x + w * 0.3, y]], "#fff");
  },
  // The SLS rocket, standing on (x, y = its bottom). s = size.
  sls(c, x, y, s, o) {
    o = o || {};
    if (o.core !== false) {
      this.rect(c, x - 18 * s, y - 210 * s, 36 * s, 210 * s, "#e07b39"); this.rect(c, x - 18 * s, y - 210 * s, 8 * s, 210 * s, "#f2a064");
      this.rect(c, x - 18 * s, y - 232 * s, 36 * s, 22 * s, "#e5e7eb");                          // upper stage
    }
    if (o.boosters !== false) {
      [-1, 1].forEach((d) => {
        const bx = x + d * 30 * s;
        this.rect(c, bx - 9 * s, y - 150 * s, 18 * s, 150 * s, "#f8fafc"); this.rect(c, bx - 9 * s, y - 100 * s, 18 * s, 6 * s, "#1e293b");
        this.poly(c, [[bx - 9 * s, y - 150 * s], [bx, y - 172 * s], [bx + 9 * s, y - 150 * s]], "#e2e8f0");
      });
    }
    if (o.orion !== false) {
      this.poly(c, [[x - 12 * s, y - 232 * s], [x - 5 * s, y - 262 * s], [x + 5 * s, y - 262 * s], [x + 12 * s, y - 232 * s]], "#f1f5f9");
      this.rect(c, x - 1 * s, y - 296 * s, 2 * s, 34 * s, "#cbd5e1");
      this.poly(c, [[x - 3 * s, y - 296 * s], [x, y - 306 * s], [x + 3 * s, y - 296 * s]], "#ef4444");
    }
  },
  earthBelow(c, cy, r, t) {
    this.disc(c, 480, cy, r * 1.04, "rgba(120,190,255,0.35)"); this.disc(c, 480, cy, r, "#1d4ed8");
    c.save(); c.beginPath(); c.arc(480, cy, r, 0, 6.2832); c.clip();
    [[-0.4, 0.1, 0.5], [0.3, 0.05, 0.4], [0.0, 0.3, 0.6]].forEach((b, i) => { c.fillStyle = "#22a05a"; c.beginPath(); c.ellipse(480 + b[0] * r + (t * 8 % 400) * (i ? -0.3 : 0.3), cy + b[1] * r, r * b[2] * 0.6, r * 0.12, 0, 0, 6.2832); c.fill(); });
    c.fillStyle = "rgba(255,255,255,0.5)"; for (let i = 0; i < 6; i++) c.fillRect(480 - r + ((i * 190 + t * 20) % (2 * r)), cy - r * 0.2 + (i % 3) * 22, 80, 8);
    c.restore();
  },

  // ---------- The trip to Mars, arrival and landing ----------
  marsScene(c, t) {
    const W = 960, H = 540;
    if (t < 30.2) {
      const u = (t - 19.5) / 10.7;
      this.rect(c, 0, 0, W, H, "#03050f"); this.stars(c, t, 1);
      this.disc(c, 150 - u * 60, 300, 110 - u * 70, "#1d4ed8"); this.disc(c, 150 - u * 60 + 18, 280, (110 - u * 70) * 0.45, "rgba(34,160,90,0.7)");
      const mr = 18 + u * u * 130;
      this.disc(c, 800, 250, mr, "#c1583a"); this.disc(c, 800 - mr * 0.25, 250 - mr * 0.2, mr * 0.35, "rgba(120,50,30,0.5)"); this.rect(c, 800 - mr * 0.3, 250 - mr, mr * 0.6, mr * 0.12, "#f1f5f9");
      const ox = 260 + u * 300, oy = 270 + Math.sin(u * 6) * 8;
      this.poly(c, [[ox + 18, oy - 9], [ox + 44, oy], [ox + 18, oy + 9]], "#f1f5f9"); this.rect(c, ox - 8, oy - 10, 28, 20, "#cbd5e1");
      this.rect(c, ox - 6, oy - 24, 12, 14, "#2c5aa0"); this.rect(c, ox - 6, oy + 10, 12, 14, "#2c5aa0");
      c.font = "900 42px 'Trebuchet MS', sans-serif"; c.textAlign = "center"; c.fillStyle = "#fde047";
      c.fillText("Month " + (1 + Math.min(6, Math.floor(u * 7))) + " …", 480, 90);
    } else if (t < 36.6) {
      const u = (t - 30.2) / 6.4;
      this.rect(c, 0, 0, W, H, "#1b0f1e"); this.stars(c, t, 0.6);
      this.disc(c, 480, 900 - u * 120, 560, "#c1583a"); this.disc(c, 480, 900 - u * 120, 600, "rgba(255,170,120,0.18)");
      const cx = 480 - 120 + u * 120, cy = 90 + u * 190;
      if (u > 0.65) { // parachute
        this.poly(c, [[cx - 70, cy - 120], [cx + 70, cy - 120], [cx + 40, cy - 40], [cx - 40, cy - 40]], "#f8fafc"); this.disc(c, cx, cy - 120, 70, "#f8fafc"); this.rect(c, cx - 1, cy - 50, 2, 40, "#94a3b8");
      }
      this.poly(c, [[cx - 20, cy], [cx + 20, cy], [cx + 12, cy + 26], [cx - 12, cy + 26]], "#d6d3d1");
      if (u < 0.65) { for (let i = 0; i < 12; i++) this.disc(c, cx + Math.sin(t * 30 + i) * 14, cy - 16 - i * 8, 14 - i * 0.8, "rgba(255," + (170 - i * 8) + ",60," + (0.7 - i * 0.05).toFixed(2) + ")"); }
    } else {
      const u = Math.min(1, (t - 36.8) / 5);
      this.rect(c, 0, 0, W, 400, "#e8a77a"); this.rect(c, 0, 400, W, 140, "#b5654a"); this.rect(c, 0, 400, W, 4, "#d98b6a");
      this.poly(c, [[0, 400], [120, 330], [260, 400]], "#a3563f"); this.poly(c, [[620, 400], [800, 310], [960, 400]], "#a3563f");
      for (let i = 0; i < 20; i++) this.rect(c, (i * 83) % W, 410 + (i * 29) % 120, 3, 2, "#8a4a36");
      this.disc(c, 800, 110, 6, "#bfdbfe");                          // Earth is just a dot from Mars
      const py = 100 + u * u * 280;
      this.poly(c, [[430, py + 50], [450, py], [510, py], [530, py + 50]], "#e9eef7"); this.rect(c, 428, py + 50, 104, 22, "#cbd5e1");
      this.rect(c, 462, py + 8, 36, 20, "#7c2d12");
      this.rect(c, 420, py + 72, 8, 14, "#94a3b8"); this.rect(c, 532, py + 72, 8, 14, "#94a3b8");
      if (u < 0.97) this.flame(c, 480, py + 72, 70 * (1 - u * 0.4), 18, t);
      if (u > 0.9) for (let i = 0; i < 18; i++) this.disc(c, 480 + (i - 9) * 22, 424, 10 + (u - 0.9) * 90, "rgba(190,120,90,0.35)");
    }
  },

  draw(c, t) {
    const W = 960, H = 540;
    // altitude (0 on the ground .. 1 in space) controls the sky colour
    const alt = Math.max(0, Math.min(1, (t - 11) / 8));
    const sky = this.mix([255, 190, 120], [110, 190, 255], t / 4);
    const top = this.mix(this.mix([90, 120, 200], [40, 130, 230], t / 4), [3, 5, 20], alt);
    const bot = this.mix(sky, [3, 5, 20], alt * 1.4);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgb(" + top + ")"); g.addColorStop(1, "rgb(" + bot + ")");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    this.stars(c, t, Math.max(0, alt * 1.2 - 0.2));

    if (t < 19.5) {
      // ---------- On the ground, then climbing ----------
      const lift = t < 11 ? 0 : Math.pow(t - 11, 1.9) * 7;          // how high the rocket is
      const camY = Math.max(0, lift - 120) * 1.2;                      // ground slides away
      const gy = 430 + camY;
      if (gy < H + 400) {
        this.rect(c, 0, gy, W, 400, "#4a7c3a"); this.rect(c, 0, gy, W, 8, "#6aa055"); this.rect(c, 380, gy, 200, 14, "#8b8e99");
        this.rect(c, 150, gy - 60, 90, 60, "#d1d5db"); this.rect(c, 150, gy - 60, 90, 6, "#9ca3af");
        // gantry tower (the lattice tower beside the rocket)
        for (let i = 0; i < 12; i++) { this.rect(c, 420, gy - 330 + i * 28, 6, 28, "#b0382c"); this.rect(c, 420, gy - 330 + i * 28, 40, 4, "#b0382c"); }
        this.rect(c, 454, gy - 330, 6, 330, "#b0382c");
      }
      const rx = 560, ry = gy - lift;
      // astronauts walk to the rocket
      if (t < 6.5 && !this.mars) {
        [0, 1].forEach((i) => {
          const wx = 160 + t * 62 - i * 36, wy = gy - 6 + Math.sin(t * 9 + i) * 2;
          this.rect(c, wx - 8, wy - 40, 16, 26, "#f97316"); this.rect(c, wx - 8, wy - 14, 7, 14, "#ea580c"); this.rect(c, wx + 1, wy - 14, 7, 14, "#ea580c");
          this.disc(c, wx, wy - 52, 12, "#f1f5f9"); this.rect(c, wx - 8, wy - 56, 16, 10, "#1e3a8a");
          this.rect(c, wx + 6 + Math.sin(t * 9 + i) * 3, wy - 36, 5, 16, "#f97316");
        });
      }
      // countdown
      if (t > 7.4 && t < 10.9) {
        const n = 3 - Math.floor((t - 7.4) / 1.0);
        c.font = "900 150px 'Trebuchet MS', sans-serif"; c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,0.9)"; c.strokeStyle = "#111"; c.lineWidth = 8;
        const txt = n > 0 ? String(n) : "GO!"; c.strokeText(txt, 220, 300); c.fillText(txt, 220, 300);
      }
      this.sls(c, rx, ry, 1, { boosters: t < 19.2, orion: true });
      if (t > 10.2) {
        const p = Math.min(1, (t - 10.2) / 1.2), f = 60 * p + (t > 12 ? 80 : 0);
        this.flame(c, rx, ry, f, 26, t); this.flame(c, rx - 30, ry, f * 0.9, 12, t + 1); this.flame(c, rx + 30, ry, f * 0.9, 12, t + 2);
        for (let i = 0; i < 26; i++) {   // smoke
          const k = ((t * 1.2 + i * 0.27) % 3) / 3, sx = rx + (i % 2 ? 1 : -1) * (30 + k * 140 + (i % 5) * 12), sy = Math.min(gy, ry + 10 + k * 260);
          this.disc(c, sx, sy - 6, 18 + k * 40, "rgba(240,240,245," + (0.55 * (1 - k)).toFixed(2) + ")");
        }
      }
      if (t > 12) { for (let i = 0; i < 5; i++) { const cy2 = ((i * 130 + t * 160) % 700) - 80; this.disc(c, 120 + i * 190, cy2, 40, "rgba(255,255,255,0.18)"); } }
    } else if (this.mars) {
      this.marsScene(c, t);
    } else if (t < 25.2) {
      // ---------- Booster separation (about 2 minutes) ----------
      const u = t - 19.5, ry = 330;
      this.earthBelow(c, 900, 520, t);
      this.sls(c, 480, ry, 0.9, { boosters: false });
      this.flame(c, 480, ry, 60, 24, t);
      [-1, 1].forEach((d) => {
        const bx = 480 + d * (30 * 0.9 + u * u * 22 + u * 14), by = ry + u * u * 34;
        c.save(); c.translate(bx, by - 70); c.rotate(d * u * 0.35); this.rect(c, -8, -70, 17, 140, "#f8fafc"); this.poly(c, [[-8, -70], [0, -92], [9, -70]], "#e2e8f0"); c.restore();
        for (let i = 0; i < 5; i++) this.disc(c, bx + (Math.sin(t * 20 + i) * 8), by - 10 + i * 10, 3, "#fde047");
      });
      if (u < 1.3) { this.disc(c, 480, ry - 90, 120 * (1 - u / 1.3), "rgba(255,240,180," + (0.5 * (1 - u / 1.3)).toFixed(2) + ")"); }
    } else if (t < 31.2) {
      // ---------- Core stage separation (about 8 minutes) ----------
      const u = t - 25.4, ry = 330;
      this.earthBelow(c, 860, 480, t);
      if (u < 1.2) this.flame(c, 480, ry, 50, 24, t);
      const sep = Math.max(0, u - 1.2);
      // core falls back and tumbles
      c.save(); c.translate(480 - sep * 12, ry + 20 + sep * sep * 26); c.rotate(sep * 0.25);
      this.rect(c, -18, -150, 36, 190, "#e07b39"); this.rect(c, -18, -150, 8, 190, "#f2a064"); c.restore();
      // upper stage + Orion go on
      const ux = 480 + sep * 16, uy = ry - 160 - sep * 40;
      this.rect(c, ux - 15, uy - 20, 30, 40, "#e5e7eb"); this.poly(c, [[ux - 12, uy - 20], [ux - 5, uy - 50], [ux + 5, uy - 50], [ux + 12, uy - 20]], "#f1f5f9");
      if (sep > 0.8) this.flame(c, ux, uy + 20, 36, 8, t);
    } else if (t < 37.2) {
      // ---------- Orion opens its solar arrays (about 18 minutes) ----------
      const u = (t - 31.4) / 5.2;
      this.earthBelow(c, 820, 440, t);
      const ox = 480, oy = 250, open = Math.min(1, u * 1.4);
      this.poly(c, [[ox - 26, oy + 30], [ox - 14, oy - 28], [ox + 14, oy - 28], [ox + 26, oy + 30]], "#f1f5f9");
      this.rect(c, ox - 30, oy + 30, 60, 38, "#cbd5e1"); this.rect(c, ox - 30, oy + 30, 60, 6, "#94a3b8");
      [-1, 1].forEach((d) => { for (let i = 0; i < 4; i++) {
        const wx = ox + d * (30 + i * 46 * open), wy = oy + 48;
        this.rect(c, wx - 21, wy - 12, 42, 24, "#2c5aa0"); this.rect(c, wx - 21, wy - 12, 42, 3, "#7fb0ee"); this.rect(c, wx - 1, wy - 12, 2, 24, "#1f3f73");
      } });
    } else if (t < 44.2) {
      // ---------- The big burn that sends them to the Moon ----------
      const u = (t - 37.4) / 6.6, ox = 360 + u * 120, oy = 270;
      this.earthBelow(c, 760 + u * 120, 340 - u * 60, t);
      this.rect(c, ox - 22, oy - 10, 62, 36, "#e5e7eb"); this.rect(c, ox - 22, oy - 10, 62, 5, "#94a3b8");
      this.poly(c, [[ox + 40, oy - 10], [ox + 70, oy + 8], [ox + 40, oy + 26]], "#f1f5f9");
      if (u < 0.75) { c.save(); c.translate(ox - 22, oy + 8); c.rotate(Math.PI / 2); this.flame(c, 0, 0, 90, 16, t); c.restore(); this.rect(c, ox - 90, oy + 6, 0, 0, "#000"); }
      for (let i = 0; i < 16; i++) { this.rect(c, (i * 97 + t * 300) % W, 80 + (i * 61) % 360, 40, 2, "rgba(255,255,255,0.35)"); }
      // the stage lets go of the capsule at the end
      if (u > 0.85) { c.save(); c.translate(ox - 40 - (u - 0.85) * 300, oy + 10); this.rect(c, -30, -10, 50, 26, "#9ca3af"); c.restore(); }
    } else if (t < 50.6) {
      // ---------- Coasting: Earth shrinks, the Moon grows ----------
      const u = (t - 44.4) / 6.2;
      this.disc(c, 190 - u * 70, 270, 120 - u * 90, "#1d4ed8"); this.disc(c, 190 - u * 70 + 20, 250, (120 - u * 90) * 0.5, "rgba(34,160,90,0.7)");
      this.disc(c, 800, 250, 22 + u * u * 120, "#cfd2dc"); this.disc(c, 800 - 6 - u * 10, 246, 5 + u * 20, "#aeb1bd"); this.disc(c, 812 + u * 12, 262, 4 + u * 14, "#aeb1bd");
      const ox = 280 + u * 260, oy = 270 + Math.sin(u * 5) * 6;
      this.poly(c, [[ox + 20, oy - 8], [ox + 44, oy], [ox + 20, oy + 8]], "#f1f5f9"); this.rect(c, ox - 6, oy - 9, 28, 18, "#cbd5e1");
      this.rect(c, ox - 4, oy - 22, 10, 14, "#2c5aa0"); this.rect(c, ox - 4, oy + 8, 10, 14, "#2c5aa0");
      c.font = "900 42px 'Trebuchet MS', sans-serif"; c.textAlign = "center"; c.fillStyle = "#fde047";
      c.fillText("Day " + (1 + Math.min(3, Math.floor(u * 4))) + " …", 480, 90);
    } else {
      // ---------- A pod lands on the Moon ----------
      const u = Math.min(1, (t - 50.8) / 5.2);
      this.rect(c, 0, 400, W, 140, "#8b8e99"); this.rect(c, 0, 400, W, 4, "#b8bbc6");
      for (let i = 0; i < 20; i++) this.rect(c, (i * 83) % W, 410 + (i * 29) % 120, 3, 2, "#6b6e79");
      this.disc(c, 760, 120, 46, "#1d4ed8"); this.disc(c, 770, 112, 22, "rgba(34,160,90,0.8)");
      const py = 120 + u * u * 260;
      this.poly(c, [[430, py + 50], [450, py], [510, py], [530, py + 50]], "#e9eef7"); this.rect(c, 428, py + 50, 104, 22, "#cbd5e1");
      this.rect(c, 462, py + 8, 36, 20, "#1e3a8a");
      this.rect(c, 420, py + 72, 8, 14, "#94a3b8"); this.rect(c, 532, py + 72, 8, 14, "#94a3b8");
      if (u < 0.97) this.flame(c, 480, py + 72, 70 * (1 - u * 0.4), 18, t);
      if (u > 0.9) for (let i = 0; i < 18; i++) this.disc(c, 480 + (i - 9) * 22, 424, 10 + (u - 0.9) * 90, "rgba(200,200,210,0.3)");
    }

    // fade in / out
    const fi = Math.min(1, t / 1.0), fo = Math.min(1, (this.total - t) / 1.2);
    c.fillStyle = "rgba(0,0,0," + (1 - Math.min(fi, fo)).toFixed(2) + ")"; c.fillRect(0, 0, W, H);
  }
};
