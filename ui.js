// ui.js — everything that is NOT the game picture: meters, speech bubbles,
// the Earth computer, machine panels, discovery cards, day changes and the end screen.

const $ = (id) => document.getElementById(id);
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// -----------------------------------------------------------------------
// Sound (made with the browser's own beeper, so no sound files are needed)
// -----------------------------------------------------------------------
const Sound = {
  ctx: null, muted: false,
  start() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  beep(freq, dur, type, vol, delay) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), gain = this.ctx.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.05, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gain); gain.connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  play(name) {
    switch (name) {
      case "pickup":  this.beep(660, 0.08, "square", 0.05); this.beep(880, 0.1, "square", 0.05, 0.08); break;
      case "ding":    this.beep(988, 0.25, "sine", 0.08); break;
      case "reward":  [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.14, "triangle", 0.08, i * 0.09)); break;
      case "siren":   for (let i = 0; i < 6; i++) this.beep(i % 2 ? 520 : 760, 0.22, "sawtooth", 0.05, i * 0.24); break;
      case "blackout":[392, 330, 262, 196].forEach((f, i) => this.beep(f, 0.22, "triangle", 0.09, i * 0.18)); break;
      case "faint":   [440, 380, 330, 280, 220].forEach((f, i) => this.beep(f, 0.2, "sine", 0.08, i * 0.15)); break;
      case "flare":   this.beep(90, 0.8, "sawtooth", 0.07); break;
      case "bad":     this.beep(180, 0.2, "square", 0.05); break;
      case "wake":    [392, 523, 659].forEach((f, i) => this.beep(f, 0.3, "sine", 0.07, i * 0.2)); break;
    }
  }
};

// -----------------------------------------------------------------------
// The UI object
// -----------------------------------------------------------------------
// "2024-05-14" -> "May 14, 2024"
function prettyDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); if (!m) return s || "";
  return ["January","February","March","April","May","June","July","August","September","October","November","December"][+m[2] - 1] + " " + (+m[3]) + ", " + m[1];
}
const UI = {
  sayTimer: null, toastTimer: null,

  scale() { return $("stage").clientWidth / VIEW.w; },

  // True when a menu is open (the game pauses)
  modalOpen() {
    return ["panel", "terminal", "card", "help", "transition", "end", "title", "story", "film", "pause"].some((id) => !$(id).classList.contains("hidden"));
  },

  // ---- Bolt's speech bubble ----
  say(text, ms) {
    const el = $("bolt-say");
    el.textContent = text; el.classList.remove("hidden");
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => el.classList.add("hidden"), ms || 5500);
  },
  placeBolt(sx, sy) {
    const el = $("bolt-say"), k = this.scale();
    if (el.classList.contains("hidden")) return;
    const w = $("stage").clientWidth, x = Math.max(el.offsetWidth / 2 + 8, Math.min(w - el.offsetWidth / 2 - 8, sx * k));
    el.style.left = x + "px"; el.style.top = Math.max(el.offsetHeight + 8, (sy - 22) * k) + "px";
  },

  // ---- "Press E" prompt ----
  setPrompt(spot, sx, sy, qText) {
    const el = $("prompt");
    if (!spot && !qText) { el.classList.add("hidden"); return; }
    const k = this.scale();
    el.innerHTML = (spot ? "<kbd>E</kbd>" + spot.icon + " " + esc(spot.label) : "") + (spot && qText ? " &nbsp; " : "") + (qText ? "<kbd>Q</kbd>" + esc(qText) : "");
    el.style.left = sx * k + "px"; el.style.top = (sy - 20) * k + "px";
    el.classList.remove("hidden");
  },

  // ---- Big arrow that points at the current goal ----
  setArrow(sx, sy, label) {
    const el = $("arrow");
    if (sx === null) { el.classList.add("hidden"); return; }
    const k = this.scale(), m = 30;
    el.classList.remove("hidden");
    const ar = el.querySelector(".ar"), al = el.querySelector(".al");
    al.textContent = label || "";
    al.style.display = label ? "inline-block" : "none";
    if (sx > m && sx < VIEW.w - m && sy > m + 30 && sy < VIEW.h - m) {
      ar.textContent = "▼"; el.classList.add("bounce"); el.classList.remove("edge");
      ar.style.transform = "";
      el.style.left = sx * k + "px"; el.style.top = (sy - 30) * k + "px";
    } else {
      const cx = VIEW.w / 2, cy = VIEW.h / 2, dx = sx - cx, dy = sy - cy;
      const f = Math.min((VIEW.w / 2 - m - 10) / Math.abs(dx || 0.001), (VIEW.h / 2 - m - 18) / Math.abs(dy || 0.001));
      ar.textContent = "➤"; el.classList.remove("bounce"); el.classList.add("edge");
      ar.style.transform = "rotate(" + Math.atan2(dy, dx) + "rad)";
      el.style.left = (cx + dx * f) * k + "px"; el.style.top = (cy + dy * f) * k + "px";
    }
  },

  toast(text) {
    const el = $("toast");
    el.classList.add("hidden"); void el.offsetWidth;
    el.textContent = text; el.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add("hidden"), 1700);
  },

  // ---- HUD ----
  gauge(id, pct, invert) {
    const el = $(id);
    el.querySelector("i").style.width = Math.max(0, Math.min(100, pct)) + "%";
    const gv = el.querySelector(".gv");
    if (gv) gv.textContent = Math.round(pct);
    const bad = invert ? 100 - pct : pct;
    const want = bad < 22 ? "danger" : bad < 45 ? "warn" : "";
    if (want !== (el._lvl || "")) { el.classList.remove("warn", "danger"); if (want) el.classList.add(want); el._lvl = want; }
  },

  updateHud(g) {
    const h = g.min / 60;
    const sunIcon = h < 18 ? "☀️" : h < 20 ? "🌇" : "🌙";
    $("clock").textContent = sunIcon + " Day " + (g.endless ? g.day : Math.min(g.day, g.days) + "/" + g.days) + " · " + clockText(g.min);
    const p = g.player;
    this.gauge("g-energy", p.energy);
    this.gauge("g-air", p.air);
    $("g-air").querySelector(".gi").textContent = g.planet === "mars" ? "📡" : "💨";
    $("g-air").title = g.planet === "mars" ? "Robot link: stay inside the base circle to stay connected" : "Air";
    $("g-rad").classList.toggle("hidden", p.rad < 2);
    this.gauge("g-rad", p.rad, true);
    this.gauge("g-battery", g.battery);
    $("g-battery").querySelector(".gi").textContent = g.blackout ? "🪫" : "🔋";
    if (g.blackout && !$("g-battery").classList.contains("danger")) { $("g-battery").classList.add("danger"); $("g-battery")._lvl = "danger"; }
    $("g-battery").querySelector(".gv").textContent = Math.round(g.battery) + "/100";
    const pr = powerReport(g);
    const pe = $("power-rate");
    pe.textContent = "☀️+" + pr.gain + "  🔌−" + pr.use + "  = " + (pr.net >= 0 ? "+" : "") + pr.net + "/min";
    pe.classList.toggle("good", pr.net >= 0); pe.classList.toggle("bad", pr.net < 0 && g.battery < 60);
    $("where").textContent = (G.planet === "mars" ? "🔴 " : "🌕 ") + REGIONS[regionAt(G.player.x, G.player.y)].name;

    const bag = [];
    if (p.ice) bag.push("❄️" + p.ice);
    if (p.rocks) bag.push("🪨" + p.rocks);
    if (p.metal) bag.push("🔩" + p.metal);
    if (p.crystal) bag.push("💎" + p.crystal);
    if (g.food) bag.push("🍎" + g.food);
    $("bag").textContent = "🎒 " + (bag.length ? bag.join(" ") : "–");
    $("rescues").textContent = "👽 ×" + Math.max(0, CONFIG.maxRescues - g.rescues);

    $("stars").textContent = "⭐ " + g.science;
    const mEl = $("missions");
    if (!g.missionsKnown) { mEl.classList.add("hidden"); }
    else {
      mEl.classList.remove("hidden");
      const short = { ice: "Get ice", study: "Study samples", rock: "Rocks", metal: "Metal", crystal: "Crystals", clean: "Clean panels", harvest: "Harvest food", explore: "Explore", flare: "Flare", send: "Launch research", assemble: "Build rover part", meet: "Find Sam" };
      mEl.innerHTML = '<div class="mtitle">📋 Daily missions <small>(your jobs for today)</small></div>' + g.missions.slice(0, CONFIG.maxActiveMissions).map((m) => {
        const cls = m.done ? "done" : "";
        const right = m.done ? '<b class="tick" title="Done! Call Earth 📡 to collect your reward">✔</b>' : (m.n > 1 ? m.count + "/" + m.n : "");
        const name = m.type === "explore" ? "Find: " + DISCOVERIES[m.loc].title : short[m.type];
        return '<div class="m ' + cls + '"><span>' + MISSION_ICONS[m.type] + " " + name + "</span><span>" + right + "</span></div>";
      }).join("");
    }
  },

  // ---- Mini map: only the place you are in now. It fills in as you explore ----
  drawMinimap(g, explored, player) {
    const cv = $("minimap"), c = cv.getContext("2d");
    const reg = regionAt(player.x, player.y), Rg = REGIONS[reg];
    const sc = Math.min(cv.width / Rg.w, cv.height / Rg.h), ox = (cv.width - Rg.w * sc) / 2, oy = (cv.height - Rg.h * sc) / 2;
    const mx = (x) => ox + (x - Rg.x) * sc, my = (y) => oy + (y - Rg.y) * sc;
    c.fillStyle = "#05060d"; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = "#14172a"; c.fillRect(ox, oy, Rg.w * sc, Rg.h * sc);
    const cs = explored.cell;
    for (let cy = Math.floor(Rg.y / cs); cy < Math.ceil((Rg.y + Rg.h) / cs); cy++) for (let cx = Math.floor(Rg.x / cs); cx < Math.ceil((Rg.x + Rg.w) / cs); cx++) {
      if (!explored.data[cy * explored.w + cx]) continue;
      if (regionAt(cx * cs + 1, cy * cs + 1) !== reg) continue;
      c.fillStyle = Rg.ground || "#8b8e99";
      c.fillRect(Math.floor(mx(cx * cs)), Math.floor(my(cy * cs)), Math.ceil(cs * sc) + 1, Math.ceil(cs * sc) + 1);
    }
    c.strokeStyle = "#3b4575"; c.lineWidth = 1; c.strokeRect(ox + 0.5, oy + 0.5, Rg.w * sc - 1, Rg.h * sc - 1);
    const dot = (x, y, col, r) => { c.fillStyle = col; c.beginPath(); c.arc(mx(x), my(y), r, 0, 6.3); c.fill(); };
    const seen = (x, y) => explored.data[Math.floor(y / cs) * explored.w + Math.floor(x / cs)];
    const inReg = (x, y) => regionAt(x, y) === reg;
    if (reg === "home") {
      dot(BASE.x, BASE.y, "#38bdf8", 4); dot(BAY.x + BAY.w / 2, BAY.y + BAY.h / 2, "#fbbf24", 2);
      [[ICE_CRATER, "#bfe9ff"], [ROCK_FIELD, "#b08968"]].forEach((o) => { if (seen(o[0].x, o[0].y)) dot(o[0].x, o[0].y, o[1], 3); });
      if (seen(1500, 1080)) dot(1500, 1080, "#a78bfa", 3);
      if (seen(1632, 640)) dot(1632, 640, "#60a5fa", 2.5);
      if (seen(1630, 880)) dot(1630, 880, "#ffffff", 2.5);
    } else if (reg === "cave") {
      dot(2700, 1450, "#fde68a", 3); if (seen(2900, 1300) || g.zorpMet) dot(2900, 1300, "#86efac", 3);
    } else {
      if (POLE_REGIONS.indexOf(reg) < 0) { const p = padOf(reg); dot(p.x, p.y, "#fbbf24", 3); }
      [[CRYSTAL_CRATER, "#c084fc"], [METAL_FIELD, "#cbd5e1"]].forEach((o) => { if (inReg(o[0].x, o[0].y) && seen(o[0].x, o[0].y)) dot(o[0].x, o[0].y, o[1], 3); });
      if (reg === "far" && seen(2960, 740)) dot(2960, 740, "#fb923c", 3.5);
    }
    DISCOVERY_SPOTS.forEach((d) => { if (g.discovered[d.id] && d.region === reg) dot(d.x, d.y, "#fde047", 1.8); });
    const blink = Math.floor(performance.now() / 300) % 2;
    dot(player.x, player.y, blink ? "#ffffff" : "#ef4444", 3);
  },

  showHud(on) { $("hud").classList.toggle("hidden", !on); },

  // ---- Machine panel ----
  openPanel(g, key, onPick) {
    const def = CONFIG.systems[key], s = g.systems[key];
    const names = key === "shield" ? ["OFF", "ON", "BOOST"] : ["OFF", "ON"];
    let status;
    if (g.blackout) status = "💡 No power right now!";
    else if (s.switching) status = "⏳ Changing to " + names[s.target] + "…";
    else status = "Now: <b>" + names[s.level] + "</b>";
    const btns = names.map((n, i) => {
      const cls = i === 0 ? "" : i === 2 ? "boost" : "on";
      const dis = g.blackout || s.switching || i === s.level;
      const glow = key === "shield" && i === 2 && needBoost(g) ? " guide" : "";   // a flare is coming: BOOST glows
      return '<button class="mbtn ' + cls + glow + (i === s.level ? " current" : "") + '" data-l="' + i + '"' + (dis ? " disabled" : "") + ">" +
        (i === 0 ? "⏻ OFF" : i === 1 ? "✅ ON" : "🚀 BOOST") +
        "<small>uses " + Math.round(def.draw[i] * CONFIG.powerUnit * 60) + "/min · " + def.switchSec + "s</small>" +
        (i !== s.level ? '<small class="' + (netAfter(g, key, i) >= 0 ? "good" : "bad") + '">net after: ' + (netAfter(g, key, i) >= 0 ? "+" : "") + netAfter(g, key, i) + "/min</small>" : "") + "</button>";
    }).join("");
    let extra = key === "shield" ? '<div class="mstate">BOOST blocks more radiation but uses more power.</div>' : "";
    if (key === "shield" && needBoost(g)) extra = '<div class="alertline">⚠️ A solar flare is coming! Pick BOOST now.</div>' + extra;
    if (key === "lab" || key === "greenhouse") extra = '<div class="mstate">💤 It turns itself OFF when it has nothing to do.</div>';
    if (key === "life") extra = g.planet === "mars" ? '<div class="mstate">The link station keeps your robot connected and charged while you stay inside the base circle. Out in the wild your link slowly fades.</div>' : '<div class="mstate">The air generator splits water into oxygen to breathe. No air = no life!</div>';
    const pr = powerReport(g);
    const powerInfo = '<div class="powerline">🔋 Battery <b>' + pr.battery + '/100</b> · sun gives <b>+' + pr.gain + '</b>/min · machines use <b>−' + pr.use + '</b>/min · net <b class="' + (pr.net >= 0 ? "good" : "bad") + '">' + (pr.net >= 0 ? "+" : "") + pr.net + '</b>/min</div>';
    $("panel").innerHTML = '<div class="win"><h2>' + def.icon + " " + def.name + '</h2><div class="mstate">' + status + "</div>" + powerInfo +
      '<div class="mbtns">' + btns + "</div>" + extra +
      '<div class="mstate">Changes take ' + def.switchSec + ' seconds. You can walk away!</div>' +
      '<button class="tbtn" id="panel-close" style="color:#fff;border-color:#6366f1;background:#232a55">Close</button></div>';
    $("panel").classList.remove("hidden");
    $("panel").querySelectorAll(".mbtn").forEach((b) => b.addEventListener("click", () => {
      const lvl = Number(b.dataset.l);
      this.closePanel();
      onPick(lvl);
    }));
    $("panel-close").addEventListener("click", () => this.closePanel());
  },
  closePanel() { $("panel").classList.add("hidden"); },

  // ---- Earth computer ----
  terminalTimer: null,

  // ctx = { onClose, onSend }.  Returns true if this was the first visit today.
  openTerminal(g, ctx) {
    const el = $("terminal");
    el.classList.remove("hidden");
    const close = () => { clearTimeout(this.terminalTimer); el.classList.add("hidden"); if (ctx.onClose) ctx.onClose(); };
    const header = '<h2><span>📡 MISSION CONTROL · EARTH LINK</span><span id="term-x" style="cursor:pointer">✖</span></h2>';

    // No power = no radio. The player has to fix the battery first.
    if (!commsOk(g)) {
      hint(g, "no_comms", 5);
      el.innerHTML = '<div class="win">' + header + '<div class="nosignal"><div class="big-x">📵</div>' +
        '<div class="row" style="font-size:1.3em"><b>NO SIGNAL</b></div>' +
        '<div class="row">💡 The base has no power, so the radio is off.</div>' +
        '<div class="row">🔋 Battery: <b>' + Math.round(g.battery) + '/' + CONFIG.minCommsBattery + '</b> needed to reconnect.</div>' +
        '<div class="row">Clean the solar panels 🧹 and wait for the battery to charge.</div></div>' +
        '<div class="tgrid"><button class="tbtn" id="nosig-ok" style="grid-column:1/3">OK</button></div></div>';
      $("term-x").addEventListener("click", close); $("nosig-ok").addEventListener("click", close);
      return false;
    }

    const firstToday = openComputer(g);
    const frame = (face, words, buttons) =>
      '<div class="win">' + header + '<div class="nova"><div class="face">' + face + '</div><div class="words">' + words + "</div></div>" + buttons + "</div>";
    const back = '<div class="tgrid"><button class="tbtn" data-go="home">⬅ Back</button></div>';

    // Which button should the player press next? That one glows and is bigger.
    const nextGuide = () => {
      if (firstToday || unclaimedCount(g) > 0) return "missions";
      if (researchReady(g)) return "research";
      if (forecast(g).length > 0 && !g.weatherChecked) return "weather";
      return null;
    };

    const home = (msg) => {
      const unclaimed = unclaimedCount(g);
      const fc = forecast(g).length > 0 && !g.weatherChecked;
      const guide = nextGuide();
      const b = (id, text, mark) => '<button class="tbtn' + (guide === id ? " guide" : "") + '" data-go="' + id + '">' + text + (mark && guide !== id ? " ❗" : "") + "</button>";
      const btns = '<div class="tgrid">' +
        b("missions", "📋 Missions", unclaimed) +
        b("research", "📦 Send research", researchReady(g)) +
        b("weather", "☀️ Space weather", fc) +
        b("help", "🔧 Base help", false) +
        '<button class="tbtn" data-go="call" style="grid-column:1/3">📡 Call home</button></div>';
      return frame("🧑‍🔬", msg || "<div class='row'>Hi Commander! I'm Dr. Nova. 👋</div><div class='row'>What do you need?</div>", btns);
    };

    const missionsView = () => {
      const rows = g.missions.map((m) => {
        const st = m.claimed ? "✅" : m.done ? "🎁" : "⬜";
        return "<div class='row'>" + st + " " + MISSION_ICONS[m.type] + " " + esc(missionText(m)) + (m.claimed || m.n <= 1 ? "" : " (" + m.count + "/" + m.n + ")") + "</div>";
      }).join("");
      const claims = g.missions.map((m, i) => m.done && !m.claimed ? '<button class="tbtn claim guide" data-claim="' + i + '">🎁 Report: ' + MISSION_ICONS[m.type] + " +" + CONFIG.missionScience + " ⭐</button>" : "").join("");
      const starNote = "<div class='src'>⭐ = science points. Earth gives you ⭐ for every mission. At the end of the game, " + CONFIG.star2 + " ⭐ earns ★★ and " + CONFIG.star3 + " ⭐ earns ★★★. You have " + g.science + " ⭐ now.</div>";
      return frame("🧑‍🔬", "<div class='row'><b>Your missions</b> (Earth gives you the next one when you finish)</div>" + rows + starNote,
        (claims ? '<div class="tgrid">' + claims + "</div>" : "") + back);
    };

    const researchView = () => {
      const R = g.rover, C = CONFIG.rover;
      const need = C.samplesPerPackage;
      const pct = Math.min(100, Math.round(100 * g.studied / need));
      const ready = researchReady(g);
      let msg;
      if (R.sent >= C.partsNeeded) msg = "<div class='row'>🎉 All rover parts are on their way or built!</div>";
      else msg = "<div class='row'>Study samples in the lab 🔬. Every " + need + " studied samples make a research package. Take it to the 🚀 LAUNCHER next to the base to send it to Earth. We build a rover part for each package!</div>";
      const parts = [];
      for (let i = 0; i < C.partsNeeded; i++) parts.push(i < R.assembled ? "✅" : i < R.delivered ? "📦" : i < R.sent ? "🚀" : "⬜");
      const body = msg +
        "<div class='row'>🔬 Studied samples: <b>" + g.studied + "/" + need + "</b></div>" +
        "<div class='progress-row'><div class='bar-big'><i style='width:" + pct + "%'></i></div></div>" +
        "<div class='row'>🚙 Rover parts: " + parts.join(" ") + "</div>" +
        "<div class='src'>✅ built · 📦 waiting at the bay · 🚀 on the way · ⬜ not sent</div>";
      const note = ready ? "<div class='row'><b>📦 Your package is ready! Walk to the 🚀 Launcher (right of the base) and press E.</b></div>" : "";
      return frame("🧑‍🔬", body + note, back);
    };

    const weatherView = () => {
      g.weatherChecked = true;
      const fc = forecast(g);
      let words;
      if (fc.length === 0) {
        words = "<div class='row'>☀️ The Sun looks calm right now.</div><div class='row'>But flares can surprise us! Keep your shield ON.</div>";
      } else {
        words = fc.map((f) => {
          const when = f.day === g.day ? "TODAY" : "TOMORROW";
          return "<div class='row'>⚠️ <b>" + when + " about " + clockText(f.startMin) + "</b>: a class <b>" + esc(f.classType) + "</b> solar flare!</div>" +
            "<div class='row'>" + (f.typical || !f.date ? "A typical flare of this size. NASA records many like it every year." : "It is like the real flare NASA recorded on <b>" + esc(prettyDate(f.date)) + "</b>.") + "</div>" +
            "<div class='src'>Source: NASA DONKI (" + (f.source === "live" ? "live data" : "archived record") + ")</div>";
        }).join("") + "<div class='row'>🛡️ Tip: BOOST the shield early. It takes " + CONFIG.systems.shield.switchSec + " s to change!</div>";
      }
      const letters = ["A", "B", "C", "M", "X"], cols = ["#86efac", "#bef264", "#fde047", "#fb923c", "#f87171"];
      const mark = fc.length ? flareLetter(fc[0].classType) : "";
      const scale = "<div class='scale'>" + letters.map((l, i) => (i ? "<i class='x10'>×10</i>" : "") + "<span style='background:" + cols[i] + ";height:" + (1 + i * 0.5) + "em;" + (l === mark ? "outline:2px solid #fff;" : "") + "'>" + l + "</span>").join("") + "</div>" +
        "<div class='x10note'>⚡ Each letter is <b>10× stronger</b> than the one before! An X flare is <b>10,000×</b> stronger than an A.</div>";
      return frame("🧑‍🔬", words + scale, back);
    };

    const helpView = () => {
      const lines = diagnose(g).map((l) => "<div class='row'>" + esc(l) + "</div>").join("");
      return frame("🧑‍🔬", "<div class='row'><b>I checked your base:</b></div>" + lines, back);
    };

    const callView = () => {
      const f = FACTS[Math.floor(Math.random() * FACTS.length)];
      return frame("🧑‍🔬", "<div class='row'>🎉 Everyone on Earth is cheering for you!</div><div class='row'>💡 Did you know?</div>" + Art.html(f.art, "small") + "<div class='row'>" + esc(f.text) + "</div><div class='src'>Source: " + esc(f.source) + "</div>", back);
    };

    const views = { home: () => home(), missions: missionsView, research: researchView, weather: weatherView, help: helpView, call: callView };

    const show = (html) => {
      el.innerHTML = html;
      Art.mount(el);
      $("term-x").addEventListener("click", close);
      el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
      el.querySelectorAll("[data-claim]").forEach((b) => b.addEventListener("click", () => {
        claimMission(g, Number(b.dataset.claim));
        Sound.play("reward"); UI.toast("+" + CONFIG.missionScience + " ⭐");
        show(missionsView());
      }));
      const send = $("send-pkg");
      if (send) send.addEventListener("click", () => {
        const r = sendResearch(g);
        if (r.ok) {
          Sound.play("reward");
          const n = g.rover.sent;
          show(frame("🧑‍🔬", "<div class='row'>📦 Got it! Great science!</div><div class='row'>We are building rover part <b>" + n + " of " + CONFIG.rover.partsNeeded + "</b>. It will land at your Rover Bay in about " + CONFIG.rover.deliverSec + " seconds. 🚀</div>" +
            "<div class='src'>Real missions send data to Earth too, so teams of scientists can study it.</div>", back));
        } else show(researchView());
      });
    };

    // Every request to Earth takes a moment: radio waves need time to travel!
    const go = (view) => {
      if (view === "home") { show(views.home()); return; }
      el.innerHTML = '<div class="win">' + header + '<div class="signal"><div class="ends"><span>🌍</span><span>' + (G.planet === "mars" ? "🔴" : "🌕") + '</span></div><div class="lane"><div class="dot"></div></div>' +
        '<div>📡 Sending to Earth…</div><div class="radio-note">' + (G.planet === "mars" ? "📻 On real Mars, radio takes about 13 minutes each way (between 5 and 20)! To save time, we made it instant." : "📻 Radio takes about 1.3 seconds each way!") + '</div></div>' +
        '<div class="tgrid"><button class="tbtn" id="skip">⏩ Skip</button></div></div>';
      $("term-x").addEventListener("click", close);
      const done = () => { clearTimeout(this.terminalTimer); show(views[view]()); };
      $("skip").addEventListener("click", done);
      this.terminalTimer = setTimeout(done, 2600);
    };

    const intro = firstToday
      ? "<div class='row'>Good morning, Commander! ☀️</div><div class='row'>Day " + g.day + ". I have missions for you! 📋</div>"
      : null;
    show(home(intro));
    return firstToday;
  },

  closeTerminal() { clearTimeout(this.terminalTimer); $("terminal").classList.add("hidden"); },

  // ---- Discovery card with a picture. Several pages if d.pages exists. E or click continues. ----
  // Buttons wait 1 second so nobody skips a message by accident
  lock(el, ms) {
    const bs = Array.from(el.querySelectorAll("button.big, button.cont")).filter((b) => !b.disabled);
    bs.forEach((b) => { b.disabled = true; b.classList.add("locked"); });
    setTimeout(() => bs.forEach((b) => { if (b.isConnected) { b.disabled = false; b.classList.remove("locked"); } }), ms || 1000);
  },

  // Real NASA photo or video laid over our drawing. If it cannot load, the drawing stays.
  media(root, p) {
    const holder = root.querySelector(".artwrap") || root.querySelector("canvas.art") || root.querySelector("canvas.earthcv");
    if (!holder || !holder.parentNode) return;
    const box = document.createElement("div"); box.className = "nasamedia hidden";
    holder.parentNode.insertBefore(box, holder.nextSibling);
    // Keep our drawing invisible while the real picture loads, so a different picture never flashes first
    holder.style.visibility = "hidden";
    let done = false;
    const show = () => { if (done) return; done = true; clearTimeout(tm); box.classList.remove("hidden"); holder.style.display = "none"; };
    const fail = () => { if (done) return; done = true; clearTimeout(tm); box.remove(); holder.style.visibility = ""; holder.style.display = ""; };
    const tm = setTimeout(fail, p.clip ? 9000 : 5000);
    if (p.clip) {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.loop = false; v.preload = "auto"; v.src = p.clip.url + "#t=" + p.clip.start + "," + p.clip.end;
      v.addEventListener("loadeddata", () => { show(); v.currentTime = p.clip.start; const pl = v.play(); if (pl && pl.catch) pl.catch(() => {}); });
      v.addEventListener("timeupdate", () => { if (v.currentTime >= p.clip.end) { v.currentTime = p.clip.start; v.play().catch(() => {}); } });
      if (p.clip.pos) v.style.objectPosition = p.clip.pos;       // look lower so the hammer and feather stay in view
      v.addEventListener("error", fail);
      box.appendChild(v);
      const c = document.createElement("div"); c.className = "mcap"; c.textContent = "NASA video · Apollo 15"; box.appendChild(c);
    } else if (p.photo || p.localPhoto) {
      const im = new Image(); im.alt = p.caption || "NASA photo";
      im.addEventListener("load", show);
      im.addEventListener("error", fail);
      if (p.localPhoto) im.className = "whole";
      if (p.zoom) { im.style.objectPosition = p.zoom.x + "% " + p.zoom.y + "%"; im.style.transformOrigin = p.zoom.x + "% " + p.zoom.y + "%"; im.style.transform = "scale(" + p.zoom.s + ")"; }
      im.src = p.localPhoto || ("https://images-assets.nasa.gov/image/" + p.photo + "/" + p.photo + "~medium.jpg");
      box.appendChild(im);
      const c = document.createElement("div"); c.className = "mcap"; c.textContent = p.caption || (p.localPhoto ? "NASA photo · Apollo 16, 1972" : "NASA photo"); box.appendChild(c);
      if (im.complete && im.naturalWidth) show();            // already loaded (preloaded): show at once
    }
  },

  // Download every picture in the background at game start, so pop-ups show the right photo straight away
  preload() {
    const seen = {}; this._pre = this._pre || [];
    const walk = (o, depth) => {
      if (!o || typeof o !== "object" || depth > 4) return;
      if (Array.isArray(o)) { o.forEach((x) => walk(x, depth + 1)); return; }
      const url = o.localPhoto || (o.photo ? "https://images-assets.nasa.gov/image/" + o.photo + "/" + o.photo + "~medium.jpg" : null);
      if (url && !seen[url]) { seen[url] = 1; const im = new Image(); im.src = url; this._pre.push(im); }
      Object.keys(o).forEach((k) => { if (typeof o[k] === "object") walk(o[k], depth + 1); });
    };
    [DISCOVERIES, MARS_DISCOVERIES, FACTS, MARS_FACTS, SLEEP_FACTS, LEARN_CARDS].forEach((x) => { try { walk(x, 0); } catch (e) {} });
  },

  showCard(d, onClose, opts) {
    opts = opts || {};
    const pages = d.pages || [{ art: d.art, title: d.title, text: d.text, source: d.source, clip: d.clip, photo: d.photo }];
    let i = 0;
    const draw = () => {
      const p = pages[i], last = i === pages.length - 1;
      cancelAnimationFrame(UI.earthTimer);
      if (p.earthView) {
        $("card").innerHTML = '<div class="win cardwin"><div class="kicker">' + esc(d.title) + "</div>" + UI.earthViewHtml() +
          '<button class="big" id="card-ok">' + (last ? "Continue ▶" : "Next ▶") + " <small>(E)</small></button>" +
          (pages.length > 1 ? '<div class="dots">' + pages.map((_, k) => (k === i ? "●" : "○")).join(" ") + "</div>" : "") + "</div>";
        $("card").classList.remove("hidden");
        UI.startEarthAnim();
        UI.lock($("card"), 1000);
        $("card-ok").addEventListener("click", () => { cancelAnimationFrame(UI.earthTimer); if (last) { $("card").classList.add("hidden"); onClose(); } else { i++; draw(); } });
        return;
      }
      $("card").innerHTML = '<div class="win cardwin">' + (p.art ? Art.html(p.art) : '<div class="card-icon">' + d.icon + "</div>") +
        (pages.length > 1 ? '<div class="kicker">' + esc(d.title) + "</div>" : "") + "<h2>" + esc(p.title || d.title) + "</h2>" +
        (opts.noPlus || i > 0 ? "" : '<div class="plus">⭐ Discovery! +' + CONFIG.discoveryScience + "</div>") +
        '<div class="card-text">' + esc(p.text) + '</div><div class="card-src">Source: ' + esc(p.source || d.source) + "</div>" +
        '<button class="big" id="card-ok">' + (last ? "Continue ▶" : "Next ▶") + " <small>(E)</small></button>" +
        (pages.length > 1 ? '<div class="dots">' + pages.map((_, k) => (k === i ? "●" : "○")).join(" ") + "</div>" : "") + "</div>";
      $("card").classList.remove("hidden");
      Art.mount($("card"));
      if (p.clip || p.photo || p.localPhoto) UI.media($("card"), p);
      UI.lock($("card"), 1000);
      $("card-ok").addEventListener("click", () => { if (last) { $("card").classList.add("hidden"); onClose(); } else { i++; draw(); } });
    };
    draw();
  },

  // ---- Dr. Nova explains a problem the first time it happens ----
  showCoach(id, onClose) {
    const c = COACH[id];
    if (!c) { onClose(); return; }
    $("card").innerHTML = '<div class="win cardwin coach">' + Art.html(c.art, "small") +
      '<div class="kicker">🧑‍🔬 Dr. Nova says</div><h2>' + c.icon + " " + esc(c.title) + "</h2>" +
      '<div class="coach-why">' + esc(c.why) + "</div>" +
      '<div class="coach-fix"><b>Try this:</b>' + c.fix.map((f) => "<div>" + esc(f) + "</div>").join("") + "</div>" +
      '<button class="big" id="card-ok">Got it! ▶ <small>(E)</small></button></div>';
    $("card").classList.remove("hidden");
    Art.mount($("card"));
    UI.lock($("card"), 1000);
    UI.highlight(c.hud);
    $("card-ok").addEventListener("click", () => { UI.highlight(null); $("card").classList.add("hidden"); onClose(); });
  },
  // Draw glowing rings above a pop-up around parts of the screen (like the battery), so the player can find what the card is talking about
  highlight(ids) {
    document.querySelectorAll(".hlring").forEach((r) => r.remove());
    document.querySelectorAll(".hl-still").forEach((e) => e.classList.remove("hl-still"));
    if (this._hlTimer) { clearInterval(this._hlTimer); this._hlTimer = null; }
    if (!ids) return;
    const stage = $("stage");
    const rings = [];
    ids.forEach((id) => {
      const el = $(id); if (!el) return;
      el.classList.remove("hidden");
      el.classList.add("hl-still");                         // stop the pulsing so the ring can sit exactly on it
      const ring = document.createElement("div"); ring.className = "hlring";
      ring.innerHTML = "<span>👉</span>";
      stage.appendChild(ring); rings.push({ el, ring });
    });
    const place = () => {
      const sr = stage.getBoundingClientRect();
      rings.forEach((o) => {
        const r = o.el.getBoundingClientRect();
        const L = Math.round(r.left - sr.left - 6), T = Math.round(r.top - sr.top - 6), W = Math.round(r.width + 12), H = Math.round(r.height + 12);
        const st = o.ring.style, key = L + "," + T + "," + W + "," + H;
        const flip = L < 70; if (o.flip !== flip) { o.flip = flip; o.ring.classList.toggle("flip", flip); o.ring.firstChild.textContent = flip ? "👈" : "👉"; }
        if (o.key === key) return;                          // only move when something really changed: no jitter
        o.key = key; st.left = L + "px"; st.top = T + "px"; st.width = W + "px"; st.height = H + "px";
      });
    };
    place();
    this._hlTimer = setInterval(place, 250);
  },

  // ---- A phone call from Earth about a solar flare ----
  showCall(flare, onClose) {
    const el = $("card"), letter = flareLetter(flare.classType);
    const tier = flareTier(flare.I != null ? flare.I : 0.5);
    const strength = { X: "the STRONGEST kind (X-class)", M: "a medium kind (M-class)", C: "a small kind (C-class)", other: "a small kind" }[letter] || "a flare";
    const tierText = { weak: "Weak: the shield will hardly be needed.", medium: "Medium: use at least ON.", strong: "Strong: use BOOST!" }[tier];
    const realLine = flare.typical ? "A typical " + esc(flare.classType) + " flare, like ones NASA records many times a year" : "Like the real flare NASA recorded on " + esc(prettyDate(flare.date));
    el.innerHTML = '<div class="win cardwin callwin"><div class="ring">📞</div><h2>Incoming call…</h2><div class="card-text">Dr. Nova from Earth is calling!</div>' +
      '<button class="big" id="card-ok">📞 Answer <small>(E)</small></button></div>';
    el.classList.remove("hidden");
    Sound.play("siren");
    UI.lock(el, 1000);
    $("card-ok").addEventListener("click", () => {
      el.innerHTML = '<div class="win cardwin coach">' + Art.html("radiation", "small") + '<div class="kicker">🧑‍🔬 Dr. Nova, live from Earth</div>' +
        "<h2>☀️ Solar flare coming!</h2>" +
        '<div class="coach-why">Our satellites spotted ' + strength + " flare, class <b>" + esc(flare.classType) + "</b>. It will hit " + (G.planet === "mars" ? "Mars" : "the Moon") + " around <b>" + clockText(flare.startMin) + "</b>. " + tierText + "</div>" +
        '<div class="coach-fix"><b>Do this now:</b><div>1. Stay inside the base bubble 🏠</div><div>2. Press E at the shield tower 🛡️ and pick <b>BOOST</b> (takes ' + CONFIG.systems.shield.switchSec + " seconds)</div><div>3. Wait inside until the flare is over</div></div>" +
        '<div class="card-src">' + realLine + " · Source: NASA DONKI (" + (flare.typical ? "typical event" : flare.source === "live" ? "live data" : "archived record") + ")</div>" +
        '<button class="big" id="card-ok">OK, I\'m on it! ▶ <small>(E)</small></button></div>';
      Art.mount(el);
      UI.lock(el, 1000);
      $("card-ok").addEventListener("click", () => { el.classList.add("hidden"); onClose(); });
    });
  },

  // ---- A simple choice (for example: "clean the panels before bed?") ----
  showChoice(o) {
    const el = $("card");
    el.innerHTML = '<div class="win cardwin coach">' + (o.art ? Art.html(o.art, "small") : "") + "<h2>" + o.icon + " " + esc(o.title) + "</h2>" +
      '<div class="coach-why">' + o.text + "</div>" +
      '<div class="choices">' + o.buttons.map((b, i) => '<button class="big ' + (b.cls || "") + '" data-i="' + i + '">' + b.label + "</button>").join("") + "</div></div>";
    el.classList.remove("hidden");
    Art.mount(el);
    UI.lock(el, 1000);
    el.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => { el.classList.add("hidden"); o.buttons[Number(b.dataset.i)].fn(); }));
  },

  // ---- Earth through the telescope ----
  earthTimer: null,
  // The telescope view: a spinning Earth (a tiny one from Mars) with a few facts
  earthViewHtml() {
    const mars = G.planet === "mars";
    return "<h2>🔭 Earth, seen from " + (mars ? "Mars" : "the Moon") + '</h2><canvas id="earthcv" class="earthcv" width="192" height="192"></canvas>' +
      (mars
        ? '<div class="card-text">That tiny blue dot is home! From Mars, Earth looks like a bright star. It has oceans 🌊, clouds ☁️ and land 🟩, and it spins once a day.</div><div class="card-text" style="font-size:0.95em">Earth is 55 to 400 million km away. Radio takes 5 to 20 minutes to reach it.</div>'
        : '<div class="card-text">That is home! Earth looks about 4 times wider than the Moon looks from Earth. It has oceans 🌊, clouds ☁️ and land 🟩. It spins once a day, so you can watch the continents slide by.</div><div class="card-text" style="font-size:0.95em">From this side of the Moon, Earth hangs in almost the same spot in the sky all the time. On the far side you can never see it!</div>') +
      '<div class="card-src">Source: NASA</div>';
  },
  startEarthAnim() {
    cancelAnimationFrame(this.earthTimer);
    const cv = $("earthcv"); if (!cv) return;
    const c = cv.getContext("2d"), mars = G.planet === "mars";
    const draw = (time) => {
      c.clearRect(0, 0, cv.width, cv.height);
      c.fillStyle = "#02030a"; c.fillRect(0, 0, cv.width, cv.height);
      if (mars) { for (let i = 0; i < 40; i++) { c.fillStyle = "rgba(255,255,255," + (0.25 + 0.2 * Math.sin(time / 600 + i)).toFixed(2) + ")"; c.fillRect((i * 53) % 192, (i * 97) % 192, 2, 2); } }
      Art.earthGlobe(c, cv.width / 2, cv.height / 2, mars ? 12 : cv.width / 2 - 8, time / 1000 * 0.35);
      this.earthTimer = requestAnimationFrame(draw);
    };
    this.earthTimer = requestAnimationFrame(draw);
  },
  showEarthView() {
    const el = $("card");
    el.innerHTML = '<div class="win cardwin">' + this.earthViewHtml() + '<button class="big" id="card-ok">Continue ▶ <small>(E)</small></button></div>';
    el.classList.remove("hidden");
    this.startEarthAnim();
    if (G.planet !== "mars") this.media(el, { photo: "as08-14-2383" });
    UI.lock(el, 1000);
    $("card-ok").addEventListener("click", () => { cancelAnimationFrame(this.earthTimer); el.classList.add("hidden"); });
  },

  // ---- The rover menu ----
  // opts = { onGo(dest), onHome() }
  openRover(g, opts, atHome) {
    const R = g.rover, C = CONFIG.rover;
    let body;
    const pr = powerReport(g);
    const tripInfo = '<div class="cost">Each trip: 🔋 −' + C.travelBattery + ' · ⏱️ about ' + C.travelMin + ' game minutes. Battery now <b>' + pr.battery + '</b> (needs ' + C.minBattery + '+).</div>';
    if (!R.built) {
      const parts = [];
      for (let i = 0; i < C.partsNeeded; i++) parts.push(i < R.assembled ? "✅" : i < R.delivered ? "📦" : i < R.sent ? "🚀" : "⬜");
      body = '<div class="mstate">🚙 The rover is not ready yet.</div><div class="mstate">Parts: ' + parts.join(" ") + '</div>' +
        '<div class="mstate">' + (partWaiting(g) ? "📦 A part is waiting here. Press the button to build it!" : "Study samples 🔬, then send research to Earth 🖥️ to get parts.") + "</div>";
      if (partWaiting(g)) body += '<button class="tbtn guide" id="rv-build" style="color:#fff;margin:0.4em 0">🔧 Build the part</button>';
    } else if (atHome) {
      body = '<div class="mstate">🚙 Where do you want to go?</div>' + tripInfo + '<div class="dests">' +
        DESTINATIONS.map((d) => {
          const craterLock = d.id === "crater" && !g.crystalUnlocked;
          const samLock = d.id === "far" && !mayMeetCrew(g);
          const powerLock = g.battery < C.minBattery || g.blackout;
          const locked = craterLock || samLock || powerLock;
          const need = g.missions.some((m) => !m.claimed && ((m.type === "explore" && ({ crater: "crystalcrater", landing: "alpha", south: "southpole", north: "northpole" }[d.id] === m.loc)) || (m.type === "meet" && d.id === "far") || (m.type === "crystal" && d.id === "crater") || (m.type === "metal" && d.id === "landing")));
          const why = powerLock ? "🔋 Battery too low! Needs " + C.minBattery + "% (now " + Math.round(g.battery) + "%)" : craterLock ? "Locked: meet Zorp in the cave first" : "Locked: find every place first (" + discoveredCount(g) + "/" + EXPLORE_ORDER.length + ")";
          return '<button class="dest' + (need ? " need" : "") + '" data-dest="' + d.id + '"' + (locked ? " disabled" : "") + '><span style="font-size:1.8em">' + (locked ? "🔒" : d.icon) + "</span><span>" + esc(d.name) + "<small>" + esc(locked ? why : d.note) + "</small></span>" + (need && !locked ? '<span class="warn" title="A mission needs this place">⭐❗</span>' : "") + "</button>";
        }).join("") + "</div>";
    } else {
      body = '<div class="mstate">🚙 Go back to the Home Base?</div><div class="cost">It takes about ' + C.travelMin + ' game minutes.</div><div class="dests"><button class="dest star" data-dest="home"><span style="font-size:1.8em">🏠</span><span>Home Base</span></button></div>';
    }
    $("panel").innerHTML = '<div class="win" style="min-width:24em">' + body +
      '<button class="tbtn" id="panel-close" style="color:#fff;border-color:#6366f1;background:#232a55;margin-top:0.3em">Close</button></div>';
    $("panel").classList.remove("hidden");
    $("panel-close").addEventListener("click", () => this.closePanel());
    const bb = $("rv-build");
    if (bb) bb.addEventListener("click", () => { this.closePanel(); opts.onBuild(); });
    $("panel").querySelectorAll("[data-dest]").forEach((b) => b.addEventListener("click", () => { this.closePanel(); opts.onGo(b.dataset.dest); }));
  },

  // ---- The launcher: send a research package up to Earth ----
  openLauncher(g, onLaunch) {
    const C = CONFIG.rover, ready = researchReady(g), pct = Math.min(100, Math.round(100 * g.studied / C.samplesPerPackage));
    let body;
    if (g.rover.sent >= C.partsNeeded) body = '<div class="mstate">🎉 All the research you need has been sent!</div>';
    else if (!commsOk(g)) body = '<div class="mstate">📵 No power, no signal. Fill up the battery first.</div>';
    else body = '<div class="mstate">Study ' + C.samplesPerPackage + " samples in the lab 🔬 to fill a package. Earth builds a rover part and sends it to the Rover Bay (about " + C.deliverSec + " seconds).</div>" +
      '<div class="row">🔬 Studied samples: <b>' + g.studied + "/" + C.samplesPerPackage + '</b></div><div class="progress-row"><div class="bar-big"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="mstate">Rover parts sent: <b>' + g.rover.sent + "/" + C.partsNeeded + "</b></div>" +
      '<button class="tbtn' + (ready && commsOk(g) ? " guide" : "") + '" id="launch-go"' + (ready && commsOk(g) ? "" : " disabled") + ' style="color:#fff;margin:0.4em 0;font-size:1.2em">🚀 Launch the package!</button>';
    $("panel").innerHTML = '<div class="win" style="min-width:24em"><h2>🚀 Research Launcher</h2>' + body +
      '<button class="tbtn" id="panel-close" style="color:#fff;border-color:#6366f1;background:#232a55;margin-top:0.3em">Close</button></div>';
    $("panel").classList.remove("hidden");
    $("panel-close").addEventListener("click", () => this.closePanel());
    const lg = $("launch-go");
    if (lg) lg.addEventListener("click", () => { this.closePanel(); onLaunch(); });
  },

  // ---- Keyboard: arrow keys move between buttons in any menu, E or Enter presses the glowing one ----
  topModal() {
    for (const id of ["card", "panel", "terminal", "help", "pause", "story", "transition", "end", "title"]) if (!$(id).classList.contains("hidden")) return $(id);
    return null;
  },
  focusables(el) { return Array.from(el.querySelectorAll("button")).filter((b) => !b.disabled && b.offsetParent !== null); },
  focusBest(el) {
    el = el || this.topModal(); if (!el) return;
    const list = this.focusables(el); if (!list.length) return;
    (el.querySelector("button.guide:not([disabled])") || list.find((b) => b.id !== "panel-close" && b.id !== "term-x") || list[0]).focus();
  },
  nav(dir) {
    const el = this.topModal(); if (!el) return false;
    const list = this.focusables(el); if (!list.length) return true;
    const cur = list.indexOf(document.activeElement);
    if (cur < 0) { this.focusBest(el); return true; }
    const r0 = list[cur].getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bs = 1e9;
    list.forEach((b, i) => {
      if (i === cur) return;
      const r = b.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      let score = null;
      if (dir === "left" && dx < -4) score = -dx + 2 * Math.abs(dy);
      else if (dir === "right" && dx > 4) score = dx + 2 * Math.abs(dy);
      else if (dir === "up" && dy < -4) score = -dy + 2 * Math.abs(dx);
      else if (dir === "down" && dy > 4) score = dy + 2 * Math.abs(dx);
      if (score !== null && score < bs) { bs = score; best = b; }
    });
    if (!best) best = list[(cur + (dir === "up" || dir === "left" ? list.length - 1 : 1)) % list.length];
    best.focus();
    return true;
  },
  // E / Enter: press the focused button (or the glowing one)
  activate() {
    const el = this.topModal(); if (!el) return false;
    const f = document.activeElement;
    if (f && el.contains(f) && f.tagName === "BUTTON" && !f.disabled) { f.click(); return true; }
    const list = this.focusables(el); if (!list.length) return true;
    const g = el.querySelector("button.guide:not([disabled])") || list.find((b) => b.id === "card-ok" || b.id === "st-ok" || b.id === "tr-ok");
    if (g) { g.click(); return true; }
    return true;
  },
  // Make sure a pop-up never needs scrolling: shrink its text and pictures a little until it all fits
  // Shrink pop-up text until nothing scrolls. Runs right away (before the screen is painted) so nothing jumps.
  fitModals() {
    const el = this.topModal(); if (!el || el.id === "terminal") return;
    const key = el.id + "|" + el.textContent.length + "|" + el.querySelectorAll("canvas,img,video").length + "|" + Math.round(el.clientHeight);
    if (el._fitKey === key) return;
    const boxes = el.matches(".screen") ? [el] : [];
    el.querySelectorAll(".win, .storybox, .cardwin").forEach((b) => boxes.push(b));
    boxes.forEach((b) => {
      let scale = 1; b.style.fontSize = "";
      let guard = 0;
      while (b.scrollHeight > b.clientHeight + 2 && scale > 0.5 && guard++ < 14) { scale -= 0.05; b.style.fontSize = scale.toFixed(2) + "em"; }
    });
    el._fitKey = key;
  },
  initFocus() {
    const refit = () => UI.fitModals();
    ["panel", "card", "story", "help", "end", "title"].forEach((id) => {
      const el0 = $(id);
      new MutationObserver((list) => { if (list.some((m) => m.type === "childList" && m.target === el0)) el0._fitKey = null; refit(); }).observe(el0, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    });
    ["panel", "terminal", "card", "help", "pause", "story", "transition", "end", "title"].forEach((id) => {
      const el = $(id);
      new MutationObserver(() => {
        if (el.classList.contains("hidden")) return;
        if (el.contains(document.activeElement) && document.activeElement.tagName === "BUTTON" && !document.activeElement.disabled) return;
        requestAnimationFrame(() => { if (!el.classList.contains("hidden") && el === UI.topModal()) UI.focusBest(el); });
      }).observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "class"] });
    });
  },

  // ---- Black fade when the rover drives ----
  fade(text, midCallback) {
    const el = $("fade");
    el.textContent = text || "";
    el.classList.remove("hidden");
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    setTimeout(() => { if (midCallback) midCallback(); }, 480);
    setTimeout(() => el.classList.add("hidden"), 1250);
  },

  // ---- Story / tutorial slides (picture, title, words). E or click goes on. ----
  showSlides(slides, done, lastLabel) {
    const el = $("story");
    el.classList.remove("hidden");
    let i = 0;
    const draw = () => {
      const s = slides[i];
      el.innerHTML = '<div class="storybox">' + (s.art ? Art.html(s.art) : '<div class="pic">' + s.pic + "</div>") +
        (s.title ? "<h2>" + esc(s.title) + "</h2>" : "") + '<div class="txt">' + esc(s.text) + "</div>" +
        '<button class="big" id="st-ok">' + (i === slides.length - 1 ? (lastLabel || "Start! ▶") : "Next ▶") + ' <small>(E)</small></button>' +
        '<div class="dots">' + slides.map((_, k) => (k === i ? "●" : "○")).join(" ") + "</div></div>";
      Art.mount(el);
      UI.lock(el, 1000);
      $("st-ok").addEventListener("click", () => { i++; if (i >= slides.length) { el.classList.add("hidden"); done(); } else draw(); });
    };
    draw();
  },
  showStory(done) { this.showSlides(STORY, done, "Next ▶"); },
  showTutorial(done) { this.showSlides(TUTORIAL, done, "Let's do it! ▶"); },

  // ---- Day change / fainting animation. Each screen waits for you: press E or click Continue. ----
  showTransition(s, g, done) {
    const el = $("transition");
    el.classList.remove("hidden");
    const faint = s.how === "faint";
    const why = { late: "You stayed up too late!", air: "You ran out of air!", radiation: "The radiation made you dizzy!" }[s.reason] || "";
    const left = Math.max(0, CONFIG.maxRescues - s.rescues);
    const fact = SLEEP_FACTS[(g.day + (faint ? 3 : 0) + g.seed) % SLEEP_FACTS.length];
    const cont = (label) => '<button class="big cont" id="tr-ok">' + (label || "Continue ▶") + ' <small>(E)</small></button>';
    // The "Did you know?" screen locks the button for 2 seconds so everyone really reads it
    const lockButton = (ms) => {
      const btn = $("tr-ok"); if (!btn) return;
      const full = btn.innerHTML; let left = ms;
      btn.disabled = true; btn.textContent = "Read… " + Math.ceil(left / 1000);
      const tick = () => {
        if (!btn.isConnected) return;
        left -= 100;
        if (left <= 0) { btn.disabled = false; btn.innerHTML = full; }
        else { btn.textContent = "Read… " + Math.ceil(left / 1000); setTimeout(tick, 100); }
      };
      setTimeout(tick, 100);
    };
    const phases = [];

    phases.push(() => {
      el.innerHTML = '<div class="sky"></div><div class="starfield"></div><div class="body">' +
        (faint ? '<div class="big-emoji">💫</div><h2>You fainted!</h2><div class="line">' + esc(why) + "</div>"
               : '<div class="big-emoji">🌙</div><h2>Good night…</h2><div class="line">💤 Zzz…</div>') + cont() + "</div>";
      Sound.play(faint ? "faint" : "ding");
    });
    if (faint) phases.push(() => {
      el.innerHTML = '<div class="sky"></div><div class="starfield"></div><div class="body"><div class="zorp">👽</div><h2>Zorp to the rescue!</h2>' +
        '<div class="line">An alien named Zorp saw you faint and carried you back to bed.</div>' +
        '<div class="line">👽 Zorp can help ' + left + " more time" + (left === 1 ? "" : "s") + ".</div>" + cont() + "</div>";
    });
    phases.push(() => {
      el.innerHTML = '<div class="sky"></div><div class="starfield"></div><div class="body"><h2>💡 Did you know?</h2>' + Art.html(fact.art, "small") +
        '<div class="fact-box">' + esc(fact.text) + '<div class="src">Source: ' + esc(fact.source) + '</div></div><div class="readbar"><i></i></div>' + cont() + "</div>";
      Art.mount(el);
      lockButton(2000);
    });
    phases.push(() => {
      const chips = [];
      if (s.batteryChange) chips.push('<span class="chip">🔋 ' + (s.batteryChange > 0 ? "+" : "") + s.batteryChange + " overnight</span>");
      if (s.blackout) chips.push('<span class="chip">💡 Power is out!</span>');
      if (s.gasped) chips.push('<span class="chip">😮‍💨 Woke up gasping: life support was off!</span>');
      if (s.dustAdded >= 10) chips.push('<span class="chip">🪥 Dust settled on the panels (' + s.dust + '% dirty). Clean them now!</span>');
      if (s.hungry) chips.push('<span class="chip">🍽️ Hungry: less energy today</span>');
      if (faint) chips.push('<span class="chip">⚡ Weak after fainting</span>');
      if (g.rover.delivered > g.rover.assembled) chips.push('<span class="chip">📦 A rover part is waiting at the bay</span>');
      el.innerHTML = '<div class="sky dawn"></div><div class="sun"></div><div class="body"><h2>' +
        (s.finished ? "🎉 The mission is over!" : '<span class="daybig">Day ' + s.newDay + "</span>") + "</h2>" +
        '<div class="chips">' + chips.join("") + "</div>" + cont(s.finished ? "See results ▶" : "Let's go ▶") + "</div>";
      requestAnimationFrame(() => { const sun = el.querySelector(".sun"); if (sun) sun.classList.add("up"); });
      Sound.play("wake");
    });

    let step = 0;
    const next = () => {
      if (step >= phases.length) { el.classList.add("hidden"); done(); return; }
      phases[step++]();
      if (!$("tr-ok").disabled) UI.lock(el, 1000);
      $("tr-ok").addEventListener("click", next);
    };
    next();
  },

  // ---- Title ----
  setDataStatus(text) { $("data-status").textContent = text; },

  // ---- End screen ----
  showEnd(g, handlers) {
    const won = g.status === "won";
    const stars = starRating(g);
    const lessons = buildLessons(g).map((t) => "<li>" + esc(t) + "</li>").join("");
    const flares = g.flaresSurvived.length
      ? g.flaresSurvived.map((f) => "<li>Day " + (f.def.day) + ": class " + esc(f.def.classType) + (f.def.typical ? " flare (a typical event, not a specific real date)" : " flare of " + esc(f.def.date) + " (" + (f.def.source === "live" ? "NASA live data" : "NASA archived record") + ")") + ". Your radiation peaked at " + f.maxRad + "%.</li>").join("")
      : "<li>No flares hit before the mission ended.</li>";
    const credits = CREDITS.map((c) => '<a href="' + c.url + '" target="_blank" rel="noopener" style="color:#7dd3fc">' + esc(c.name) + "</a>").join(" · ");
    const timeup = g.status === "timeup";
    const title = won ? "You found " + CREW_NAME + "!" : timeup ? "Time is up!" : "Earth calls you home";
    const sub = won
      ? "You built a rover from your own research, crossed " + (g.planet === "mars" ? "Mars" : "the Moon") + " and reunited with " + CREW_NAME + " on day " + Math.min(g.day, g.days) + "!"
      : timeup
        ? (g.rover.built ? "The rover was ready, but the mission ran out of days before you reached " + CREW_NAME + "." : "The mission ran out of days before the rover was built. Next time, send research to Earth sooner!")
        : "Zorp was too tired to carry you again, so Earth brought you home. Real missions learn from problems too!";
    $("end").innerHTML = '<div class="endbox"><div class="sub">' + (won ? "Great job, Commander" : timeup ? "Mission over" : "Mission ended early") + "</div><h1>" + title + "</h1>" +
      (stars > 0 ? '<div class="starline">' + "★".repeat(stars) + "☆".repeat(3 - stars) + "</div>" : "") +
      "<p>" + esc(sub) + "</p>" +
      '<div class="stats"><span class="chip">⭐ Science ' + g.science + '</span><span class="chip">🔬 Samples studied ' + g.stats.analyzed + '</span><span class="chip">🚙 Rover ' + (g.rover.built ? "built" : g.rover.assembled + "/" + CONFIG.rover.partsNeeded) + '</span><span class="chip">🍎 Food grown ' + g.stats.harvested + '</span><span class="chip">👽 Rescues ' + g.rescues + "</span></div>" +
      "<h3>What you learned</h3><ul>" + lessons + "</ul><h3>Space weather in your mission</h3><ul>" + flares + "</ul>" +
      '<h3>Game vs real life</h3><div class="learn" id="learn"></div>' +
      '<h3>Quick quiz</h3><div class="quiz" id="quiz"></div>' +
      '<div class="btn-col" style="margin:0.8em 0"><button class="big" id="end-new">▶ New mission</button><button class="big alt" id="end-same">↻ Try this mission again</button><button class="big ghost" id="end-menu">☰ Main menu</button></div>' +
      '<div style="font-size:0.7em;color:#94a3b8">Data and facts: ' + credits + ". Game numbers are simplified for learning; they are not NASA's radiation model.</div></div>";
    $("end").classList.remove("hidden");
    this.buildLearn(); this.buildQuiz(g.planet || "moon");
    $("end-new").addEventListener("click", () => { $("end").classList.add("hidden"); handlers.again(false); });
    $("end-same").addEventListener("click", () => { $("end").classList.add("hidden"); handlers.again(true); });
    $("end-menu").addEventListener("click", () => { $("end").classList.add("hidden"); handlers.menu(); });
  },

  // ---- End-of-mission learning: game versus real NASA ----
  buildLearn() {
    const el = $("learn"); let i = 0;
    const draw = () => {
      const c = LEARN_CARDS[i];
      el.innerHTML = '<div class="lc"><div class="lc-h">' + c.icon + " " + esc(c.title) + '</div><div class="lc-g"><b>In the game:</b> ' + esc(c.game) + '</div><div class="lc-r"><b>In real life:</b> ' + esc(c.real) + '</div><div class="card-src">Source: ' + esc(c.source) + '</div>' +
        '<div class="lc-n"><button class="tbtn" id="lc-prev">◀</button> ' + (i + 1) + "/" + LEARN_CARDS.length + ' <button class="tbtn" id="lc-next">▶</button></div></div>';
      $("lc-prev").addEventListener("click", () => { i = (i + LEARN_CARDS.length - 1) % LEARN_CARDS.length; draw(); });
      $("lc-next").addEventListener("click", () => { i = (i + 1) % LEARN_CARDS.length; draw(); });
    };
    draw();
  },
  buildQuiz(planet) {
    const el = $("quiz"), Q = quizFor(planet); let i = 0, score = 0;
    const draw = () => {
      if (i >= Q.length) { el.innerHTML = '<div class="qz-h">You got ' + score + " out of " + Q.length + "! " + (score === Q.length ? "🌟" : "👍") + "</div>"; return; }
      const q = Q[i];
      el.innerHTML = '<div class="qz-h">' + (i + 1) + ". " + esc(q.q) + '</div>' + q.options.map((o, k) => '<button class="tbtn qopt" data-k="' + k + '">' + esc(o) + "</button>").join("") + '<div class="qz-w"></div>';
      el.querySelectorAll(".qopt").forEach((b) => b.addEventListener("click", () => {
        const ok = Number(b.dataset.k) === q.answer; if (ok) score++;
        el.querySelectorAll(".qopt").forEach((x) => { x.disabled = true; if (Number(x.dataset.k) === q.answer) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        el.querySelector(".qz-w").innerHTML = (ok ? "✅ " : "❌ ") + esc(q.why) + ' <button class="tbtn" id="qz-next">Next ▶</button>';
        $("qz-next").addEventListener("click", () => { i++; draw(); });
      }));
    };
    draw();
  },

  // ---- Main menu helpers ----
  setPlanetButtons(p) {
    $("pl-moon").classList.toggle("on", p === "moon"); $("pl-mars").classList.toggle("on", p === "mars");
    $("title").classList.toggle("mars", p === "mars");
  },

  // ---- Pause menu (ESC) ----
  showPause(h) {
    const el = $("pause");
    el.innerHTML = '<div class="win"><h2>⏸ Paused</h2><div class="btn-col">' +
      '<button class="big guide" id="pa-resume">▶ Resume</button>' +
      '<button class="big alt" id="pa-restart">↻ Restart this mission</button>' +
      '<button class="big alt" id="pa-sound">' + (Sound.muted ? "🔇 Sound: off" : "🔊 Sound: on") + '</button>' +
      '<button class="big alt" id="pa-help">🎮 How to play</button>' +
      '<button class="big ghost" id="pa-menu">☰ Main menu</button></div></div>';
    el.classList.remove("hidden");
    const close = () => el.classList.add("hidden");
    $("pa-resume").addEventListener("click", () => { close(); h.resume(); });
    $("pa-restart").addEventListener("click", () => { close(); h.restart(); });
    $("pa-menu").addEventListener("click", () => { close(); h.menu(); });
    $("pa-help").addEventListener("click", () => { h.helpOpen(); });
    $("pa-sound").addEventListener("click", () => { Sound.muted = !Sound.muted; $("pa-sound").textContent = Sound.muted ? "🔇 Sound: off" : "🔊 Sound: on"; $("btn-sound").textContent = Sound.muted ? "🔇" : "🔊"; });
  }
};
