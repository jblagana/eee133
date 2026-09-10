/* ============================================================
   lecture05.js — labs for Linear Waveshaping
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
  function segBind(id, attr, state, key) {
    var btns = Array.prototype.slice.call(document.querySelectorAll(id + " button"));
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        state[key] = b.dataset[attr];
        drawAll();
      });
    });
  }

  /* ---------- 1. RC waveshaper ---------- */
  (function () {
    var cv = $("wsPlot");
    if (!cv) return;
    var st = { mode: "LP", input: "step" };
    segBind("#ws_mode", "mode", st, "mode");
    segBind("#ws_in", "in", st, "input");
    var R = bindSlider("ws_R", "ws_Rv", function (x) { return x.toFixed(1) + " (Ω-scale)"; });
    var C = bindSlider("ws_C", "ws_Cv", function (x) { return x.toFixed(1) + " (µF-scale)"; });
    var A = bindSlider("ws_A", "ws_Av", function (x) { return x.toFixed(0) + " V"; });
    var W = bindSlider("ws_W", "ws_Wv", function (x) { return x.toFixed(1); });

    function draw() {
      var r = parseFloat(R.value), c = parseFloat(C.value), a = parseFloat(A.value);
      var w = parseFloat(W.value);
      var tau = r * c;
      var wSec = w * tau;

      var vC;
      var xMax;
      if (st.input === "step") {
        xMax = 5 * tau;
        vC = function (t) { return t <= 0 ? 0 : a * (1 - Math.exp(-t / tau)); };
      } else if (st.input === "pulse") {
        xMax = wSec + 5 * tau;
        var vtp = a * (1 - Math.exp(-w));
        vC = function (t) {
          if (t <= 0) return 0;
          if (t <= wSec) return a * (1 - Math.exp(-t / tau));
          return vtp * Math.exp(-(t - wSec) / tau);
        };
      } else {
        var T = wSec, h = T / 2;
        var dec = Math.exp(-h / tau);
        var cStar = dec * a / (1 + dec);
        var vHi = a / (1 + dec);
        xMax = 2 * T;
        vC = function (t) {
          var s = t % T;
          if (s < h) return a - (a - cStar) * Math.exp(-s / tau);
          return vHi * Math.exp(-(s - h) / tau);
        };
      }

      var vin = st.input === "step"
        ? function (t) { return t >= 0 ? a : 0; }
        : st.input === "pulse"
          ? function (t) { return (t >= 0 && t <= wSec) ? a : 0; }
          : function (t) { return (t % wSec) < wSec / 2 ? a : 0; };

      var vOut = st.mode === "LP"
        ? vC
        : function (t) { return vin(t) - vC(t); };

      $("ws_tau").textContent = tau.toFixed(2) + " (a.u.)";
      $("ws_fc").textContent = (1 / (2 * Math.PI * tau)).toFixed(2);
      if (st.input === "square") {
        var dec2 = Math.exp(-(wSec / 2) / tau);
        $("ws_tilt").textContent = (2 * (1 - dec2) / (1 + dec2) * 100).toFixed(1) + "%";
      } else {
        $("ws_tilt").textContent = "—";
      }

      Plot.draw(cv, {
        xMin: 0, xMax: xMax,
        series: [
          { fn: vin, color: COL.green, width: 1.8, dash: [6, 4], label: "v_in(t)" },
          { fn: vOut, color: COL.blue, width: 2.6, fill: "to0",
            label: st.mode === "LP" ? "v_o = v_C(t)" : "v_o = v_R(t)" }
        ],
        xLabel: "t (a.u.)", yLabel: "v (V)"
      });
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 2. Frequency response ---------- */
  (function () {
    var gcv = $("frGain"), pcv = $("frPhase");
    if (!gcv || !pcv) return;
    var st = { mode: "LP" };
    segBind("#fr_mode", "mode", st, "mode");
    var R = bindSlider("fr_R", "fr_Rv", function (x) { return x.toFixed(1) + " (Ω-scale)"; });
    var C = bindSlider("fr_C", "fr_Cv", function (x) { return x.toFixed(1) + " (µF-scale)"; });

    function draw() {
      var r = parseFloat(R.value), c = parseFloat(C.value);
      var tau = r * c;
      $("fr_wc").textContent = (1 / tau).toFixed(2) + " (a.u.)";
      $("fr_fc").textContent = (1 / (2 * Math.PI * tau)).toFixed(2);

      var gain = st.mode === "LP"
        ? function (x) { return 1 / Math.sqrt(1 + x * x); }
        : function (x) { return x / Math.sqrt(1 + x * x); };
      var phase = st.mode === "LP"
        ? function (x) { return -Math.atan(x) * 180 / Math.PI; }
        : function (x) { return 90 - Math.atan(x) * 180 / Math.PI; };

      Plot.draw(gcv, {
        xMin: 0.1, xMax: 10,
        series: [{ fn: gain, color: COL.blue, width: 2.6, fill: "to0", label: "|v_o/v_i|" }],
        xLabel: "f / f_c", yLabel: "gain",
        vLines: [{ x: 1, color: COL.amber, dash: [4, 4], label: "f_c" }],
        hLines: [{ y: 0.707, color: COL.green, dash: [4, 4], label: "0.707 = −3 dB" }],
        points: [{ x: 1, y: 0.707, color: COL.amber, r: 5.5, label: "cutoff" }],
        legend: false
      });

      Plot.draw(pcv, {
        xMin: 0.1, xMax: 10,
        series: [{ fn: phase, color: COL.violet, width: 2.6, label: "θ(f)" }],
        xLabel: "f / f_c", yLabel: "θ (°)",
        vLines: [{ x: 1, color: COL.amber, dash: [4, 4], label: "f_c" }],
        hLines: [{ y: st.mode === "LP" ? -45 : 45, color: COL.green, dash: [4, 4], label: "±45° at f_c" }],
        points: [{ x: 1, y: st.mode === "LP" ? -45 : 45, color: COL.amber, r: 5.5, label: st.mode === "LP" ? "−45°" : "+45°" }],
        legend: false
      });
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

  /* ---- S11 · labs: the RC waveshaper, live circuit + scope ---- */
  (function () {
    var root = $("sim-waveshaper");
    if (!root) return;
    function fcOf(c) { return 1 / (2 * Math.PI * c.R * c.C * 1e-6); }
    CS.mount(root, {
      id: "waveshaper", icon: "🌊",
      title: "Live circuit · the RC waveshaper",
      sub: "A square wave meets one R and one C — the output tilts (LP) or spikes (HP).",
      note: "Low-pass: v_out across C — slow exponential “sags” between edges (integrator-like when T ≫ τ). High-pass: v_out across R — spikes only at the edges, decaying between them (differentiator-like). The scope shows two periods; dashed = input, solid = output. Drag f toward f_c and the tilt grows until it becomes a sine.",
      w: 720, h: 340, dt: 1e-5, spf: 40, flow: 20000, speed0: 1,
      controls: [
        { type: "seg", id: "mode", label: "Output tap", value: "LP", options: [{ v: "LP", label: "Low-pass (out = C)" }, { v: "HP", label: "High-pass (out = R)" }] },
        { type: "range", id: "ff", label: "Frequency (× f_c)", min: 0.02, max: 0.4, step: 0.02, value: 0.1, fmt: function (x) { return x.toFixed(2) + " f_c"; } },
        { type: "range", id: "Vp", label: "Input amplitude", min: 2, max: 20, step: 1, value: 10, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 1000, max: 20000, step: 500, value: 5000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.1, max: 10, step: 0.1, value: 2, fmt: function (x) { return x.toFixed(1) + " µF"; } }
      ],
      build: function (c) {
        var T = 1 / (c.ff * fcOf(c));
        function vin(t) { return (t % T) < T / 2 ? c.Vp : 0; }
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: vin },
            { id: "R", type: "R", a: "s", b: "a", r: c.R },
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 }
          ],
          wires: [
            VW(110, BOT, 192, "R"), VW(110, 52, TOP, "R"),
            HW(TOP, 110, 298, "R"), HW(TOP, 342, 470, "R"),
            VW(470, TOP, 163, "R"), VW(470, 181, BOT, "R"),
            HW(BOT, 110, 600, "R")
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "v_in (square)", lx: 218, ly: 130 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "C", id: "C", x: 470, y: 172, o: "v", label: "C", ls: c.C.toFixed(1) + " µF", lx: 548, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 320, y: 112, label: "v_out",
              get: function (s) {
                var vc = s.V.a || 0;
                var v = s.ctrl.mode === "LP" ? vc : vin(s.t) - vc;
                return v.toFixed(2) + " V"; } }
          ]
        };
      },
      readouts: [
        { id: "tau", label: "τ = RC", get: function (s, c) { return CS.fmtSI(c.R * c.C * 1e-6, "s"); } },
        { id: "fc", label: "f_c = 1/2πRC", get: function (s, c) { return CS.fmtSI(fcOf(c), "Hz"); } },
        { id: "T", label: "period T", get: function (s, c) { return CS.fmtSI(1 / (c.ff * fcOf(c)), "s"); } },
        { id: "mode", label: "behavior", get: function (s, c) {
            return c.mode === "LP" ? "tilt / sag (integ.)" : "edge spikes (diff.)"; } }
      ],
      scope: {
        window: function (s) { return 2 / (s.ctrl.ff * fcOf(s.ctrl)); },
        amp: function (s) { return s.ctrl.Vp; },
        traces: [
          { label: "v_in", color: "#d97706", dim: true,
            get: function (s) {
              var c = s.ctrl, T = 1 / (c.ff * fcOf(c));
              return (s.t % T) < T / 2 ? c.Vp : 0; } },
          { label: "v_out", color: "#2453d6",
            get: function (s) {
              var c = s.ctrl, T = 1 / (c.ff * fcOf(c));
              var vc = s.V.a || 0;
              var vin = (s.t % T) < T / 2 ? c.Vp : 0;
              return c.mode === "LP" ? vc : vin - vc; } }
        ]
      }
    });
  })();

  /* ---- S12 · cutoff: the 3-dB cutoff, both ways (steady state) ---- */
  (function () {
    var root = $("sim-cutoff");
    if (!root) return;
    function H(c) {
      var rf = c.rf;
      var m = Math.sqrt(1 + rf * rf);
      return c.mode === "LP"
        ? { mag: 1 / m, th: Math.atan(rf) }
        : { mag: rf / m, th: Math.atan(1 / rf) };
    }
    CS.mount(root, {
      id: "cutoff", icon: "🎚️",
      title: "Live circuit · the 3-dB cutoff, both ways",
      sub: "Sweep the sine through the RC — at f = f_c the output is exactly 1/√2 of the input.",
      note: "Steady-state view: the scope always shows two input cycles; the output’s height and phase lag follow |H(jω)|. At f/f_c = 1 the gain is 0.707 = −3 dB (half the power). Below f_c the LP passes and the HP attenuates — above, it’s the other way around. The phase lag is visible between the dashed and solid traces.",
      w: 720, h: 340, solve: false, flow: 20000,
      controls: [
        { type: "seg", id: "mode", label: "Output tap", value: "LP", options: [{ v: "LP", label: "Low-pass (out = C)" }, { v: "HP", label: "High-pass (out = R)" }] },
        { type: "range", id: "rf", label: "Frequency (× f_c)", min: 0.1, max: 10, step: 0.1, value: 1, fmt: function (x) { return x.toFixed(1) + " f_c"; } },
        { type: "range", id: "Vp", label: "Input amplitude", min: 2, max: 20, step: 1, value: 10, fmt: fV },
        { type: "range", id: "R", label: "Resistance R", min: 1000, max: 20000, step: 500, value: 5000, fmt: function (x) { return CS.fmtSI(x, "Ω"); } },
        { type: "range", id: "C", label: "Capacitance C", min: 0.1, max: 10, step: 0.1, value: 2, fmt: function (x) { return x.toFixed(1) + " µF"; } }
      ],
      build: function (c) {
        return {
          branches: [
            { id: "Vs", type: "V", a: "s", b: "g", v: c.Vp },
            { id: "R", type: "R", a: "s", b: "a", r: c.R },
            { id: "C", type: "C", a: "a", b: "g", c: c.C * 1e-6 }
          ],
          wires: [
            { pts: [[110, BOT], [110, 192]], cur: function (s) { return s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } },
            { pts: [[110, 52], [110, TOP]], cur: function (s) { return s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } },
            { pts: [[110, TOP], [298, TOP]], cur: function (s) { return s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } },
            { pts: [[342, TOP], [470, TOP]], cur: function (s) { return s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } },
            { pts: [[470, TOP], [470, 163]], cur: function (s) { return s.ctrl.rf * s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } },
            { pts: [[470, 181], [470, BOT]], cur: function (s) { return s.ctrl.rf * s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } },
            { pts: [[110, BOT], [600, BOT]], cur: function (s) { return s.ctrl.Vp / (s.ctrl.R * Math.sqrt(1 + s.ctrl.rf * s.ctrl.rf)); } }
          ],
          comps: [
            { type: "V", id: "Vs", x: 110, y: 172, o: "v", label: "v_in (sine)", lx: 214, ly: 130 },
            { type: "R", id: "R", x: 320, y: TOP, o: "h", label: "R", ls: CS.fmtSI(c.R, "Ω"), ly: 40 },
            { type: "C", id: "C", x: 470, y: 172, o: "v", label: "C", ls: c.C.toFixed(1) + " µF", lx: 548, ly: 166 }
          ],
          gnds: [[300, BOT]],
          probes: [
            { x: 470, y: 238, label: "v_out",
              get: function (s) { return (s.ctrl.Vp * H(s.ctrl).mag).toFixed(2) + " V (pk)"; } }
          ]
        };
      },
      readouts: [
        { id: "fc", label: "f_c = 1/2πRC", get: function (s, c) { return CS.fmtSI(1 / (2 * Math.PI * c.R * c.C * 1e-6), "Hz"); } },
        { id: "mag", label: "|v_out/v_in|", hl: true, get: function (s, c) { return H(c).mag.toFixed(3); } },
        { id: "db", label: "gain (dB)", get: function (s, c) {
            var db = 20 * Math.log10(Math.max(H(c).mag, 1e-9));
            return db.toFixed(1) + " dB" + (Math.abs(H(c).mag - 0.7071) < 0.03 ? "  (≈ −3 dB)" : ""); } },
        { id: "ph", label: "phase lag θ", get: function (s, c) { return (180 * H(c).th / Math.PI).toFixed(0) + "°"; } }
      ],
      scope: {
        amp: function (s) { return s.ctrl.Vp; },
        traces: [
          { label: "v_in", color: "#d97706", dim: true,
            get: function (s) { return s.ctrl.Vp * Math.sin(s._ph); } },
          { label: "v_out", color: "#2453d6",
            get: function (s) {
              var h = H(s.ctrl);
              return s.ctrl.Vp * h.mag * Math.sin(s._ph - h.th); } }
        ]
      }
    });
  })();

})();