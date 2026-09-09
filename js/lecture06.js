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
      Plot.draw(cv, {
        xMin: 0, xMax: s.tmax,
        series: series,
        xLabel: "t (s)", yLabel: "i (A)"
      });

      /* s-plane: roots against the ω₀ circle and the −α line */
      var m = 1.35 * Math.max(s.w0, s.alpha);
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
      Plot.draw(cv, {
        xMin: 0, xMax: s.tmax,
        series: series,
        xLabel: "t (s)", yLabel: "v (V)"
      });
    }
    redrows.push(draw);
    draw();
  })();

  /* ---------- 3. Undriven LC tank (energy juggle) ---------- */
  (function () {
    var c1 = $("lcVI"), c2 = $("lcEnergy");
    if (!c1 || !c2) return;
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

      Plot.draw(c1, {
        xMin: 0, xMax: 2 * T,
        series: [
          { fn: vC, color: COL.blue, width: 2.4, label: "v_C(t)" },
          { fn: function (t) { return Z * iL(t); }, color: COL.amber, width: 2, label: "i_L(t)·Z₀" }
        ],
        xLabel: "t (s)", yLabel: "volts"
      });

      Plot.draw(c2, {
        xMin: 0, xMax: 2 * T,
        series: [
          { fn: function (t) { return 0.5 * c * vC(t) * vC(t); },
            color: COL.blue, width: 2.2, fill: "to0", label: "w_C = ½Cv²" },
          { fn: function (t) { return 0.5 * l * iL(t) * iL(t); },
            color: COL.green, width: 2.2, fill: "to0", label: "w_L = ½Li²" }
        ],
        hLines: W > 0 ? [{ y: W, color: COL.amber, dash: [4, 4], label: "W total (constant)" }] : [],
        xLabel: "t (s)", yLabel: "w (J)"
      });
    }
    redrows.push(draw);
    draw();
  })();

})();