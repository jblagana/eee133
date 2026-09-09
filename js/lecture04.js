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

    function draw() {
      var x0 = parseFloat(X0.value), xinf = parseFloat(Xinf.value), tau = parseFloat(Tau.value);
      function x(t) { return xinf + (x0 - xinf) * Math.exp(-t / tau); }
      $("rbXtau").textContent = x(tau).toFixed(2);
      $("rbX5").textContent = x(5 * tau).toFixed(2);
      $("rbSwing").textContent = Math.abs(x0 - xinf).toFixed(1);

      Plot.draw(cv, {
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
      });
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 2. Step sketcher ---------- */
  (function () {
    var cv = $("stepPlot");
    if (!cv) return;
    var st = { pulse: false };
    var btns = Array.prototype.slice.call(document.querySelectorAll("#stepPulse button"));
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        st.pulse = b.dataset.pulse === "1";
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

      Plot.draw(cv, {
        xMin: xMin, xMax: xMax,
        series: series,
        xLabel: "t (s)", yLabel: "v (V)",
        vLines: vLines, legend: false
      });
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
      Plot.draw(cv, {
        xMin: 0, xMax: xMax,
        series: [
          { fn: vIn, color: COL.green, width: 1.8, dash: [6, 4], label: "input pulse" },
          { fn: vOut, color: COL.blue, width: 2.6, fill: "to0", label: "v_C(t)" }
        ],
        xLabel: "t (s)", yLabel: "v (V)",
        vLines: [{ x: tpSec, color: COL.amber, dash: [4, 4], label: "tₚ" }],
        points: [{ x: tpSec, y: vtp, color: COL.amber, r: 5.5, label: "v(tₚ) = " + vtp.toFixed(1) + " V" }],
        regions: [{ x0: 0, x1: tpSec, color: COL.green, alpha: 0.05 }]
      });
    }
    redrows.push(draw);
    draw();
  })();

})();