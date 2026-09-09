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