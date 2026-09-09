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

    function draw() {
      var c = parseFloat(C.value), v = parseFloat(V.value);
      $("capE_w").textContent = (0.5 * c * v * v).toFixed(2) + " J";
      $("capE_q").textContent = (c * v).toFixed(2) + " C";
      Plot.draw(cv, {
        xMin: -12, xMax: 12,
        series: [
          { fn: function (x) { return 0.5 * c * x * x; }, color: COL.blue, width: 2.4, fill: "to0", label: "w(v) = ½Cv²" }
        ],
        points: [{ x: v, y: 0.5 * c * v * v, color: COL.amber, r: 6, label: "here", baseline: "bottom" }],
        xLabel: "v (V)", yLabel: "w (J)",
        vLines: v !== 0 ? [{ x: v, color: COL.amber, label: "" }] : []
      });
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 2 & 4. Derivative labs (cap + ind) ---------- */
  function derivLab(opts) {
    var st = { wave: "dc" };
    var waveBtns = Array.prototype.slice.call(document.querySelectorAll(opts.waveEl + " button"));
    waveBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        waveBtns.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        st.wave = b.dataset.wave;
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
      Plot.draw(cv, {
        xMin: 0, xMax: tMax,
        series: series,
        xLabel: "t (s)", yLabel: opts.yIn + " / " + opts.yOut,
        vLines: vLines, points: points
      });
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

    function draw() {
      var l = parseFloat(L.value), i = parseFloat(I.value);
      $("indE_w").textContent = (0.5 * l * i * i).toFixed(2) + " J";
      $("indE_lam").textContent = (l * i).toFixed(2) + " Wb·t";
      Plot.draw(cv, {
        xMin: -10, xMax: 10,
        series: [
          { fn: function (x) { return 0.5 * l * x * x; }, color: COL.violet, width: 2.4, fill: "to0", label: "w(i) = ½Li²" }
        ],
        points: [{ x: i, y: 0.5 * l * i * i, color: COL.amber, r: 6, label: "here", baseline: "bottom" }],
        xLabel: "i (A)", yLabel: "w (J)",
        vLines: i !== 0 ? [{ x: i, color: COL.amber, label: "" }] : []
      });
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 5. Combine C / L lab ---------- */
  (function () {
    var cv = $("comb_plot");
    if (!cv) return;
    var st = { type: "C", top: "series" };

    function seg(id, attr, key) {
      var btns = Array.prototype.slice.call(document.querySelectorAll(id + " button"));
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.classList.remove("on"); });
          b.classList.add("on");
          st[key] = b.dataset[attr];
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

      Plot.draw(cv, {
        xMin: 0.5, xMax: 20,
        series: [
          { fn: function (x) { return eq(c1, x); }, color: COL.blue, width: 2.6, fill: "to0",
            label: "eq value as C₂/L₂ varies" }
        ],
        points: [{ x: c2, y: eq(c1, c2), color: COL.amber, r: 6, label: "current", baseline: "bottom" }],
        hLines: [{ y: c1, color: COL.green, dash: [5, 4], label: "C₁/L₁ = " + c1.toFixed(1) }],
        xLabel: st.type === "C" ? "C₂ (F)" : "L₂ (H)",
        yLabel: "C_eq (F)"
      });
    }
    redrows.push(draw);
    draw();
  })();

})();