/* ============================================================
   lecture02.js — labs for Capacitors & Inductors
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

  /* ---------- 1. Capacitor energy lab ---------- */
  (function () {
    var cv = $("capE_plot");
    if (!cv) return;
    var C = bindSlider("capE_C", "capE_Cv", function (x) { return x.toFixed(1) + " F"; });
    var V = bindSlider("capE_V", "capE_Vv", function (x) { return x.toFixed(1) + " V"; });
    var fix = null;                       /* axes locked to the default case */

    function draw() {
      var c = parseFloat(C.value), v = parseFloat(V.value);
      $("capE_w").textContent = (0.5 * c * v * v).toFixed(2) + " J";
      $("capE_q").textContent = (c * v).toFixed(2) + " C";
      var cfg = {
        xMin: -12, xMax: 12,
        series: [
          { fn: function (x) { return 0.5 * c * x * x; }, color: COL.blue, width: 2.4, fill: "to0", label: "w(v) = ½Cv²" }
        ],
        points: [{ x: v, y: 0.5 * c * v * v, color: COL.amber, r: 6, label: "here", baseline: "bottom" }],
        xLabel: "v (V)", yLabel: "w (J)",
        vLines: v !== 0 ? [{ x: v, color: COL.amber, label: "" }] : []
      };
      if (fix) { cfg.xMin = fix.xMin; cfg.xMax = fix.xMax; cfg.yMin = fix.yMin; cfg.yMax = fix.yMax; }
      var rr = Plot.draw(cv, cfg);
      if (!fix) fix = rr;
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 2 & 4. Derivative labs (cap + ind) ---------- */
  function derivLab(opts) {
    var st = { wave: "dc" };
    var fix = null;                       /* axes locked per waveform (default sliders) */
    var waveBtns = Array.prototype.slice.call(document.querySelectorAll(opts.waveEl + " button"));
    waveBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        waveBtns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        st.wave = b.dataset.wave;
        fix = null;                       /* new waveform family: re-lock axes */
        draw();
      });
    });

    var K = bindSlider(opts.kEl, opts.kLabEl, function (x) { return x.toFixed(1) + " " + opts.kName; });
    var A = bindSlider(opts.ampEl, opts.ampLabEl, function (x) { return x.toFixed(1) + (opts.kind === "cap" ? " V" : " A"); });

    function sig(t) {
      var a = parseFloat(A.value);
      switch (st.wave) {
        case "dc":   return a;
        case "ramp": return (a / 4) * t;
        case "step": return t >= 0.5 ? a : 0;
        case "sin":  return a * Math.sin(2 * Math.PI * t);
      }
    }
    function dsig(t) {
      var a = parseFloat(A.value);
      switch (st.wave) {
        case "dc":   return 0;
        case "ramp": return a / 4;
        case "step": return null; // impulse at t=0.5
        case "sin":  return a * 2 * Math.PI * Math.cos(2 * Math.PI * t);
      }
    }

    function draw() {
      var cv = $(opts.plotEl);
      var k = parseFloat(K.value);
      var tMax = 4;
      var out = opts.kind === "cap" ? COL.amber : COL.violet;
      var inC = opts.kind === "cap" ? COL.blue : COL.amber;

      var iPk = 0, impulse = false, phase;
      if (st.wave === "sin") phase = "leads 90°";
      else if (st.wave === "ramp") phase = "constant";
      else if (st.wave === "dc") phase = "zero";
      else { phase = "impulse"; impulse = true; }

      for (var j = 0; j <= 400; j++) {
        var d = dsig(tMax * j / 400);
        if (d === null) continue;
        var val = k * d;
        if (Math.abs(val) > iPk) iPk = Math.abs(val);
      }
      $(opts.r0El).textContent = impulse ? "impulse" : (k * dsig(0.0001)).toFixed(2) + (opts.kind === "cap" ? " A" : " V");
      $(opts.rPkEl).textContent = impulse ? "∞ (ideal)" : iPk.toFixed(2);
      $(opts.rPhEl).textContent = phase;

      var notes = {
        cap: {
          dc: "Constant v ⇒ dv/dt = 0 ⇒ i = 0: the capacitor is an OPEN circuit under DC.",
          ramp: "Constant slope m = A/4 ⇒ constant current i = C·m. Drag C and A — the current tracks C·slope.",
          step: "Instant Δv means infinite dv/dt: i becomes an impulse of area C·Δv (dashed marker).",
          sin: "i = C·Aω·cos(ωt): a cosine that LEADS the sine voltage by 90°. Bigger C or ω ⇒ bigger i."
        },
        ind: {
          dc: "Constant i ⇒ di/dt = 0 ⇒ v = 0: the inductor is a SHORT circuit under DC.",
          ramp: "Constant slope m = A/4 ⇒ constant voltage v = L·m. Drag L and A — the voltage tracks L·slope.",
          step: "Instant Δi means infinite di/dt: v becomes an impulse of area L·Δi (dashed marker).",
          sin: "v = L·Aω·cos(ωt): a cosine that LEADS the sine current by 90°. Bigger L or ω ⇒ bigger v."
        }
      };
      $(opts.noteEl).textContent = notes[opts.kind][st.wave];

      var series = [{ fn: sig, color: inC, width: 2.4, label: opts.yIn + "(t)" }];
      if (!impulse) {
        series.push({ fn: function (t) { return k * dsig(t); }, color: out, width: 2.2, label: opts.yOut + "(t)" });
      }
      var vLines = [], points = [];
      if (impulse) {
        vLines.push({ x: 0.5, color: out, dash: [4, 4], label: "impulse" });
        var aNow = parseFloat(A.value);
        points.push({ x: 0.5, y: aNow * 0.45, color: out, r: 5,
          label: "area = " + opts.kName + "·" + (opts.kind === "cap" ? "Δv" : "Δi") });
      }
      var cfg = {
        xMin: 0, xMax: tMax,
        series: series,
        xLabel: "t (s)", yLabel: opts.yIn + " / " + opts.yOut,
        vLines: vLines, points: points
      };
      if (fix) { cfg.xMin = fix.xMin; cfg.xMax = fix.xMax; cfg.yMin = fix.yMin; cfg.yMax = fix.yMax; }
      var rr = Plot.draw(cv, cfg);
      if (!fix) fix = rr;
    }
    redrows.push(draw);
    draw();
  }

  derivLab({
    kind: "cap", kName: "F",
    waveEl: "#capLab_wave", kEl: "capLab_C", kLabEl: "capLab_Cv",
    ampEl: "capLab_A", ampLabEl: "capLab_Av",
    plotEl: "capLab_plot", noteEl: "capLab_note",
    r0El: "capLab_i0", rPkEl: "capLab_ipk", rPhEl: "capLab_ph",
    yIn: "v", yOut: "i"
  });

  derivLab({
    kind: "ind", kName: "H",
    waveEl: "#indLab_wave", kEl: "indLab_L", kLabEl: "indLab_Lv",
    ampEl: "indLab_A", ampLabEl: "indLab_Av",
    plotEl: "indLab_plot", noteEl: "indLab_note",
    r0El: "indLab_v0", rPkEl: "indLab_vpk", rPhEl: "indLab_ph",
    yIn: "i", yOut: "v"
  });

  /* ---------- 3. Inductor energy lab ---------- */
  (function () {
    var cv = $("indE_plot");
    if (!cv) return;
    var L = bindSlider("indE_L", "indE_Lv", function (x) { return x.toFixed(1) + " H"; });
    var I = bindSlider("indE_I", "indE_Iv", function (x) { return x.toFixed(1) + " A"; });
    var fix = null;                       /* axes locked to the default case */

    function draw() {
      var l = parseFloat(L.value), i = parseFloat(I.value);
      $("indE_w").textContent = (0.5 * l * i * i).toFixed(2) + " J";
      $("indE_lam").textContent = (l * i).toFixed(2) + " Wb·t";
      var cfg = {
        xMin: -10, xMax: 10,
        series: [
          { fn: function (x) { return 0.5 * l * x * x; }, color: COL.violet, width: 2.4, fill: "to0", label: "w(i) = ½Li²" }
        ],
        points: [{ x: i, y: 0.5 * l * i * i, color: COL.amber, r: 6, label: "here", baseline: "bottom" }],
        xLabel: "i (A)", yLabel: "w (J)",
        vLines: i !== 0 ? [{ x: i, color: COL.amber, label: "" }] : []
      };
      if (fix) { cfg.xMin = fix.xMin; cfg.xMax = fix.xMax; cfg.yMin = fix.yMin; cfg.yMax = fix.yMax; }
      var rr = Plot.draw(cv, cfg);
      if (!fix) fix = rr;
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 5. Combine C / L lab ---------- */
  (function () {
    var cv = $("comb_plot");
    if (!cv) return;
    var st = { type: "C", top: "series" };
    var fix = null;                       /* axes locked per component/topology (default sliders) */

    function seg(id, attr, key) {
      var btns = Array.prototype.slice.call(document.querySelectorAll(id + " button"));
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.classList.remove("on"); });
          b.classList.add("on");
          st[key] = b.dataset[attr];
          fix = null;                     /* new curve family: re-lock axes */
          draw();
        });
      });
    }
    seg("#comb_type", "type", "type");
    seg("#comb_top", "top", "top");

    var X1 = bindSlider("comb_1", "comb_1v", function (x) { return x.toFixed(1); });
    var X2 = bindSlider("comb_2", "comb_2v", function (x) { return x.toFixed(1); });

    function eq(c1, c2) {
      if (st.top === "series") return (st.type === "C") ? (c1 * c2) / (c1 + c2) : (c1 + c2);
      return (st.type === "C") ? (c1 + c2) : 1 / (1 / c1 + 1 / c2);
    }

    function draw() {
      var c1 = parseFloat(X1.value), c2 = parseFloat(X2.value);
      var unit = st.type === "C" ? " F" : " H";
      $("comb_eq").textContent = eq(c1, c2).toFixed(2) + unit;
      var rule;
      if (st.type === "C") rule = st.top === "series" ? "1/Ceq = 1/C1 + 1/C2" : "Ceq = C1 + C2";
      else rule = st.top === "series" ? "Leq = L1 + L2" : "1/Leq = 1/L1 + 1/L2";
      $("comb_rule").textContent = rule;

      var cfg = {
        xMin: 0.5, xMax: 20,
        series: [
          { fn: function (x) { return eq(c1, x); }, color: COL.blue, width: 2.6, fill: "to0",
            label: "eq value as C₂/L₂ varies" }
        ],
        points: [{ x: c2, y: eq(c1, c2), color: COL.amber, r: 6, label: "current", baseline: "bottom" }],
        hLines: [{ y: c1, color: COL.green, dash: [5, 4], label: "C₁/L₁ = " + c1.toFixed(1) }],
        xLabel: st.type === "C" ? "C₂ (F)" : "L₂ (H)",
        yLabel: "C_eq (F)"
      };
      if (fix) { cfg.xMin = fix.xMin; cfg.xMax = fix.xMax; cfg.yMin = fix.yMin; cfg.yMax = fix.yMax; }
      var rr = Plot.draw(cv, cfg);
      if (!fix) fix = rr;
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

  /* ---- S1 · cap-vi: charge a capacitor, i = C dv/dt ---- */
  (function () {
    var root = $("sim-capcharge");
    if (!root) return;
    CS.mount(root, {
      id: "capcharge", icon: "🔋",
      title: "Live circuit · charging a capacitor",
      sub: "Close S: current rushes in while v_C changes, then fades as v_C → Vs.",
      note: "The dots are the current i = C·dv/dt. Biggest at t = 0⁺ (fastest dv/dt), zero once the capacitor is full. Open S — the stored charge just sits there. Drag R or C to change τ = RC.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 12000, speed0: 2,
      controls: [
        { type: "range", id: "Vs", label: "Source Vs", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 100, max: 10000, step: 100, value: 1000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.1, max: 50, step: 0.5, value: 10, fmt: function (x) { return x.toFixed(1) + " µF"; } },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vs },
            { id: "sw", type: "SW", a: "s", b: "n", closed: !!c.on },
            { id: "R", type: "R", a: "n", b: "a", r: c.R },
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 }
          ],
          wires: [
            VW(110, BOT, 192, "C"), VW(110, 52, TOP, "C"),
            HW(TOP, 110, 192, "C"), HW(TOP, 228, 298, "C"),
            HW(TOP, 342, 470, "C"), VW(470, TOP, 163, "C"),
            VW(470, 181, BOT, "C"), HW(BOT, 110, 620, "C")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.Vs), lx: 60, ly: 172 },
            { type: "SW", id: "sw", x: 210, y: TOP, o: "h", closed: !!c.on, label: "S", ly: 40 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "C", id: "C", x: 470, y: 172, o: "v", label: "C", ls: c.C.toFixed(1) + " µF", lx: 548, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 470, y: 238, label: "v_C", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
            { x: 320, y: 112, label: "i", get: function (s) { return CS.fmtSI((s.branches.C || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "vc", label: "v_C", hl: true, get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
        { id: "i", label: "i = C dv/dt", get: function (s) { return CS.fmtSI((s.branches.C || {}).i || 0, "A"); } },
        { id: "tau", label: "τ = RC", get: function (s, c) { return CS.fmtSI(c.R * c.C * 1e-6, "s"); } },
        { id: "w", label: "w = ½Cv²", get: function (s) { return CS.fmtSI(0.5 * (s.ctrl.C * 1e-6) * (s.V.a || 0) * (s.V.a || 0), "J"); } }
      ]
    });
  })();

  /* ---- S2 · cap-dc: capacitors in DC circuits (C = open) ---- */
  (function () {
    var root = $("sim-cdc");
    if (!root) return;
    CS.mount(root, {
      id: "cdc", icon: "🧱",
      title: "Live circuit · a capacitor in a DC circuit",
      sub: "Close S: current flows only while C charges — then it stops completely. C becomes an open.",
      note: "At steady state no DC current crosses the gap, so v_C lands exactly on the divider answer Vs·R2/(R1+R2) — the “replace C by an open” recipe from the worked example. τ = (R1∥R2)·C.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 8000, speed0: 2,
      controls: [
        { type: "range", id: "Vs", label: "Source Vs", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R1", label: "R1 (series)", min: 100, max: 10000, step: 100, value: 2000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "R2", label: "R2 (to gnd)", min: 100, max: 10000, step: 100, value: 2000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.1, max: 50, step: 0.5, value: 10, fmt: function (x) { return x.toFixed(1) + " µF"; } },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vs },
            { id: "sw", type: "SW", a: "s", b: "n", closed: !!c.on },
            { id: "R1", type: "R", a: "n", b: "a", r: c.R1 },
            { id: "R2", type: "R", a: "a", b: "g", r: c.R2 },
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 }
          ],
          wires: [
            VW(110, BOT, 192, "R1"), VW(110, 52, TOP, "R1"),
            HW(TOP, 110, 192, "R1"), HW(TOP, 228, 298, "R1"),
            HW(TOP, 342, 590, "R1"),
            VW(470, TOP, 163, "R2"), VW(470, 181, BOT, "R2"),
            VW(590, TOP, 163, "C"), VW(590, 181, BOT, "C"),
            HW(BOT, 110, 640, "C")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.Vs), lx: 60, ly: 172 },
            { type: "SW", id: "sw", x: 210, y: TOP, o: "h", closed: !!c.on, label: "S", ly: 40 },
            { type: "R", id: "R1", x: 320, y: TOP, o: "h", label: "R1", ls: CS.fmtSI(c.R1, "Ω"), ly: 40 },
            { type: "R", id: "R2", x: 470, y: 172, o: "v", label: "R2", ls: CS.fmtSI(c.R2, "Ω"), lx: 402, ly: 166 },
            { type: "C", id: "C", x: 590, y: 172, o: "v", label: "C", ls: c.C.toFixed(1) + " µF", lx: 660, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 590, y: 238, label: "v_C", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
            { x: 320, y: 112, label: "i", get: function (s) { return CS.fmtSI((s.branches.R1 || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "vc", label: "v_C (live)", hl: true, get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
        { id: "vfin", label: "v_C(∞) divider", get: function (s, c) { return (c.Vs * c.R2 / (c.R1 + c.R2)).toFixed(2) + " V"; } },
        { id: "i", label: "i (total)", get: function (s) { return CS.fmtSI((s.branches.R1 || {}).i || 0, "A"); } },
        { id: "tau", label: "τ = (R1∥R2)C", get: function (s, c) { return CS.fmtSI(c.R1 * c.R2 / (c.R1 + c.R2) * c.C * 1e-6, "s"); } }
      ]
    });
  })();

  /* ---- S3 · cap-comb: two capacitors, series vs parallel ---- */
  (function () {
    var root = $("sim-capcomb");
    if (!root) return;
    CS.mount(root, {
      id: "capcomb", icon: "🔀",
      title: "Live circuit · two capacitors — series vs parallel",
      sub: "Flip the topology: parallel shares voltage, series shares charge.",
      note: "Parallel: same v on both, charges add (q ∝ C). Series: the same charge flows through both, so voltages split inversely to C — the smaller capacitor takes the bigger share. Watch q1/q2 and C_eq while you toggle.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 8000, speed0: 2,
      controls: [
        { type: "seg", id: "top", label: "Topology", value: "parallel", options: [{ v: "parallel", label: "Parallel" }, { v: "series", label: "Series" }] },
        { type: "range", id: "C1", label: "Capacitance C1", min: 0.5, max: 20, step: 0.5, value: 8, fmt: function (x) { return x.toFixed(1) + " µF"; } },
        { type: "range", id: "C2", label: "Capacitance C2", min: 0.5, max: 20, step: 0.5, value: 4, fmt: function (x) { return x.toFixed(1) + " µF"; } },
        { type: "range", id: "Vs", label: "Source Vs", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        var ser = c.top === "series";
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vs },
            { id: "sw", type: "SW", a: "s", b: "n", closed: !!c.on },
            { id: "R", type: "R", a: "n", b: "a", r: 1000 },
            { id: "C1", type: "C", a: "a", b: ser ? "m" : "g", c: c.C1 * 1e-6 },
            { id: "C2", type: "C", a: ser ? "m" : "a", b: "g", c: c.C2 * 1e-6 }
          ],
          wires: ser
            ? [VW(110, BOT, 192, "C1"), VW(110, 52, TOP, "C1"),
               HW(TOP, 110, 192, "C1"), HW(TOP, 228, 298, "C1"),
               HW(TOP, 342, 470, "C1"), VW(470, TOP, 119, "C1"),
               VW(470, 137, 207, "C1"), VW(470, 225, BOT, "C2"),
               HW(BOT, 110, 560, "C2")]
            : [VW(110, BOT, 192, "C1"), VW(110, 52, TOP, "C1"),
               HW(TOP, 110, 192, "C1"), HW(TOP, 228, 298, "C1"),
               HW(TOP, 342, 590, "C1"), VW(470, TOP, 163, "C1"),
               VW(470, 181, BOT, "C1"), VW(590, TOP, 163, "C2"),
               VW(590, 181, BOT, "C2"), HW(BOT, 110, 640, "C2")],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.Vs), lx: 60, ly: 172 },
            { type: "SW", id: "sw", x: 210, y: TOP, o: "h", closed: !!c.on, label: "S", ly: 40 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: "1 kΩ", ly: 40 }
          ].concat(ser
            ? [{ type: "C", id: "C1", x: 470, y: 128, o: "v", label: "C1", ls: c.C1.toFixed(1) + " µF", lx: 552, ly: 122 },
               { type: "C", id: "C2", x: 470, y: 216, o: "v", label: "C2", ls: c.C2.toFixed(1) + " µF", lx: 552, ly: 210 }]
            : [{ type: "C", id: "C1", x: 470, y: 172, o: "v", label: "C1", ls: c.C1.toFixed(1) + " µF", lx: 400, ly: 166 },
               { type: "C", id: "C2", x: 590, y: 172, o: "v", label: "C2", ls: c.C2.toFixed(1) + " µF", lx: 662, ly: 166 }]),
          gnds: [[300, BOT]],
          probes: [
            { x: ser ? 470 : 470, y: ser ? 84 : 238, label: "v1",
              get: function (s) { var b = s.branches.C1; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } }
          ]
        };
      },
      readouts: [
        { id: "v1", label: "v1 across C1", get: function (s) { var b = s.branches.C1; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } },
        { id: "v2", label: "v2 across C2", get: function (s) { var b = s.branches.C2; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } },
        { id: "q1", label: "q1 = C1v1", hl: true, get: function (s) { var b = s.branches.C1; return b ? CS.fmtSI(s.ctrl.C1 * 1e-6 * ((b.va || 0) - (b.vb || 0)), "C") : "—"; } },
        { id: "q2", label: "q2 = C2v2", hl: true, get: function (s) { var b = s.branches.C2; return b ? CS.fmtSI(s.ctrl.C2 * 1e-6 * ((b.va || 0) - (b.vb || 0)), "C") : "—"; } },
        { id: "ceq", label: "C_eq", get: function (s, c) {
            var v = c.top === "series" ? c.C1 * c.C2 / (c.C1 + c.C2) : c.C1 + c.C2;
            return v.toFixed(1) + " µF"; } }
      ]
    });
  })();

  /* ---- S4 · ind-vi: build up inductor current, v = L di/dt ---- */
  (function () {
    var root = $("sim-indcharge");
    if (!root) return;
    CS.mount(root, {
      id: "indcharge", icon: "🧲",
      title: "Live circuit · building up inductor current",
      sub: "Close S: current starts at 0 and creeps up — v_L is biggest while di/dt is biggest.",
      note: "Mirror image of the capacitor: i(0⁺) = 0 because current through an inductor cannot jump. The inductor voltage is maximal at t = 0⁺ and decays to zero as i → Vs/R (inductor = short at DC steady state). τ = L/R.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 12000, speed0: 2,
      controls: [
        { type: "range", id: "Vs", label: "Source Vs", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 100, max: 10000, step: 100, value: 1000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "L", label: "Inductance L", min: 1, max: 100, step: 1, value: 10, fmt: function (x) { return x.toFixed(0) + " mH"; } },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vs },
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
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.Vs), lx: 60, ly: 172 },
            { type: "SW", id: "sw", x: 210, y: TOP, o: "h", closed: !!c.on, label: "S", ly: 40 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "L", id: "L", x: 470, y: 172, o: "v", label: "L", ls: c.L.toFixed(0) + " mH", lx: 548, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 470, y: 238, label: "i_L", get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } },
            { x: 320, y: 112, label: "v_L", get: function (s) { var b = s.branches.L; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } }
          ]
        };
      },
      readouts: [
        { id: "il", label: "i_L", hl: true, get: function (s) { return CS.fmtSI((s.branches.L || {}).i || 0, "A"); } },
        { id: "vl", label: "v_L = L di/dt", get: function (s) { var b = s.branches.L; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } },
        { id: "if", label: "i(∞) = Vs/R", get: function (s, c) { return CS.fmtSI(c.Vs / c.R, "A"); } },
        { id: "tau", label: "τ = L/R", get: function (s, c) { return CS.fmtSI(c.L * 1e-3 / c.R, "s"); } }
      ]
    });
  })();

  /* ---- S5 · ind-comb: two inductors, series vs parallel ---- */
  (function () {
    var root = $("sim-indcomb");
    if (!root) return;
    CS.mount(root, {
      id: "indcomb", icon: "🧮",
      title: "Live circuit · two inductors — series vs parallel",
      sub: "Flip the topology: series adds like resistors, parallel mirrors resistors too.",
      note: "Series: same current through both, voltages split in proportion to L. Parallel: same voltage, currents split inversely to L (the smaller L takes the bigger share). L_eq adds in series and combines like a reciprocal sum in parallel — just like R.",
      w: 720, h: 340, dt: 1e-5, spf: 8, flow: 8000, speed0: 2,
      controls: [
        { type: "seg", id: "top", label: "Topology", value: "series", options: [{ v: "series", label: "Series" }, { v: "parallel", label: "Parallel" }] },
        { type: "range", id: "L1", label: "Inductance L1", min: 0.5, max: 50, step: 0.5, value: 10, fmt: function (x) { return x.toFixed(1) + " mH"; } },
        { type: "range", id: "L2", label: "Inductance L2", min: 0.5, max: 50, step: 0.5, value: 20, fmt: function (x) { return x.toFixed(1) + " mH"; } },
        { type: "range", id: "R", label: "Resistance R", min: 100, max: 10000, step: 100, value: 1000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "Vs", label: "Source Vs", min: 2, max: 20, step: 1, value: 12, fmt: fV },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        var ser = c.top === "series";
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vs },
            { id: "sw", type: "SW", a: "s", b: "n", closed: !!c.on },
            { id: "R", type: "R", a: "n", b: "a", r: c.R },
            { id: "L1", type: "L", a: "a", b: ser ? "m" : "g", l: c.L1 * 1e-3 },
            { id: "L2", type: "L", a: ser ? "m" : "a", b: "g", l: c.L2 * 1e-3 }
          ],
          wires: ser
            ? [VW(110, BOT, 192, "L1"), VW(110, 52, TOP, "L1"),
               HW(TOP, 110, 192, "L1"), HW(TOP, 228, 298, "L1"),
               HW(TOP, 342, 470, "L1"), VW(470, TOP, 106, "L1"),
               VW(470, 150, 194, "L1"), VW(470, 238, BOT, "L2"),
               HW(BOT, 110, 560, "L2")]
            : [VW(110, BOT, 192, "L1"), VW(110, 52, TOP, "L1"),
               HW(TOP, 110, 192, "L1"), HW(TOP, 228, 298, "L1"),
               HW(TOP, 342, 590, "L1"), VW(470, TOP, 150, "L1"),
               VW(470, 194, BOT, "L1"), VW(590, TOP, 150, "L2"),
               VW(590, 194, BOT, "L2"), HW(BOT, 110, 640, "L2")],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vs", ls: fV(c.Vs), lx: 60, ly: 172 },
            { type: "SW", id: "sw", x: 210, y: TOP, o: "h", closed: !!c.on, label: "S", ly: 40 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 }
          ].concat(ser
            ? [{ type: "L", id: "L1", x: 470, y: 128, o: "v", label: "L1", ls: c.L1.toFixed(1) + " mH", lx: 556, ly: 122 },
               { type: "L", id: "L2", x: 470, y: 216, o: "v", label: "L2", ls: c.L2.toFixed(1) + " mH", lx: 556, ly: 210 }]
            : [{ type: "L", id: "L1", x: 470, y: 172, o: "v", label: "L1", ls: c.L1.toFixed(1) + " mH", lx: 398, ly: 166 },
               { type: "L", id: "L2", x: 590, y: 172, o: "v", label: "L2", ls: c.L2.toFixed(1) + " mH", lx: 664, ly: 166 }]),
          gnds: [[300, BOT]],
          probes: [
            { x: 320, y: 112, label: "i (total)", get: function (s) { return CS.fmtSI((s.branches.R || {}).i || 0, "A"); } }
          ]
        };
      },
      readouts: [
        { id: "i1", label: "i1 through L1", hl: true, get: function (s) { return CS.fmtSI((s.branches.L1 || {}).i || 0, "A"); } },
        { id: "i2", label: "i2 through L2", hl: true, get: function (s) { return CS.fmtSI((s.branches.L2 || {}).i || 0, "A"); } },
        { id: "v1", label: "v1 across L1", get: function (s) { var b = s.branches.L1; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } },
        { id: "v2", label: "v2 across L2", get: function (s) { var b = s.branches.L2; return b ? ((b.va || 0) - (b.vb || 0)).toFixed(2) + " V" : "—"; } },
        { id: "leq", label: "L_eq", get: function (s, c) {
            var v = c.top === "series" ? c.L1 + c.L2 : c.L1 * c.L2 / (c.L1 + c.L2);
            return v.toFixed(1) + " mH"; } }
      ]
    });
  })();

})();