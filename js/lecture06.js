/* ============================================================
   lecture06.js — labs for Second-Order Circuits (Natural Response)
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

  function fmtCoef(x) {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 100000 || a < 0.001) return x.toExponential(2);
    if (a >= 100) return String(Math.round(x * 10) / 10);
    return String(Math.round(x * 10000) / 10000);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmtRoots(r) {
    if (!r.length) return "—";
    if (r.length === 1) return fmtCoef(r[0].re) + " (double)";
    var a = r[0], b = r[1];
    if (Math.abs(a.re - b.re) < 1e-9 && Math.abs(a.im + b.im) < 1e-9 && Math.abs(a.im) > 1e-9)
      return fmtCoef(a.re) + " ± " + fmtCoef(Math.abs(a.im)) + "j";
    return fmtCoef(a.re) + " , " + fmtCoef(b.re);
  }

  /* Core closed-form solver for the natural response of series / parallel RLC.
     kind  "series"   → quantity is loop current i(t), α = R/2L
     kind  "parallel" → quantity is node voltage v(t), α = 1/(2RC)
     X0    value of the quantity at t = 0+
     dX0   its derivative at t = 0+
  */
  function solveRLC(kind, R, L, C, X0, dX0) {
    var alpha = kind === "series" ? R / (2 * L) : 1 / (2 * R * C);
    var w0 = 1 / Math.sqrt(L * C);
    var disc = alpha * alpha - w0 * w0;
    var out = { alpha: alpha, w0: w0, wd: 0, regime: "", roots: [], fn: null,
                tmax: 1e-3, A1: 0, A2: 0, B1: 0, B2: 0, envelope: null };
    var TOL = 1e-12 * (alpha * alpha + w0 * w0);
    if (disc > TOL) {
      var b = Math.sqrt(disc);
      var s1 = -alpha + b, s2 = -alpha - b;
      out.regime = "overdamped";
      out.roots = [{ re: s1, im: 0 }, { re: s2, im: 0 }];
      out.A1 = (dX0 - s2 * X0) / (s1 - s2);
      out.A2 = (s1 * X0 - dX0) / (s1 - s2);
      out.fn = function (t) { return out.A1 * Math.exp(s1 * t) + out.A2 * Math.exp(s2 * t); };
      out.tmax = 5 / Math.min(Math.abs(s1), Math.abs(s2));
    } else if (disc > -TOL) {
      out.regime = "critically damped";
      out.roots = [{ re: -alpha, im: 0 }];
      out.A2 = X0;
      out.A1 = dX0 + alpha * X0;
      out.fn = function (t) { return (out.A1 * t + out.A2) * Math.exp(-alpha * t); };
      out.tmax = 8 / alpha;
    } else {
      var wd = Math.sqrt(-disc);
      out.regime = "underdamped";
      out.wd = wd;
      out.roots = [{ re: -alpha, im: wd }, { re: -alpha, im: -wd }];
      out.B1 = X0;
      out.B2 = (dX0 + alpha * X0) / wd;
      out.fn = function (t) {
        return Math.exp(-alpha * t) * (out.B1 * Math.cos(wd * t) + out.B2 * Math.sin(wd * t));
      };
      out.tmax = Math.max(4 * (2 * Math.PI / wd), 5 / alpha);
      out.envelope = function (t) {
        return Math.exp(-alpha * t) * Math.sqrt(out.B1 * out.B1 + out.B2 * out.B2);
      };
    }
    return out;
  }

  /* ---------- 1. Damping explorer (series RLC) ---------- */
  (function () {
    var cv = $("drTime"), pv = $("drPlane");
    if (!cv || !pv) return;
    var tFix = null, pFix = null;                       /* axes locked to the default case */
    var R = bindSlider("dr_R", "dr_Rv", function (x) { return x.toFixed(0) + " Ω"; });
    var L = bindSlider("dr_L", "dr_Lv", function (x) { return x.toFixed(0) + " mH"; });
    var C = bindSlider("dr_C", "dr_Cv", function (x) { return x.toFixed(0) + " nF"; });
    var V = bindSlider("dr_V", "dr_Vv", function (x) { return x.toFixed(0) + " V"; });
    var I = bindSlider("dr_I", "dr_Iv", function (x) { return x.toFixed(1) + " A"; });

    function draw() {
      var r = parseFloat(R.value);
      var l = parseFloat(L.value) * 1e-3;
      var c = parseFloat(C.value) * 1e-9;
      var V0 = parseFloat(V.value);
      var I0 = parseFloat(I.value);
      var dI0 = (V0 - r * I0) / l;              /* di(0+)/dt = v_L(0+)/L */
      var s = solveRLC("series", r, l, c, I0, dI0);

      $("dr_regime").textContent = cap(s.regime);
      $("dr_alpha").textContent = fmtCoef(s.alpha) + " Np/s";
      $("dr_omega0").textContent = fmtCoef(s.w0) + " rad/s";
      $("dr_omegad").textContent = s.wd ? fmtCoef(s.wd) + " rad/s" : "—";
      $("dr_roots").textContent = fmtRoots(s.roots);

      var series = [{ fn: s.fn, color: COL.blue, width: 2.6, label: "i(t)" }];
      if (s.envelope) {
        var env = s.envelope;
        series.push({ fn: env, color: COL.amber, width: 1.6, dash: [6, 4], label: "±e^{−αt}·B" });
        series.push({ fn: function (t) { return -env(t); }, color: COL.amber, width: 1.6, dash: [6, 4] });
      }
      var rr = Plot.draw(cv, {
        xMin: tFix ? tFix.xMin : 0,
        xMax: tFix ? tFix.xMax : s.tmax,
        yMin: tFix ? tFix.yMin : undefined,
        yMax: tFix ? tFix.yMax : undefined,
        series: series,
        xLabel: "t (s)", yLabel: "i (A)"
      });
      if (!tFix) tFix = rr;

      /* s-plane: roots against the ω₀ circle and the −α line */
      if (!pFix) pFix = 1.35 * Math.max(s.w0, s.alpha);
      var m = pFix;
      var wo2 = s.w0 * s.w0;
      var circleTop = function (x) { var d = wo2 - x * x; return d >= 0 ? Math.sqrt(d) : NaN; };
      var circleBot = function (x) { var d = wo2 - x * x; return d >= 0 ? -Math.sqrt(d) : NaN; };
      var pts = s.roots.map(function (rt, i) {
        return { x: rt.re, y: rt.im, color: COL.blue, r: 5.5, label: "s" + (i + 1) };
      });
      Plot.draw(pv, {
        xMin: -m, xMax: 0.3 * m, yMin: -m, yMax: m,
        series: [
          { fn: circleTop, color: COL.violet, width: 1.6, dash: [5, 4], label: "circle r = ω₀" },
          { fn: circleBot, color: COL.violet, width: 1.6, dash: [5, 4] }
        ],
        vLines: [
          { x: 0, color: "#9aa7bd" },
          { x: -s.alpha, color: COL.amber, dash: [4, 4], label: "−α" }
        ],
        hLines: [{ y: 0, color: "#9aa7bd" }],
        points: pts,
        xLabel: "Re(s)", yLabel: "Im(s)"
      });
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 2. Worked-example solver (parallel RLC) ---------- */
  (function () {
    var cv = $("prTime");
    if (!cv) return;
    var tFix = null;                                    /* axes locked to the default case */
    var R = bindSlider("pr_R", "pr_Rv", function (x) { return x.toFixed(0) + " Ω"; });
    var L = bindSlider("pr_L", "pr_Lv", function (x) { return x.toFixed(0) + " mH"; });
    var C = bindSlider("pr_C", "pr_Cv", function (x) { return x.toFixed(0) + " nF"; });
    var V = bindSlider("pr_V", "pr_Vv", function (x) { return x.toFixed(0) + " V"; });
    var I = bindSlider("pr_I", "pr_Iv", function (x) { return x.toFixed(0) + " mA"; });

    function draw() {
      var r = parseFloat(R.value);
      var l = parseFloat(L.value) * 1e-3;
      var c = parseFloat(C.value) * 1e-9;
      var V0 = parseFloat(V.value);
      var I0 = parseFloat(I.value) * 1e-3;
      var dV0 = -(I0 + V0 / r) / c;             /* dv(0+)/dt = i_C(0+)/C */
      var s = solveRLC("parallel", r, l, c, V0, dV0);

      $("pr_regime").textContent = cap(s.regime);
      $("pr_aw").textContent = fmtCoef(s.alpha) + " Np/s · " + fmtCoef(s.w0) + " rad/s";
      $("pr_roots").textContent = fmtRoots(s.roots);
      if (s.regime === "underdamped") {
        $("pr_A1").textContent = fmtCoef(s.B1) + " (B₁)";
        $("pr_A2").textContent = fmtCoef(s.B2) + " (B₂)";
      } else {
        $("pr_A1").textContent = fmtCoef(s.A1) + " (A₁)";
        $("pr_A2").textContent = fmtCoef(s.A2) + " (A₂)";
      }

      var series = [{ fn: s.fn, color: COL.blue, width: 2.6, label: "v(t)" }];
      if (s.envelope) {
        var env = s.envelope;
        series.push({ fn: env, color: COL.amber, width: 1.6, dash: [6, 4], label: "±e^{−αt}·B" });
        series.push({ fn: function (t) { return -env(t); }, color: COL.amber, width: 1.6, dash: [6, 4] });
      }
      var rr = Plot.draw(cv, {
        xMin: tFix ? tFix.xMin : 0,
        xMax: tFix ? tFix.xMax : s.tmax,
        yMin: tFix ? tFix.yMin : undefined,
        yMax: tFix ? tFix.yMax : undefined,
        series: series,
        xLabel: "t (s)", yLabel: "v (V)"
      });
      if (!tFix) tFix = rr;
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 3. Undriven LC tank (energy juggle) ---------- */
  (function () {
    var c1 = $("lcVI"), c2 = $("lcEnergy");
    if (!c1 || !c2) return;
    var vFix = null, eFix = null;                       /* axes locked to the default case */
    var L = bindSlider("lc_L", "lc_Lv", function (x) { return x.toFixed(0) + " mH"; });
    var C = bindSlider("lc_C", "lc_Cv", function (x) { return x.toFixed(0) + " nF"; });
    var V = bindSlider("lc_V", "lc_Vv", function (x) { return x.toFixed(0) + " V"; });
    var I = bindSlider("lc_I", "lc_Iv", function (x) { return x.toFixed(1) + " A"; });

    function draw() {
      var l = parseFloat(L.value) * 1e-3;
      var c = parseFloat(C.value) * 1e-9;
      var V0 = parseFloat(V.value);
      var I0 = parseFloat(I.value);
      var Z = Math.sqrt(l / c);                 /* characteristic impedance √(L/C) */
      var w0 = 1 / Math.sqrt(l * c);
      var T = 2 * Math.PI / w0;
      var W = 0.5 * c * V0 * V0 + 0.5 * l * I0 * I0;

      var vC = function (t) { return V0 * Math.cos(w0 * t) - Z * I0 * Math.sin(w0 * t); };
      var iL = function (t) { return I0 * Math.cos(w0 * t) + (V0 / Z) * Math.sin(w0 * t); };

      $("lc_w").textContent = fmtCoef(w0) + " rad/s";
      $("lc_T").textContent = fmtCoef(T) + " s";
      $("lc_W").textContent = W.toExponential(2) + " J";

      var rv = Plot.draw(c1, {
        xMin: vFix ? vFix.xMin : 0,
        xMax: vFix ? vFix.xMax : 2 * T,
        yMin: vFix ? vFix.yMin : undefined,
        yMax: vFix ? vFix.yMax : undefined,
        series: [
          { fn: vC, color: COL.blue, width: 2.4, label: "v_C(t)" },
          { fn: function (t) { return Z * iL(t); }, color: COL.amber, width: 2, label: "i_L(t)·Z₀" }
        ],
        xLabel: "t (s)", yLabel: "volts"
      });
      if (!vFix) vFix = rv;

      var re2 = Plot.draw(c2, {
        xMin: eFix ? eFix.xMin : 0,
        xMax: eFix ? eFix.xMax : 2 * T,
        yMin: eFix ? eFix.yMin : undefined,
        yMax: eFix ? eFix.yMax : undefined,
        series: [
          { fn: function (t) { return 0.5 * c * vC(t) * vC(t); },
            color: COL.blue, width: 2.2, fill: "to0", label: "w_C = ½Cv²" },
          { fn: function (t) { return 0.5 * l * iL(t) * iL(t); },
            color: COL.green, width: 2.2, fill: "to0", label: "w_L = ½Li²" }
        ],
        hLines: W > 0 ? [{ y: W, color: COL.amber, dash: [4, 4], label: "W total (constant)" }] : [],
        xLabel: "t (s)", yLabel: "w (J)"
      });
      if (!eFix) eFix = re2;
    }
    redrows.push(draw);
    draw();
  })();

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

  /* ---- S13 · lc: undriven LC tank — energy juggling ---- */
  (function () {
    var root = $("sim-lc");
    if (!root) return;
    CS.mount(root, {
      id: "lc", icon: "♾️",
      title: "Live circuit · the undriven LC tank",
      sub: "No source, no resistor — the energy juggles between the two fields, forever.",
      note: "v_C and i_L are both sinusoids at ω₀ = 1/√(LC), 90° apart. Watch w_C and w_L: one rises as the other falls while the total stays flat (a real integrator loses a hair per cycle — a real tank would too, eventually). Change L or C and ω₀ follows 1/√(LC). Press ↺ to recharge the tank.",
      w: 720, h: 340, dt: 1e-6, spf: 8, flow: 4000, speed0: 2,
      init: function (c) { return { C: { C: c.V0 } }; },
      controls: [
        { type: "range", id: "V0", label: "Initial v_C = V₀", min: 1, max: 20, step: 1, value: 10, fmt: fV },
        { type: "range", id: "L", label: "Inductance L", min: 1, max: 100, step: 1, value: 5, fmt: function (x) { return x.toFixed(0) + " mH"; } },
        { type: "range", id: "C", label: "Capacitance C", min: 1, max: 100, step: 1, value: 10, fmt: function (x) { return x.toFixed(0) + " µF"; } }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 },
            { id: "L", type: "L", a: "a", b: "g", l: c.L * 1e-3 }
          ],
          wires: [
            HW(TOP, 300, 480, "L"),
            VW(300, TOP, 163, "C"), VW(300, 181, BOT, "C"),
            VW(480, TOP, 150, "L"), VW(480, 194, BOT, "L"),
            HW(BOT, 300, 480, "L")
          ],
          comps: [
            { type: "C", id: "C", x: 300, y: 172, o: "v", label: "C", ls: c.C.toFixed(0) + " µF", lx: 228, ly: 166 },
            { type: "L", id: "L", x: 480, y: 172, o: "v", label: "L", ls: c.L.toFixed(0) + " mH", lx: 556, ly: 166 }
          ],
          gnds: [[390, BOT]],
          probes: [
            { x: 300, y: 238, label: "v_C", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
            { x: 480, y: 238, label: "i_L", get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "vc", label: "v_C (live)", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
        { id: "il", label: "i_L (live)", get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } },
        { id: "wc", label: "w_C = ½Cv²", hl: true, get: function (s) { return CS.fmtSI(0.5 * (s.ctrl.C * 1e-6) * (s.V.a || 0) * (s.V.a || 0), "J"); } },
        { id: "wl", label: "w_L = ½Li²", hl: true, get: function (s) { var i = (s.branches.L || {}).i || 0; return CS.fmtSI(0.5 * (s.ctrl.L * 1e-3) * i * i, "J"); } },
        { id: "w", label: "w total (≈ const)", get: function (s) {
            var vc = s.V.a || 0, i = (s.branches.L || {}).i || 0;
            return CS.fmtSI(0.5 * (s.ctrl.C * 1e-6) * vc * vc + 0.5 * (s.ctrl.L * 1e-3) * i * i, "J"); } },
        { id: "f0", label: "f₀ = 1/2π√(LC)", get: function (s, c) { return CS.fmtSI(1 / (2 * Math.PI * Math.sqrt(c.L * 1e-3 * c.C * 1e-6)), "Hz"); } }
      ]
    });
  })();

  /* ---- S14 · types: series RLC — watch the regime flip ---- */
  (function () {
    var root = $("sim-rlc");
    if (!root) return;
    function alpha(c) { return c.R / (2 * c.L * 1e-3); }
    function w0(c) { return 1 / Math.sqrt(c.L * 1e-3 * c.C * 1e-6); }
    CS.mount(root, {
      id: "rlc", icon: "🎢",
      title: "Live circuit · series RLC — the three regimes in motion",
      sub: "One precharged capacitor, one loop: drag R and watch the response type change.",
      note: "The inequality α vs ω₀ picks the row of the table above: underdamped (α < ω₀) rings, critically damped (α = ω₀) returns to zero as fast as possible without ringing, overdamped (α > ω₀) creeps. The presets set R to ¼·Rc, Rc, 3·Rc with Rc = 2√(L/C). Press ↺ to re-charge and re-watch.",
      w: 720, h: 340, dt: 1e-6, spf: 8, flow: 150, speed0: 2,
      init: function (c) { return { C: { C: c.V0 } }; },
      onChange: function (id, v, refs) {
        if (id !== "regime") return;
        var L = parseFloat(refs.inputs.L.value), C = parseFloat(refs.inputs.C.value);
        var Rc = 2 * Math.sqrt(L * 1e-3 / (C * 1e-6));
        var R = v === "under" ? 0.25 * Rc : v === "crit" ? Rc : 3 * Rc;
        refs.inputs.R.value = R;
        refs.vals.R.textContent = CS.fmtSI(R, "Ω");
      },
      controls: [
        { type: "seg", id: "regime", label: "Regime preset", value: "under",
          options: [{ v: "under", label: "Underdamped" }, { v: "crit", label: "Critical" }, { v: "over", label: "Overdamped" }] },
        { type: "range", id: "R", label: "Resistance R", min: 0, max: 500, step: 1, value: 10, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "L", label: "Inductance L", min: 0.5, max: 100, step: 0.5, value: 5, fmt: function (x) { return x.toFixed(1) + " mH"; } },
        { type: "range", id: "C", label: "Capacitance C", min: 1, max: 100, step: 1, value: 10, fmt: function (x) { return x.toFixed(0) + " µF"; } },
        { type: "range", id: "V0", label: "Initial v_C = V₀", min: 2, max: 20, step: 1, value: 10, fmt: fV }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 },
            { id: "R", type: "R", a: "a", b: "b", r: Math.max(c.R, 1e-6) },
            { id: "L", type: "L", a: "b", b: "g", l: c.L * 1e-3 }
          ],
          wires: [
            HW(TOP, 300, 408, "C"), HW(TOP, 452, 560, "C"),
            VW(300, TOP, 163, "C"), VW(300, 181, BOT, "C"),
            VW(560, TOP, 150, "L"), VW(560, 194, BOT, "L"),
            HW(BOT, 300, 560, "L")
          ],
          comps: [
            { type: "C", id: "C", x: 300, y: 172, o: "v", label: "C", ls: c.C.toFixed(0) + " µF", lx: 230, ly: 166 },
            { type: "R", id: "R", x: 430, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "L", id: "L", x: 560, y: 172, o: "v", label: "L", ls: c.L.toFixed(1) + " mH", lx: 634, ly: 166 }
          ],
          gnds: [[430, BOT]],
          probes: [
            { x: 300, y: 238, label: "v_C", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
            { x: 560, y: 238, label: "i_L", get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "a", label: "α = R/2L", get: function (s, c) { return alpha(c).toFixed(0) + " Np/s"; } },
        { id: "w0", label: "ω₀ = 1/√(LC)", get: function (s, c) { return w0(c).toFixed(0) + " rad/s"; } },
        { id: "reg", label: "regime", hl: true, get: function (s, c) {
            var d = alpha(c) * alpha(c) - w0(c) * w0(c);
            return d > 1e-6 ? "overdamped" : d < -1e-6 ? "underdamped" : "critical"; } },
        { id: "roots", label: "roots s₁, s₂", get: function (s, c) {
            var a = alpha(c), w = w0(c), d = a * a - w * w;
            if (d > 1e-6) {
              var r1 = -a + Math.sqrt(d), r2 = -a - Math.sqrt(d);
              return r1.toFixed(0) + ", " + r2.toFixed(0);
            }
            if (d < -1e-6) {
              return "−" + a.toFixed(0) + " ± j" + Math.sqrt(-d).toFixed(0);
            }
            return "−" + a.toFixed(0) + " (double)"; } },
        { id: "vc", label: "v_C (live)", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } }
      ]
    });
  })();

})();