/* ============================================================
   plot.js — dependency-free canvas plotter for EEE 133 labs
   ============================================================ */
(function (global) {
  "use strict";

  var DPR = Math.max(1, window.devicePixelRatio || 1);

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function theme() {
    return {
      grid: cssVar("--border") || "#dbe3f0",
      axis: cssVar("--muted") || "#5b6b85",
      text: cssVar("--muted") || "#5b6b85",
      faint: cssVar("--faint") || "#8b98ad",
      surface: cssVar("--surface") || "#ffffff"
    };
  }

  function niceStep(range, target) {
    if (range <= 0) return 1;
    var raw = range / target;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step;
    if (norm < 1.5) step = 1;
    else if (norm < 3) step = 2;
    else if (norm < 7) step = 5;
    else step = 10;
    return step * mag;
  }

  function fmt(v) {
    if (Math.abs(v) < 1e-12) return "0";
    var a = Math.abs(v);
    if (a >= 1000 || a < 0.001) return v.toExponential(1);
    if (a >= 100) return String(Math.round(v * 10) / 10);
    if (a >= 1) return String(Math.round(v * 100) / 100);
    return String(Math.round(v * 1000) / 1000);
  }

  /*
   * cfg = {
   *   series:  [{ fn(t), color, width, dash[], fill:'to0'|y, label, hide }],
   *   xMin, xMax, yMin, yMax,
   *   xLabel, yLabel,
   *   vLines: [{x, label, color, dash}], hLines: [{y, label, color, dash}],
   *   points: [{x, y, color, r, label, align, baseline}],
   *   regions: [{x0, x1, color, alpha}],
   *   legend: true, progress: 0..1 (animate curve drawing)
   * }
   */
  function draw(canvas, cfg) {
    var cssW = canvas.clientWidth || 640;
    var cssH = canvas.clientHeight || Math.round(cssW * 0.52);
    if (!canvas.clientHeight) canvas.style.height = cssH + "px";
    var W = cssW, H = cssH;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var T = theme();
    var pad = { l: 52, r: 14, t: 14, b: 38 };
    var pw = W - pad.l - pad.r;
    var ph = H - pad.t - pad.b;

    // --- ranges ---
    var xMin = cfg.xMin, xMax = cfg.xMax;
    var yMin = cfg.yMin, yMax = cfg.yMax;
    if (yMin == null || yMax == null) {
      var lo = Infinity, hi = -Infinity;
      (cfg.series || []).forEach(function (s) {
        if (s.hide) return;
        for (var t = xMin; t <= xMax + 1e-12; t += (xMax - xMin) / 400) {
          var y = s.fn(t);
          if (y === undefined || y === null || !isFinite(y)) continue;
          if (y < lo) lo = y;
          if (y > hi) hi = y;
        }
      });
      if (cfg.yMin != null) lo = Math.min(lo, cfg.yMin);
      if (cfg.yMax != null) hi = Math.max(hi, cfg.yMax);
      if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
      if (lo === hi) { lo -= 1; hi += 1; }
      var padY = (hi - lo) * 0.12;
      yMin = (cfg.yMin != null) ? cfg.yMin : lo - padY;
      yMax = (cfg.yMax != null) ? cfg.yMax : hi + padY;
    }
    if (yMin > 0 && yMin < (yMax - yMin) * 0.35) yMin = -((yMax - yMin) * 0.06);
    if (yMax < 0 && Math.abs(yMax) < Math.abs(yMin - yMax) * 0.35) yMax = ((yMin - yMax) * 0.06);

    function X(x) { return pad.l + ((x - xMin) / (xMax - xMin)) * pw; }
    function Y(y) { return pad.t + (1 - (y - yMin) / (yMax - yMin)) * ph; }

    // --- regions ---
    (cfg.regions || []).forEach(function (rg) {
      ctx.fillStyle = rg.color || "#3b6ef0";
      ctx.globalAlpha = rg.alpha != null ? rg.alpha : 0.08;
      var x0 = X(Math.max(rg.x0, xMin)), x1 = X(Math.min(rg.x1, xMax));
      ctx.fillRect(x0, pad.t, x1 - x0, ph);
      ctx.globalAlpha = 1;
    });

    // --- grid + ticks ---
    ctx.font = "11.5px " + (cssVar("--mono") || "monospace");
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    var sx = niceStep(xMax - xMin, 8);
    var start = Math.ceil(xMin / sx) * sx;
    for (var gx = start; gx <= xMax + 1e-9; gx += sx) {
      var px = X(gx);
      ctx.strokeStyle = Math.abs(gx) < 1e-12 ? T.axis : T.grid;
      ctx.lineWidth = Math.abs(gx) < 1e-12 ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + ph); ctx.stroke();
      ctx.fillStyle = T.text;
      ctx.fillText(fmt(gx), px, pad.t + ph + 7);
    }
    var sy = niceStep(yMax - yMin, 6);
    var starty = Math.ceil(yMin / sy) * sy;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var gy = starty; gy <= yMax + 1e-9; gy += sy) {
      var py = Y(gy);
      ctx.strokeStyle = Math.abs(gy) < 1e-12 ? T.axis : T.grid;
      ctx.lineWidth = Math.abs(gy) < 1e-12 ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(pad.l + pw, py); ctx.stroke();
      ctx.fillStyle = T.text;
      ctx.fillText(fmt(gy), pad.l - 8, py);
    }

    // axis labels
    ctx.fillStyle = T.text;
    ctx.font = "600 12.5px " + (cssVar("--font") || "sans-serif");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(cfg.xLabel || "", pad.l + pw / 2, H - 4);
    if (cfg.yLabel) {
      ctx.save();
      ctx.translate(12, pad.t + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(cfg.yLabel, 0, 0);
      ctx.restore();
    }

    var clipX = cfg.progress != null ? xMin + (xMax - xMin) * cfg.progress : xMax;

    // --- vLines / hLines (under curves) ---
    function lineLabel(x, y, txt, color, align) {
      ctx.font = "700 11.5px " + (cssVar("--mono") || "monospace");
      ctx.fillStyle = color;
      ctx.textAlign = align || "left";
      ctx.textBaseline = "top";
      ctx.fillText(txt, x, y);
    }
    (cfg.vLines || []).forEach(function (vl) {
      if (vl.x > xMax || vl.x < xMin) return;
      var px = X(vl.x);
      ctx.strokeStyle = vl.color || T.faint;
      ctx.lineWidth = 1.4;
      ctx.setLineDash(vl.dash || [5, 4]);
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + ph); ctx.stroke();
      ctx.setLineDash([]);
      if (vl.label) lineLabel(px + 5, pad.t + 4, vl.label, vl.color || T.faint, "left");
    });
    (cfg.hLines || []).forEach(function (hl) {
      if (hl.y > yMax || hl.y < yMin) return;
      var py = Y(hl.y);
      ctx.strokeStyle = hl.color || T.faint;
      ctx.lineWidth = 1.4;
      ctx.setLineDash(hl.dash || [5, 4]);
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(pad.l + pw, py); ctx.stroke();
      ctx.setLineDash([]);
      if (hl.label) lineLabel(pad.l + 6, py + 5, hl.label, hl.color || T.faint, "left");
    });

    // --- series ---
    (cfg.series || []).forEach(function (s) {
      if (s.hide) return;
      var N = 520;
      var path = [];
      for (var i = 0; i <= N; i++) {
        var t = xMin + ((xMax - xMin) * i) / N;
        if (t > clipX) break;
        var y = s.fn(t);
        if (y == null || !isFinite(y)) continue;
        path.push([X(t), Y(y)]);
      }
      if (path.length < 2) return;

      if (s.fill) {
        var fy = s.fill === "to0" ? Y(Math.max(yMin, Math.min(0, yMax))) : Y(s.fill);
        ctx.beginPath();
        ctx.moveTo(path[0][0], fy);
        path.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
        ctx.lineTo(path[path.length - 1][0], fy);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.fillAlpha != null ? s.fillAlpha : 0.10;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      path.forEach(function (p, i2) { if (i2 === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width || 2.4;
      ctx.lineJoin = "round";
      ctx.setLineDash(s.dash || []);
      ctx.stroke();
      ctx.setLineDash([]);

      if (cfg.progress != null && cfg.progress < 1 && path.length) {
        var lp = path[path.length - 1];
        ctx.beginPath();
        ctx.arc(lp[0], lp[1], 5, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    });

    // --- points ---
    (cfg.points || []).forEach(function (pt) {
      var px = X(pt.x), py = Y(pt.y);
      ctx.beginPath();
      ctx.arc(px, py, pt.r || 4.5, 0, Math.PI * 2);
      ctx.fillStyle = pt.color || "#d97706";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      if (pt.label) {
        ctx.font = "700 11.5px " + (cssVar("--mono") || "monospace");
        ctx.fillStyle = pt.color || "#d97706";
        ctx.textAlign = pt.align || "left";
        ctx.textBaseline = pt.baseline || "bottom";
        ctx.fillText(pt.label, px + (pt.align === "right" ? -7 : 7), py - 7);
      }
    });

    // --- legend ---
    if (cfg.legend !== false) {
      var legendItems = (cfg.series || []).filter(function (s) { return !s.hide && s.label; });
      if (legendItems.length > 1) {
        ctx.font = "600 12px " + (cssVar("--font") || "sans-serif");
        var lw = 0;
        legendItems.forEach(function (s) { lw += ctx.measureText(s.label).width + 34; });
        var lx = pad.l + 8, ly = pad.t + 8;
        ctx.fillStyle = T.surface;
        ctx.globalAlpha = 0.92;
        ctx.fillRect(lx - 6, ly - 4, lw + 8, 22);
        ctx.globalAlpha = 1;
        var cx = lx;
        legendItems.forEach(function (s) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2.6;
          ctx.setLineDash(s.dash || []);
          ctx.beginPath(); ctx.moveTo(cx, ly + 8); ctx.lineTo(cx + 20, ly + 8); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = T.text;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(s.label, cx + 26, ly + 9);
          cx += ctx.measureText(s.label).width + 34;
        });
      }
    }
  }

  /* progressive animation: calls draw with increasing progress */
  function animate(canvas, makeCfg, opts) {
    opts = opts || {};
    var dur = opts.duration || 1400;
    var t0 = null;
    var token = (canvas.__animToken = (canvas.__animToken || 0) + 1);
    function frame(ts) {
      if (canvas.__animToken !== token) return;
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      draw(canvas, makeCfg(eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  global.Plot = { draw: draw, animate: animate, fmt: fmt };
})(window);
