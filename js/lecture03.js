/* ============================================================
   lecture03.js — transient labs for First-Order Circuits I
   ============================================================ */
(function () {
  "use strict";
  if (!window.Plot) return;

  var COL = { blue: "#2453d6", amber: "#d97706", green: "#15803d", violet: "#7c3aed" };
  var $ = function (id) { return document.getElementById(id); };
  var redrows = [];
  window.E133.onRedraw(function () { redrows.forEach(function (fn) { fn(); }); });

  function bindSlider(id, labelId, fmtFn) {
    var el = $(id), lab = $(labelId);
    function upd() { if (lab) lab.textContent = fmtFn(parseFloat(el.value)); }
    el.addEventListener("input", function () { upd(); drawAll(); });
    upd();
    return el;
  }
  function drawAll() { redrows.forEach(function (fn) { fn(); }); }

  function fmtTime(t) {
    if (t >= 1) return t.toFixed(2) + " s";
    if (t >= 1e-3) return (t * 1e3).toFixed(2) + " ms";
    return (t * 1e6).toFixed(1) + " µs";
  }

  /* Shared factory: a decaying or rising exponential with τ markers */
  function transientLab(cfg) {
    // cfg: { prefix, sliders: [{id,lab,fmt}], fn(t, params) -> y, params() -> {tau, extra},
    //        readouts() -> {id: text}, yLabel, xLabel, extraSeries?, hLines(params) -> [...],
    //        points(params) -> [...] }
    var cv = $(cfg.plotId);
    if (!cv) return;
    var fix = null;                       /* axes locked to the default case */
    var sliders = {};
    cfg.sliders.forEach(function (s) { sliders[s.id] = bindSlider(s.id, s.lab, s.fmt); });

    function params() {
      var p = {};
      cfg.sliders.forEach(function (s) { p[s.id] = parseFloat(sliders[s.id].value); });
      return p;
    }

    function tauLines(tau) {
      var out = [];
      for (var n = 1; n <= 5; n++) {
        out.push({ x: n * tau, color: COL.green, dash: [4, 4], label: n === 1 ? "τ" : "" });
      }
      return out;
    }

    function draw() {
      var p = params();
      var tau = cfg.tau(p);
      var y0 = cfg.yAt(p, 0);
      var yInf = cfg.yAt(p, Infinity);
      var xMax = 5 * tau;

      // readouts
      (cfg.readouts || []).forEach(function (r) {
        var el = $(r.id);
        if (el) el.textContent = r.fn(p);
      });

      var series = [{ fn: function (t) { return cfg.yAt(p, t); }, color: COL.blue, width: 2.6, fill: "to0" }];
      var hLines = cfg.hLines ? cfg.hLines(p) : [];
      var points = cfg.points ? cfg.points(p) : [];

      // mark the 36.8% level for decays
      if (cfg.mark368) {
        var yTau = cfg.yAt(p, tau);
        hLines.push({ y: yTau, color: COL.amber, dash: [3, 4], label: cfg.mark368Label || "" });
        points.push({ x: tau, y: yTau, color: COL.amber, r: 5 });
      }

      var c = {
        xMin: 0, xMax: xMax,
        series: series,
        xLabel: cfg.xLabel, yLabel: cfg.yLabel,
        vLines: tauLines(tau), hLines: hLines, points: points,
        legend: false
      };
      if (fix) { c.xMin = fix.xMin; c.xMax = fix.xMax; c.yMin = fix.yMin; c.yMax = fix.yMax; }
      var rr = Plot.draw(cv, c);
      if (!fix) fix = rr;
    }
    redrows.push(draw);
    draw();
  }

  /* ---------- Lab 1: source-free RC ---------- */
  transientLab({
    plotId: "rcPlot",
    xLabel: "t (s)", yLabel: "v (V)",
    sliders: [
      { id: "rcV0", lab: "rcV0v", fmt: function (x) { return x.toFixed(1) + " V"; } },
      { id: "rcR", lab: "rcRv", fmt: function (x) { return x >= 1000 ? (x / 1000).toFixed(1) + " kΩ" : x + " Ω"; } },
      { id: "rcC", lab: "rcCv", fmt: function (x) { return x * 1e6 >= 1000 ? (x * 1e6 / 1000).toFixed(1) + " mF" : (x * 1e6).toFixed(0) + " µF"; } }
    ],
    tau: function (p) { return p.rcR * p.rcC; },
    yAt: function (p, t) { return p.rcV0 * Math.exp(-t / (p.rcR * p.rcC)); },
    mark368: true, mark368Label: "v(τ) = 36.8% V₀",
    readouts: [
      { id: "rcTau", fn: function (p) { return fmtTime(p.rcR * p.rcC); } },
      { id: "rcVtau", fn: function (p) { return (p.rcV0 * Math.exp(-1)).toFixed(2) + " V"; } },
      { id: "rcW0", fn: function (p) { return (0.5 * p.rcC * p.rcV0 * p.rcV0).toPrecision(3) + " J"; } }
    ]
  });

  /* ---------- Lab 2: source-free RL ---------- */
  transientLab({
    plotId: "rlPlot",
    xLabel: "t (s)", yLabel: "i (A)",
    sliders: [
      { id: "rlI0", lab: "rlI0v", fmt: function (x) { return x.toFixed(1) + " A"; } },
      { id: "rlR", lab: "rlRv", fmt: function (x) { return x + " Ω"; } },
      { id: "rlL", lab: "rlLv", fmt: function (x) { return x.toFixed(1) + " H"; } }
    ],
    tau: function (p) { return p.rlL / p.rlR; },
    yAt: function (p, t) { return p.rlI0 * Math.exp(-p.rlR * t / p.rlL); },
    mark368: true, mark368Label: "i(τ) = 36.8% I₀",
    readouts: [
      { id: "rlTau", fn: function (p) { return fmtTime(p.rlL / p.rlR); } },
      { id: "rlItau", fn: function (p) { return (p.rlI0 * Math.exp(-1)).toFixed(2) + " A"; } },
      { id: "rlW0", fn: function (p) { return (0.5 * p.rlL * p.rlI0 * p.rlI0).toPrecision(3) + " J"; } }
    ]
  });

  /* ---------- Lab 3: RL step response ---------- */
  transientLab({
    plotId: "stPlot",
    xLabel: "t (s)", yLabel: "i (A)",
    sliders: [
      { id: "stV", lab: "stVv", fmt: function (x) { return x.toFixed(0) + " V"; } },
      { id: "stR", lab: "stRv", fmt: function (x) { return x + " Ω"; } },
      { id: "stL", lab: "stLv", fmt: function (x) { return x.toFixed(1) + " H"; } },
      { id: "stI0", lab: "stI0v", fmt: function (x) { return x.toFixed(1) + " A"; } }
    ],
    tau: function (p) { return p.stL / p.stR; },
    yAt: function (p, t) {
      var inf = p.stV / p.stR, tau = p.stL / p.stR;
      return t === Infinity ? inf : inf + (p.stI0 - inf) * Math.exp(-t / tau);
    },
    hLines: function (p) {
      return [{ y: p.stV / p.stR, color: COL.green, dash: [5, 4], label: "i(∞) = V/R" }];
    },
    points: function (p) {
      return [{ x: 0, y: p.stI0, color: COL.amber, r: 5.5, label: "i(0⁺)" }];
    },
    readouts: [
      { id: "stTau", fn: function (p) { return fmtTime(p.stL / p.stR); } },
      { id: "stInf", fn: function (p) { return (p.stV / p.stR).toFixed(2) + " A"; } },
      { id: "stItau", fn: function (p) {
          var inf = p.stV / p.stR, tau = p.stL / p.stR;
          return (inf + (p.stI0 - inf) * Math.exp(-1)).toFixed(2) + " A";
        } }
    ]
  });

})();

/* ============================================================
   Live circuit sims (Falstad-style) — powered by circsim.js
   ============================================================ */
(function () {
  "use strict";
  var CS = window.CircSim;
  if (!CS) return;
  var $ = function (id) { return document.getElementById(id); };
  var TOP = 76, BOT = 268;
  function HW(y, x1, x2, id) { return { pts: [[x1, y], [x2, y]], id: id }; }
  function VW(x, y1, y2, id) { return { pts: [[x, y1], [x, y2]], id: id }; }
  function fV(x) { return x.toFixed(1) + " V"; }

  /* ---- S6 · rc-free: source-free RC discharge ---- */
  (function () {
    var root = $("sim-rffree");
    if (!root) return;
    CS.mount(root, {
      id: "rffree", icon: "⏳",
      title: "Live circuit · source-free RC",
      sub: "Charge to V₀, then flip the switch: the capacitor bleeds its energy through R.",
      note: "v(t) = V₀·e^(−t/τ), τ = RC. Flip back and the same energy is handed back. All of ½CV₀² ends up as heat in R — the exponential is just the bookkeeping of that hand-off. The current dot reverses direction during discharge.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 8000, speed0: 2,
      controls: [
        { type: "seg", id: "pos", label: "Switch position", value: "chg", options: [{ v: "chg", label: "Charge to V₀" }, { v: "dis", label: "Discharge through R" }] },
        { type: "range", id: "V0", label: "Pre-charge V₀", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 100, max: 10000, step: 100, value: 1000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.1, max: 50, step: 0.5, value: 10, fmt: function (x) { return x.toFixed(1) + " µF"; } }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.V0 },
            { id: "sw1", type: "SW", a: "s", b: "n", closed: c.pos === "chg" },
            { id: "Rs", type: "R", a: "n", b: "a", r: c.R },
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 },
            { id: "sw2", type: "SW", a: "a", b: "m", closed: c.pos === "dis" },
            { id: "Rd", type: "R", a: "m", b: "g", r: c.R }
          ],
          wires: [
            VW(110, BOT, 192, "C"), VW(110, 52, TOP, "C"),
            HW(TOP, 110, 192, "Rs"), HW(TOP, 228, 298, "Rs"),
            HW(TOP, 342, 590, "Rs"),
            VW(470, TOP, 163, "C"), VW(470, 181, BOT, "C"),
            VW(590, TOP, 102, "Rd"), VW(590, 138, 202, "Rd"),
            VW(590, 246, BOT, "Rd"), HW(BOT, 110, 640, "C")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.V0), lx: 60, ly: 172 },
            { type: "SW", id: "sw1", x: 210, y: TOP, o: "h", closed: c.pos === "chg", label: "S", ly: 40 },
            { type: "R", id: "Rs", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "C", id: "C", x: 470, y: 172, o: "v", label: "C", ls: c.C.toFixed(1) + " µF", lx: 402, ly: 166 },
            { type: "SW", id: "sw2", x: 590, y: 120, o: "v", closed: c.pos === "dis", label: "S₂", lx: 660, ly: 112 },
            { type: "R", id: "Rd", x: 590, y: 224, o: "v", label: "R", ls: CS.fmtSI(c.R, "Ω"), lx: 660, ly: 218 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 470, y: 238, label: "v_C", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
            { x: 590, y: 172, label: "i", get: function (s) { return CS.fmtSI((s.branches.Rd || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "vc", label: "v_C (live)", hl: true, get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
        { id: "i", label: "i (decay)", get: function (s) { return CS.fmtSI((s.branches.Rd || {}).i || 0, "A"); } },
        { id: "tau", label: "τ = RC", get: function (s, c) { return CS.fmtSI(c.R * c.C * 1e-6, "s"); } },
        { id: "w", label: "w_C = ½Cv²", get: function (s) { return CS.fmtSI(0.5 * (s.ctrl.C * 1e-6) * (s.V.a || 0) * (s.V.a || 0), "J"); } }
      ]
    });
  })();

  /* ---- S7 · rl-free: source-free RL discharge ---- */
  (function () {
    var root = $("sim-rlfree");
    if (!root) return;
    CS.mount(root, {
      id: "rlfree", icon: "🌀",
      title: "Live circuit · source-free RL",
      sub: "Energize the coil, then cut the source: the inductor keeps its current going through R.",
      note: "Same shape, different element: RC decays its voltage, RL decays its current. i(t) = I₀·e^(−t/τ), τ = L/R. The inductor voltage is negative during decay (it “fights” to keep the current flowing — the same effect that makes relay snubbers necessary).",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 12000, speed0: 2,
      controls: [
        { type: "seg", id: "pos", label: "Switch position", value: "on", options: [{ v: "on", label: "Energize" }, { v: "off", label: "Cut source (R loop)" }] },
        { type: "range", id: "V", label: "Source V", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 100, max: 10000, step: 100, value: 1000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "L", label: "Inductance L", min: 1, max: 100, step: 1, value: 10, fmt: function (x) { return x.toFixed(0) + " mH"; } }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.V },
            { id: "sw1", type: "SW", a: "s", b: "n", closed: c.pos === "on" },
            { id: "Rs", type: "R", a: "n", b: "a", r: c.R },
            { id: "L", type: "L", a: "a", b: "g", l: c.L * 1e-3 },
            { id: "sw2", type: "SW", a: "a", b: "m", closed: c.pos === "off" },
            { id: "Rd", type: "R", a: "m", b: "g", r: c.R }
          ],
          wires: [
            VW(110, BOT, 192, "L"), VW(110, 52, TOP, "L"),
            HW(TOP, 110, 192, "Rs"), HW(TOP, 228, 298, "Rs"),
            HW(TOP, 342, 590, "Rs"),
            VW(470, TOP, 150, "L"), VW(470, 194, BOT, "L"),
            VW(590, TOP, 102, "Rd"), VW(590, 138, 202, "Rd"),
            VW(590, 246, BOT, "Rd"), HW(BOT, 110, 640, "L")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.V), lx: 60, ly: 172 },
            { type: "SW", id: "sw1", x: 210, y: TOP, o: "h", closed: c.pos === "on", label: "S", ly: 40 },
            { type: "R", id: "Rs", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "L", id: "L", x: 470, y: 172, o: "v", label: "L", ls: c.L.toFixed(0) + " mH", lx: 400, ly: 166 },
            { type: "SW", id: "sw2", x: 590, y: 120, o: "v", closed: c.pos === "off", label: "S₂", lx: 660, ly: 112 },
            { type: "R", id: "Rd", x: 590, y: 224, o: "v", label: "R", ls: CS.fmtSI(c.R, "Ω"), lx: 660, ly: 218 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 470, y: 238, label: "i_L", get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } },
            { x: 590, y: 172, label: "i (decay)", get: function (s) { return CS.fmtSI((s.branches.Rd || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "il", label: "i_L (live)", hl: true, get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } },
        { id: "vl", label: "v_L", get: function (s) { var b = s.branches.L; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } },
        { id: "tau", label: "τ = L/R", get: function (s, c) { return CS.fmtSI(c.L * 1e-3 / c.R, "s"); } },
        { id: "w", label: "w_L = ½Li²", get: function (s) { var i = (s.branches.L || {}).i || 0; return CS.fmtSI(0.5 * (s.ctrl.L * 1e-3) * i * i, "J"); } }
      ]
    });
  })();

  /* ---- S8 · rl-step: RL step response (forced + natural) ---- */
  (function () {
    var root = $("sim-rlstep");
    if (!root) return;
    CS.mount(root, {
      id: "rlstep", icon: "📈",
      title: "Live circuit · the RL step response",
      sub: "Switch closes at t = 0: i(t) = (V/R)(1 − e^(−t/τ)) — forced + natural, in motion.",
      note: "At t = τ the current has covered 63.2% of its swing to V/R; at 5τ it is in steady state (inductor = short). The dots show the natural + forced sum — watch them slow down as di/dt dies out.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 12000, speed0: 2,
      controls: [
        { type: "range", id: "V", label: "Source V", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 100, max: 10000, step: 100, value: 1000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "L", label: "Inductance L", min: 1, max: 100, step: 1, value: 10, fmt: function (x) { return x.toFixed(0) + " mH"; } },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.V },
            { id: "sw", type: "SW", a: "s", b: "n", closed: !!c.on },
            { id: "R", type: "R", a: "n", b: "a", r: c.R },
            { id: "L", type: "L", a: "a", b: "g", l: c.L * 1e-3 }
          ],
          wires: [
            VW(110, BOT, 192, "L"), VW(110, 52, TOP, "L"),
            HW(TOP, 110, 192, "L"), HW(TOP, 228, 298, "L"),
            HW(TOP, 342, 470, "L"), VW(470, TOP, 150, "L"),
            VW(470, 194, BOT, "L"), HW(BOT, 110, 620, "L")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.V), lx: 60, ly: 172 },
            { type: "SW", id: "sw", x: 210, y: TOP, o: "h", closed: !!c.on, label: "S", ly: 40 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "L", id: "L", x: 470, y: 172, o: "v", label: "L", ls: c.L.toFixed(0) + " mH", lx: 548, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 470, y: 238, label: "i_L", get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "il", label: "i_L (live)", hl: true, get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } },
        { id: "if", label: "i_f = V/R", get: function (s, c) { return CS.fmtSI(c.V / c.R, "A"); } },
        { id: "tau", label: "τ = L/R", get: function (s, c) { return CS.fmtSI(c.L * 1e-3 / c.R, "s"); } },
        { id: "pct", label: "% of swing", get: function (s, c) { return (100 * ((s.branches.L || {}).i || 0) / (c.V / c.R)).toFixed(1) + " %"; } }
      ]
    });
  })();

})();