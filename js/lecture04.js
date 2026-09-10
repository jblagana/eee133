/* ============================================================
   lecture04.js — labs for First-Order Circuits II
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

  /* ---------- 1. Response builder ---------- */
  (function () {
    var cv = $("rbPlot");
    if (!cv) return;
    var X0 = bindSlider("rbX0", "rbX0v", function (x) { return x.toFixed(1); });
    var Xinf = bindSlider("rbXinf", "rbXinfv", function (x) { return x.toFixed(1); });
    var Tau = bindSlider("rbTau", "rbTauv", function (x) { return x.toFixed(1) + " s"; });
    var fix = null;                       /* axes locked to the default case */

    function draw() {
      var x0 = parseFloat(X0.value), xinf = parseFloat(Xinf.value), tau = parseFloat(Tau.value);
      function x(t) { return xinf + (x0 - xinf) * Math.exp(-t / tau); }
      $("rbXtau").textContent = x(tau).toFixed(2);
      $("rbX5").textContent = x(5 * tau).toFixed(2);
      $("rbSwing").textContent = Math.abs(x0 - xinf).toFixed(1);

      var c = {
        xMin: 0, xMax: 5 * tau,
        series: [{ fn: x, color: COL.blue, width: 2.6, fill: "to0" }],
        xLabel: "t (s)", yLabel: "x(t)",
        hLines: [
          { y: xinf, color: COL.green, dash: [5, 4], label: "x(∞)" },
          { y: x0, color: COL.amber, dash: [3, 4], label: "x(0⁺)" }
        ],
        vLines: [
          { x: tau, color: COL.green, dash: [4, 4], label: "τ" },
          { x: 5 * tau * 0.999, color: COL.faint || "#8b98ad", dash: [2, 4], label: "5τ" }
        ],
        points: [
          { x: 0, y: x0, color: COL.amber, r: 5.5, label: "x(0⁺)", baseline: "top" },
          { x: tau, y: x(tau), color: COL.green, r: 5, label: "63.2% of the swing" }
        ]
      };
      if (fix) { c.xMin = fix.xMin; c.xMax = fix.xMax; c.yMin = fix.yMin; c.yMax = fix.yMax; }
      var rr = Plot.draw(cv, c);
      if (!fix) fix = rr;
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 2. Step sketcher ---------- */
  (function () {
    var cv = $("stepPlot");
    if (!cv) return;
    var st = { pulse: false };
    var fix = null;                       /* axes locked to the default case */
    var btns = Array.prototype.slice.call(document.querySelectorAll("#stepPulse button"));
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        st.pulse = b.dataset.pulse === "1";
        fix = null;                       /* step ↔ pulse: re-lock axes */
        draw();
      });
    });
    var A = bindSlider("stepA", "stepAv", function (x) { return x.toFixed(1) + " V"; });
    var T0 = bindSlider("stepT0", "stepT0v", function (x) { return x.toFixed(1) + " s"; });
    var T1 = bindSlider("stepT1", "stepT1v", function (x) { return x.toFixed(1) + " s"; });

    function draw() {
      var a = parseFloat(A.value), t0 = parseFloat(T0.value), t1 = parseFloat(T1.value);
      function u(t, t0) { return t >= t0 ? 1 : 0; }
      var fn = st.pulse
        ? function (t) { return a * (u(t, t0) - u(t, t1)); }
        : function (t) { return a * u(t, t0); };
      var xMax = Math.max(8, t0 + 8);
      var xMin = Math.min(-2, t0 - 2);

      var series = [{ fn: fn, color: COL.blue, width: 2.6, label: st.pulse ? "A·[u(t−t₀) − u(t−t₁)]" : "A·u(t − t₀)" }];
      var vLines = [{ x: t0, color: COL.amber, dash: [4, 4], label: "t₀" }];
      if (st.pulse) vLines.push({ x: t1, color: COL.green, dash: [4, 4], label: "t₁" });

      var c = {
        xMin: xMin, xMax: xMax,
        series: series,
        xLabel: "t (s)", yLabel: "v (V)",
        vLines: vLines, legend: false
      };
      if (fix) { c.xMin = fix.xMin; c.xMax = fix.xMax; c.yMin = fix.yMin; c.yMax = fix.yMax; }
      var rr = Plot.draw(cv, c);
      if (!fix) fix = rr;
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 3. Pulse response lab (RC low-pass) ---------- */
  (function () {
    var cv = $("plPlot");
    if (!cv) return;
    var Vp = bindSlider("plVp", "plVpv", function (x) { return x.toFixed(0) + " V"; });
    var Tp = bindSlider("plTp", "plTpv", function (x) { return x.toFixed(1) + " τ"; });
    var Tau = bindSlider("plTau", "plTaum", function (x) { return x.toFixed(1) + " s"; });
    var fix = null;                       /* axes locked to the default case */

    function draw() {
      var vp = parseFloat(Vp.value);
      var tp = parseFloat(Tp.value);     // in units of tau
      var tau = parseFloat(Tau.value);    // seconds
      var tpSec = tp * tau;

      var vtp = vp * (1 - Math.exp(-tp));
      $("plVtp").textContent = vtp.toFixed(2) + " V";
      $("plSag").textContent = (vp - vtp).toFixed(2) + " V (" + (100 * (1 - vtp / vp)).toFixed(1) + "%)";
      $("plRatio").textContent = tp.toFixed(1);

      function vOut(t) {
        if (t < 0) return 0;
        if (t <= tpSec) return vp * (1 - Math.exp(-t / tau));
        return vtp * Math.exp(-(t - tpSec) / tau);
      }
      function vIn(t) { return (t >= 0 && t <= tpSec) ? vp : 0; }

      var xMax = tpSec + 5 * tau;
      var c = {
        xMin: 0, xMax: xMax,
        series: [
          { fn: vIn, color: COL.green, width: 1.8, dash: [6, 4], label: "input pulse" },
          { fn: vOut, color: COL.blue, width: 2.6, fill: "to0", label: "v_C(t)" }
        ],
        xLabel: "t (s)", yLabel: "v (V)",
        vLines: [{ x: tpSec, color: COL.amber, dash: [4, 4], label: "tₚ" }],
        points: [{ x: tpSec, y: vtp, color: COL.amber, r: 5.5, label: "v(tₚ) = " + vtp.toFixed(1) + " V" }],
        regions: [{ x0: 0, x1: tpSec, color: COL.green, alpha: 0.05 }]
      };
      if (fix) { c.xMin = fix.xMin; c.xMax = fix.xMax; c.yMin = fix.yMin; c.yMax = fix.yMax; }
      var rr = Plot.draw(cv, c);
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

  /* ---- S9 · tau-thev: τ via the Thévenin resistance ---- */
  (function () {
    var root = $("sim-thev");
    if (!root) return;
    CS.mount(root, {
      id: "thev", icon: "🕵️",
      title: "Live circuit · τ via the Thévenin resistance",
      sub: "v_C chases Vth with τ = Rth·C — watch the readouts match the figure above.",
      note: "Deactivate the source (short it) and reduce the network: Rth = R1∥R2, Vth = Vs·R2/(R1+R2). The capacitor sees exactly that one source + one resistor — so it charges with τ = Rth·C. The defaults (12 V, 4 kΩ, 2 kΩ) reproduce the SVG figure: Vth = 4 V, Rth = 1.33 kΩ.",
      w: 720, h: 340, dt: 1e-5, spf: 20, flow: 6000, speed0: 2,
      controls: [
        { type: "range", id: "Vs", label: "Source Vs", min: 5, max: 20, step: 1, value: 12, fmt: fV },
        { type: "range", id: "R1", label: "R1 (series)", min: 1000, max: 10000, step: 100, value: 4000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "R2", label: "R2 (to gnd)", min: 1000, max: 10000, step: 100, value: 2000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.5, max: 20, step: 0.5, value: 3, fmt: function (x) { return x.toFixed(1) + " µF"; } },
        { type: "seg", id: "on", label: "Switch S", value: 1, options: [{ v: 1, label: "Closed" }, { v: 0, label: "Open" }] }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vs },
            { id: "sw", type: "SW", a: "s", b: "n", closed: !!c.on },
            { id: "R1", type: "R", a: "n", b: "m", r: c.R1 },
            { id: "R2", type: "R", a: "m", b: "g", r: c.R2 },
            { id: "C", type: "C", a: "m", b: "g", c: c.C * 1e-6 }
          ],
          wires: [
            VW(110, BOT, 192, "C"), VW(110, 52, TOP, "C"),
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
            { x: 590, y: 238, label: "v_C", get: function (s) { return (s.V.m || 0).toFixed(2) + " V"; } },
            { x: 320, y: 112, label: "Vth", get: function (s, c) { return (c.Vs * c.R2 / (c.R1 + c.R2)).toFixed(2) + " V"; } }
          ]
        };
      },
      readouts: [
        { id: "vth", label: "Vth = Vs·R2/(R1+R2)", get: function (s, c) { return (c.Vs * c.R2 / (c.R1 + c.R2)).toFixed(2) + " V"; } },
        { id: "rth", label: "Rth = R1∥R2", get: function (s, c) { return CS.fmtSI(c.R1 * c.R2 / (c.R1 + c.R2), "Ω"); } },
        { id: "tau", label: "τ = Rth·C", hl: true, get: function (s, c) { return CS.fmtSI(c.R1 * c.R2 / (c.R1 + c.R2) * c.C * 1e-6, "s"); } },
        { id: "vc", label: "v_C (live)", get: function (s) { return (s.V.m || 0).toFixed(2) + " V"; } }
      ]
    });
  })();

  /* ---- S10 · pulse: pulse excitation, two intervals, live scope ---- */
  (function () {
    var root = $("sim-pulse");
    if (!root) return;
    function tauOf(c) { return c.R * c.C * 1e-6; }
    CS.mount(root, {
      id: "pulse", icon: "📶",
      title: "Live circuit · pulse excitation, two intervals",
      sub: "A pulse is a step up and a later step down — the response comes in two intervals.",
      note: "Interval 1 (pulse on): v_C chases Vp. Interval 2 (pulse off): it chases 0 — starting from the state the first interval left behind (continuity!). The scope shows v_in (dashed) and v_C (solid) over the last two periods. Try tₚ ≈ τ and tₚ ≈ 8τ and compare the handoff value.",
      w: 720, h: 340, dt: 1e-5, spf: 40, flow: 6000, speed0: 1,
      controls: [
        { type: "range", id: "Vp", label: "Pulse amplitude Vₚ", min: 2, max: 20, step: 1, value: 10, fmt: fV },
        { type: "range", id: "tp", label: "Pulse width tₚ (× τ)", min: 0.5, max: 8, step: 0.5, value: 3, fmt: function (x) { return x.toFixed(1) + " τ"; } },
        { type: "range", id: "T", label: "Period T (× τ)", min: 2, max: 16, step: 1, value: 8, fmt: function (x) { return x.toFixed(0) + " τ"; } },
        { type: "range", id: "R", label: "Resistance R", min: 1000, max: 10000, step: 100, value: 5000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.1, max: 10, step: 0.1, value: 1, fmt: function (x) { return x.toFixed(1) + " µF"; } }
      ],
      build: function (c) {
        function vin(t) {
          var T = c.T * tauOf(c), tp = c.tp * tauOf(c);
          return (t % T) < tp ? c.Vp : 0;
        }
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: vin },
            { id: "R", type: "R", a: "s", b: "a", r: c.R },
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 }
          ],
          wires: [
            VW(110, BOT, 192, "C"), VW(110, 52, TOP, "C"),
            HW(TOP, 110, 298, "C"), HW(TOP, 342, 470, "C"),
            VW(470, TOP, 163, "C"), VW(470, 181, BOT, "C"),
            HW(BOT, 110, 600, "C")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "Vₚ·u(t)−u(t−tₚ)", lx: 210, ly: 130 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "C", id: "C", x: 470, y: 172, o: "v", label: "C", ls: c.C.toFixed(1) + " µF", lx: 548, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 110, y: 240, label: "v_in", get: function (s) { return vin(s.t).toFixed(1) + " V"; } },
            { x: 470, y: 238, label: "v_C", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } }
          ]
        };
      },
      readouts: [
        { id: "tau", label: "τ = RC", get: function (s, c) { return CS.fmtSI(tauOf(c), "s"); } },
        { id: "ratio", label: "tₚ/τ", hl: true, get: function (s, c) { return c.tp.toFixed(1); } },
        { id: "vc", label: "v_C (live)", get: function (s) { return (s.V.a || 0).toFixed(2) + " V"; } },
        { id: "int", label: "interval", get: function (s, c) {
            var T = c.T * tauOf(c), tp = c.tp * tauOf(c);
            return (s.t % T) < tp ? "1 · pulse ON" : "2 · pulse OFF"; } }
      ],
      scope: {
        window: 0.08,
        amp: function (s) { return s.ctrl.Vp; },
        traces: [
          { label: "v_in", color: "#d97706", dim: true,
            get: function (s) {
              var c = s.ctrl, T = c.T * tauOf(c), tp = c.tp * tauOf(c);
              return (s.t % T) < tp ? c.Vp : 0; } },
          { label: "v_C", color: "#2453d6",
            get: function (s) { return s.V.a || 0; } }
        ]
      }
    });
  })();

})();