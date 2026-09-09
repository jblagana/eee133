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

      Plot.draw(cv, {
        xMin: 0, xMax: xMax,
        series: series,
        xLabel: cfg.xLabel, yLabel: cfg.yLabel,
        vLines: tauLines(tau), hLines: hLines, points: points,
        legend: false
      });
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