/* ============================================================
   circsim.js — Falstad-style live circuit simulator for the
   EEE 133 interactive lecture site.

   - MNA solver, backward-Euler time stepping
   - animated schematic renderer (wires, current-flow dots, live
     polarity, animated switch blades, theme-aware grid)
   - rolling scope, control sliders/segments, readouts

   Create one with:  window.CircSim.mount(el, spec)

   spec = { id, icon, title, sub, note, w, h, dt, spf, flow,
            solve (false → analytic scope only),
            controls: [{type:"range",id,label,min,max,step,value,fmt},
                       {type:"seg",id,label,value,options:[{v,label}]}],
            build: fn(ctrl) → { branches, wires, comps, gnds, probes },
            init:  fn(ctrl) → {C:{"C|a|b":v}, L:{"L|a|b":i}},
            readouts: [{id,label,hl,get: fn(sim,ctrl)→text}],
            scope: {window, traces:[{label,color,get: fn(sim)→v}]} }

   branches: {id,type:"R",a,b,r} {id,type:"C",a,b,c} {id,type:"L",a,b,l}
             {id,type:"V",a,b,v: number|fn(t)} {id,type:"I",a,b,i:number|fn(t)}
             {id,type:"SW",a,b,closed}   // + at a; I flows a→b
   State (C voltages / L currents) is keyed by branch id, so specs keep
   ids stable across topology toggles to carry stored energy over.
   ============================================================ */
(function () {
  "use strict";
  if (window.CircSim) return;

  /* ================= MNA solver (backward Euler) ================= */

  function gauss(A, b) {
    var n = b.length, i, j, k;
    for (k = 0; k < n; k++) {
      var p = k, am = Math.abs(A[k][k]);
      for (i = k + 1; i < n; i++) {
        if (Math.abs(A[i][k]) > am) { am = Math.abs(A[i][k]); p = i; }
      }
      if (am < 1e-14) return null;
      if (p !== k) {
        var tmp = A[k]; A[k] = A[p]; A[p] = tmp;
        var tb = b[k]; b[k] = b[p]; b[p] = tb;
      }
      for (i = k + 1; i < n; i++) {
        var f = A[i][k] / A[k][k];
        if (f === 0) continue;
        for (j = k; j < n; j++) A[i][j] -= f * A[k][j];
        b[i] -= f * b[k];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = b[i];
      for (j = i + 1; j < n; j++) s -= A[i][j] * x[j];
      x[i] = s / A[i][i];
    }
    return x;
  }

  /* One time step. mutates branch.i (a→b) and state; returns ok. */
  function step(circ, state, dt) {
    var t = state.t + dt;
    var n = circ.nodes.length, i, k, br;
    var idx = {};
    for (i = 0; i < n; i++) idx[circ.nodes[i]] = i;
    var gnd = idx["g"] !== undefined ? idx["g"] : 0;

    var uN = new Array(n), uOff = {}, m = 0;
    for (i = 0; i < n; i++) uN[i] = (i === gnd) ? -1 : m++;
    for (k = 0; k < circ.branches.length; k++) {
      br = circ.branches[k];
      if (br.type === "L" || br.type === "V") uOff[br.id] = m++;
    }
    var size = m;
    var A = [], b = [];
    for (i = 0; i < size; i++) { A.push(new Array(size).fill(0)); b.push(0); }
    function stamp(ri, ci, v) { if (ri >= 0 && ci >= 0) A[ri][ci] += v; }

    for (k = 0; k < circ.branches.length; k++) {
      br = circ.branches[k];
      var ia = uN[idx[br.a]], ib = uN[idx[br.b]];
      if (br.type === "R") {
        var g = 1 / br.r;
        stamp(ia, ia, g); stamp(ia, ib, -g); stamp(ib, ia, -g); stamp(ib, ib, g);
      } else if (br.type === "C") {
        var gc = br.c / dt, vp = state.C[br.id] || 0;
        stamp(ia, ia, gc); stamp(ia, ib, -gc); stamp(ib, ia, -gc); stamp(ib, ib, gc);
        if (ia >= 0) b[ia] += gc * vp;
        if (ib >= 0) b[ib] -= gc * vp;
      } else if (br.type === "L") {
        /* i is an unknown; V_a - V_b = (L/dt)(i - i_prev).
           (No dt/L conductance stamp — that would double-count i.) */
        var ip = state.L[br.id] || 0;
        var ul = uOff[br.id];
        stamp(ia, ul, 1); stamp(ib, ul, -1);
        A[ul][ia] += 1; A[ul][ib] += -1; A[ul][ul] += -br.l / dt;
        b[ul] -= (br.l / dt) * ip;
      } else if (br.type === "V") {
        var vs = (typeof br.v === "function") ? br.v(t) : br.v;
        var uv = uOff[br.id];
        stamp(ia, uv, 1); stamp(ib, uv, -1);
        A[uv][ia] += 1; A[uv][ib] += -1;
        b[uv] += vs;
      } else if (br.type === "I") {
        var is = (typeof br.i === "function") ? br.i(t) : br.i;
        if (ia >= 0) b[ia] -= is;
        if (ib >= 0) b[ib] += is;
      }
    }

    var x = gauss(A, b);
    if (!x) return false;
    var V = {};
    for (i = 0; i < n; i++) V[circ.nodes[i]] = (i === gnd) ? 0 : x[uN[i]];

    for (k = 0; k < circ.branches.length; k++) {
      br = circ.branches[k];
      var va = V[br.a], vb = V[br.b];
      if (br.type === "R") {
        br.i = (va - vb) / br.r;
      } else if (br.type === "C") {
        br.i = (br.c / dt) * ((va - vb) - (state.C[br.id] || 0));
        state.C[br.id] = va - vb;
      } else if (br.type === "L") {
        br.i = x[uOff[br.id]];
        state.L[br.id] = br.i;
      } else if (br.type === "V") {
        br.i = x[uOff[br.id]];
      } else if (br.type === "I") {
        br.i = (typeof br.i === "function") ? br.i(t) : br.i;
      }
      br.va = va; br.vb = vb;
    }
    state.V = V;
    state.t = t;
    return true;
  }

  /* Expand a build() result: SW closed → 1 mΩ, open → gone. */
  function expand(res) {
    var names = ["g"], seen = { g: true }, branches = [], i, br;
    for (i = 0; i < res.branches.length; i++) {
      br = res.branches[i];
      if (br.type === "SW") {
        if (br.closed) branches.push({ id: br.id, type: "R", a: br.a, b: br.b, r: 1e-3 });
        continue;
      }
      branches.push(br);
      if (!seen[br.a]) { names.push(br.a); seen[br.a] = true; }
      if (!seen[br.b]) { names.push(br.b); seen[br.b] = true; }
    }
    return { nodes: names, branches: branches };
  }

  /* ================= theme-aware colors ================= */

  var themeCache = null, themeVal = null;
  function theme() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (themeCache !== dark) {
      themeVal = dark
        ? { bg: "#0b1120", grid: "#182238", wire: "#93a9dd", dot: "#74abff",
            txt: "#dbe6fb", txtDim: "#8fa3cc", sym: "#c9d8f7", symDim: "#7286ad",
            badgeBg: "rgba(21,28,48,.92)", badgeBd: "#2a3654", hi: "#74abff",
            accent: "#5b8bf0" }
        : { bg: "#fbfcfe", grid: "#e9eef7", wire: "#33415c", dot: "#2453d6",
            txt: "#101828", txtDim: "#5b6b85", sym: "#1f2b45", symDim: "#8b98ad",
            badgeBg: "rgba(255,255,255,.92)", badgeBd: "#dbe3f0", hi: "#2453d6",
            accent: "#2453d6" };
      themeCache = dark;
    }
    return themeVal;
  }

  /* ================= drawing helpers ================= */

  function prepCanvas(cv, w, h) {
    cv._w = w; cv._h = h;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawGrid(ctx, w, h) {
    var T = theme();
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = T.grid;
    ctx.lineWidth = 1;
    var s = 24, x, y;
    ctx.beginPath();
    for (x = s; x < w; x += s) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
    for (y = s; y < h; y += s) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
    ctx.stroke();
  }

  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  /* current-flow dots along a polyline; speed ∝ branch current */
  function drawDots(ctx, pts, cur, flowK, t) {
    if (!cur || Math.abs(cur) < 1e-5) return;
    var T = theme();
    var spacing = 15, speed = cur * flowK;               /* px/s */
    var total = 0, segs = [], i;
    for (i = 0; i < pts.length - 1; i++) {
      var dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
      var len = Math.sqrt(dx * dx + dy * dy);
      segs.push({ x: pts[i][0], y: pts[i][1], dx: dx / len, dy: dy / len, len: len });
      total += len;
    }
    if (total < 4) return;
    var off = ((t * speed) % spacing + spacing) % spacing;
    ctx.fillStyle = T.dot;
    var pos;
    for (pos = off; pos < total; pos += spacing) {
      var d = pos, si = 0;
      while (si < segs.length - 1 && d > segs[si].len) { d -= segs[si].len; si++; }
      var s = segs[si];
      var px = s.x + s.dx * d, py = s.y + s.dy * d;
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, 6.2832);
      ctx.fill();
    }
  }

  var MONO = '"Cascadia Code","SF Mono",Consolas,"Roboto Mono",monospace';

  /* ================= component symbols =================
     comp: {type, id, x, y, o:"h"|"v", closed, label, lx, ly, ls} */

  function drawComp(ctx, c, sim) {
    var T = theme(), x = c.x, y = c.y, h = c.o === "h", i, b;
    ctx.save();
    ctx.translate(x, y);
    if (!h) ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = T.sym;
    ctx.fillStyle = T.sym;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (c.type === "R") {
      var z = [[-22, 0], [-15, 0], [-13, -5.5], [-9, 5.5], [-5, -5.5],
               [-1, 5.5], [3, -5.5], [7, 5.5], [11, -5.5], [15, 0], [22, 0]];
      ctx.beginPath();
      ctx.moveTo(z[0][0], z[0][1]);
      for (i = 1; i < z.length; i++) ctx.lineTo(z[i][0], z[i][1]);
      ctx.stroke();
    } else if (c.type === "C") {
      b = sim.branches[c.id];
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(-4.5, -9); ctx.lineTo(-4.5, 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4.5, -9); ctx.lineTo(4.5, 9); ctx.stroke();
      if (b) {
        var pos1 = (b.va || 0) > (b.vb || 0);
        ctx.font = "800 11px " + MONO;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = T.hi;
        ctx.fillText(pos1 ? "+" : "\u2212", -11, 3.5);
        ctx.fillStyle = T.symDim;
        ctx.fillText(pos1 ? "\u2212" : "+", 11, 3.5);
      }
    } else if (c.type === "L") {
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-22, 0); ctx.lineTo(-17, 0);
      for (i = 0; i < 4; i++) ctx.arc(-17 + i * 10, 0, 5, Math.PI, 0, false);
      ctx.moveTo(17, 0); ctx.lineTo(22, 0);
      ctx.stroke();
    } else if (c.type === "V") {
      b = sim.branches[c.id];
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.2832); ctx.stroke();
      var hiP = b ? (b.va !== undefined && b.va >= b.vb) : true;
      ctx.font = "800 13px " + MONO;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = T.hi;
      ctx.fillText(hiP ? "+" : "\u2212", 0, hiP ? -8 : 8);
      ctx.fillStyle = T.symDim;
      ctx.fillText(hiP ? "\u2212" : "+", 0, hiP ? 8 : -8);
    } else if (c.type === "SW") {
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(-18, 0, 3.2, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(18, 0, 3.2, 0, 6.2832); ctx.fill();
      if (c.sw === undefined) c.sw = c.closed ? 0 : 0.62;
      var target = c.closed ? 0 : 0.62;
      c.sw += (target - c.sw) * 0.25;
      if (Math.abs(c.sw - target) < 0.004) c.sw = target;
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = c.closed ? T.hi : T.sym;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-18 + 36 * Math.cos(c.sw), -36 * Math.sin(c.sw));
      ctx.stroke();
    }
    ctx.restore();

    if (c.label) {
      var ty = (c.ly !== undefined) ? c.ly : (y - 24);
      ctx.font = "700 12.5px " + MONO;
      ctx.fillStyle = T.txt;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(c.label, c.lx || x, ty);
      if (c.ls) {
        ctx.font = "600 11.5px " + MONO;
        ctx.fillStyle = T.txtDim;
        ctx.fillText(c.ls, c.lx || x, ty + 14);
      }
    }
  }

  /* ================= rolling scope ================= */

  function scopeWin(spec, simApi) {
    return typeof spec.scope.window === "function"
      ? spec.scope.window(simApi) : spec.scope.window;
  }

  function pushScope(simApi, spec) {
    if (!simApi.scopeBuf) {
      simApi.scopeBuf = { t: [], v: [] };
      for (var i = 0; i < spec.scope.traces.length; i++) simApi.scopeBuf.v.push([]);
    }
    var buf = simApi.scopeBuf;
    for (i = 0; i < spec.scope.traces.length; i++) {
      buf.v[i].push(spec.scope.traces[i].get(simApi));
    }
    buf.t.push(simApi.t);
    var keep = Math.ceil(scopeWin(spec, simApi) / Math.max(spec.dt, 1e-9)) + 4;
    while (buf.t.length > keep) {
      buf.t.shift();
      for (i = 0; i < buf.v.length; i++) buf.v[i].shift();
    }
  }

  function drawScope(cv, spec, simApi, phase0) {
    var w = cv._w || spec.w || 720, h = cv._h || (spec.scope.h || 160);
    var ctx = prepCanvas(cv, w, h);
    var T = theme();
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
    var gs = 22, x, y;
    ctx.beginPath();
    for (x = gs; x < w; x += gs) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
    for (y = gs; y < h; y += gs) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
    ctx.stroke();

    var mid = h / 2, n, i;
    var ampP = typeof spec.scope.amp === "function"
      ? spec.scope.amp(simApi) : (spec.scope.amp || 1);
    if (spec.solve === false) {
      /* phase mode: x-axis = 2 input cycles, traces scroll */
      ctx.strokeStyle = T.wire; ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      ctx.globalAlpha = 1;
      var X2 = Math.PI * 4;
      for (i = 0; i < spec.scope.traces.length; i++) {
        var tr = spec.scope.traces[i];
        ctx.strokeStyle = tr.color;
        ctx.lineWidth = tr.dim ? 1.6 : 2.2;
        ctx.setLineDash(tr.dim ? [5, 4] : []);
        ctx.beginPath();
        var steps = 160;
        for (n = 0; n <= steps; n++) {
          var ph = (n / steps) * X2;
          var val = tr.get({ t: phase0, _ph: ph, ctrl: simApi.ctrl });
          var yy = mid - (val / ampP) * (h / 2 - 18);
          if (n === 0) ctx.moveTo(0, yy);
          else ctx.lineTo((n / steps) * w, yy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      /* rolling time window */
      var buf = simApi.scopeBuf;
      var amp0 = typeof spec.scope.amp === "function"
        ? spec.scope.amp(simApi) : (spec.scope.amp || 1);
      var vmax = amp0;
      if (buf) {
        for (i = 0; i < buf.v.length; i++) {
          var a = buf.v[i];
          for (n = 0; n < a.length; n++) {
            var av = Math.abs(a[n]);
            if (av > vmax) vmax = av;
          }
        }
      }
      vmax = Math.max(vmax, 1);
      ctx.strokeStyle = T.wire; ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      ctx.globalAlpha = 1;
      if (buf && buf.t.length > 1) {
        var t1 = buf.t[buf.t.length - 1];
        var win = scopeWin(spec, simApi);
        var t0 = t1 - win;
        for (i = 0; i < buf.v.length; i++) {
          ctx.strokeStyle = spec.scope.traces[i].color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          var started = false;
          for (n = 0; n < buf.t.length; n++) {
            if (buf.t[n] < t0) continue;
            var xx = ((buf.t[n] - t0) / win) * w;
            var yv = mid - (buf.v[i][n] / vmax) * (h / 2 - 14);
            if (!started) { ctx.moveTo(xx, yv); started = true; }
            else ctx.lineTo(xx, yv);
          }
          ctx.stroke();
        }
      }
    }

    /* legend */
    ctx.font = "700 11px " + MONO;
    var ly = 14, lx = 10;
    for (i = 0; i < spec.scope.traces.length; i++) {
      var tr2 = spec.scope.traces[i];
      ctx.fillStyle = tr2.color;
      ctx.fillRect(lx, ly - 8, 14, 4);
      ctx.fillStyle = T.txtDim;
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(tr2.label, lx + 20, ly - 5);
      ly += 16;
    }
  }

  function drawGnd(ctx, x, y) {
    var T = theme();
    ctx.strokeStyle = T.sym;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y + 12);
    ctx.moveTo(x - 11, y + 12); ctx.lineTo(x + 11, y + 12);
    ctx.moveTo(x - 7, y + 18); ctx.lineTo(x + 7, y + 18);
    ctx.moveTo(x - 3, y + 24); ctx.lineTo(x + 3, y + 24);
    ctx.stroke();
  }

  /* small rounded-rect probe badge with a live value */
  function drawProbe(ctx, p, text) {
    var T = theme();
    ctx.font = "700 11.5px " + MONO;
    var w = Math.max(52, Math.max(ctx.measureText(p.label).width,
                                  ctx.measureText(text).width) + 16), hgt = 34;
    var x = p.x - w / 2, y = p.y - hgt / 2;
    ctx.fillStyle = T.badgeBg;
    ctx.strokeStyle = T.badgeBd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, hgt, 8);
    else ctx.rect(x, y, w, hgt);
    ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = T.txtDim;
    ctx.font = "600 10px " + MONO;
    ctx.fillText(p.label, p.x, y + 9.5);
    ctx.fillStyle = T.hi;
    ctx.font = "800 12.5px " + MONO;
    ctx.fillText(text, p.x, y + 22.5);
  }

  /* ================= sim core ================= */

  function fmtT(t) {
    if (t < 1e-3) return (t * 1e6).toFixed(0) + " µs";
    if (t < 1) return (t * 1e3).toFixed(1) + " ms";
    return t.toFixed(2) + " s";
  }

  function makeSim(spec) {
    var ctrl = {}, i;
    for (i = 0; i < spec.controls.length; i++) {
      var c0 = spec.controls[i];
      ctrl[c0.id] = (c0.type === "range") ? parseFloat(c0.value) : c0.value;
    }

    var dirty = true, circ = null, layout = null, branchesById = {};
    var state = { t: 0, V: { g: 0 }, C: {}, L: {} };
    var running = true, speed = spec.speed0 || 1, acc = 0, phase0 = 0;
    var scopeBuf = null, lastNow = null, frameSkip = 0, visible = true;
    var dom = null;

    function rebuild() {
      layout = spec.build(ctrl);
      circ = expand(layout);
      branchesById = {};
      for (var k = 0; k < circ.branches.length; k++) branchesById[circ.branches[k].id] = circ.branches[k];
    }

    function reset() {
      state = { t: 0, V: { g: 0 }, C: {}, L: {} };
      if (spec.init) {
        var init = spec.init(ctrl);
        if (init && init.C) for (var k in init.C) state.C[k] = init.C[k];
        if (init && init.L) for (k in init.L) state.L[k] = init.L[k];
      }
      scopeBuf = null;
      simApi.scopeBuf = null;
      dirty = true;
    }

    var simApi = {
      spec: spec, ctrl: ctrl, t: 0, V: null, C: null, L: null,
      branches: null, scopeBuf: null, _ph: 0
    };

    function advance() {
      if (spec.solve === false) { phase0 += 1.5 / 60; simApi.t = phase0; return; }
      acc += spec.spf * speed;
      var n = Math.floor(acc);
      if (n > 500) n = 500;
      acc -= n;
      for (var s = 0; s < n; s++) {
        if (!step(circ, state, spec.dt)) break;
        if (spec.scope) pushScope(simApi, spec);
      }
      simApi.t = state.t;
    }

    function render() {
      var w = spec.w || 720, h = spec.h || 360;
      var ctx = prepCanvas(dom.canvas, w, h);
      drawGrid(ctx, w, h);
      var T = theme();
      ctx.strokeStyle = T.wire;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      var k;
      for (k = 0; k < layout.wires.length; k++) poly(ctx, layout.wires[k].pts);
      for (k = 0; k < layout.wires.length; k++) {
        var wr = layout.wires[k];
        var bb = branchesById[wr.id];
        var cur = bb ? bb.i : (wr.cur ? wr.cur(simApi) : 0);
        drawDots(ctx, wr.pts, cur, spec.flow || 4000, simApi.t);
      }
      for (k = 0; k < layout.comps.length; k++) drawComp(ctx, layout.comps[k], simApi);
      for (k = 0; k < layout.gnds.length; k++) drawGnd(ctx, layout.gnds[k][0], layout.gnds[k][1]);
      for (k = 0; k < layout.probes.length; k++) {
        var p = layout.probes[k];
        drawProbe(ctx, p, p.get(simApi, ctrl));
      }
      if (spec.scope) drawScope(dom.scope, spec, simApi, phase0);
    }

    function updateReadouts() {
      for (var r = 0; r < spec.readouts.length; r++) {
        var ro = spec.readouts[r];
        dom.readoutEls[r].textContent = ro.get(simApi, ctrl);
      }
      dom.timeEl.textContent = "t = " + (spec.solve === false ? "steady state" : fmtT(simApi.t));
    }

    function frame(now) {
      dom.raf = requestAnimationFrame(frame);
      if (!visible) { lastNow = null; return; }
      if (lastNow === null) { lastNow = now; return; }
      var dts = (now - lastNow) / 1000;
      lastNow = now;
      if (dts > 0.25) dts = 0.25;
      if (dirty) { rebuild(); dirty = false; simApi.branches = branchesById; }
      simApi.C = state.C; simApi.L = state.L; simApi.V = state.V;
      simApi.scopeBuf = scopeBuf;
      if (running) advance();
      frameSkip = (frameSkip + 1) % 2;
      if (frameSkip === 0) { render(); updateReadouts(); }
    }

    function setVisible(v) { visible = v; if (v) lastNow = null; }
    function setRunning(r) { running = r; dom.runBtn.textContent = r ? "⏸  Pause" : "▶  Run"; }
    function setSpeed(s) { speed = s; }

    return {
      api: simApi, ctrl: ctrl,
      init: function (domRefs) {
        dom = domRefs;
        reset();
        rebuild();
        simApi.branches = branchesById;
        if ("IntersectionObserver" in window) {
          var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) { setVisible(e.isIntersecting); });
          }, { rootMargin: "80px" });
          io.observe(dom.canvas);
        }
        dom.raf = requestAnimationFrame(frame);
      },
      markDirty: function () { dirty = true; },
      setRunning: setRunning, setSpeed: setSpeed,
      reset: function () { reset(); }
    };
  }

  /* ================= DOM + mount ================= */

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  /* auto-scaled value: 1500 -> "1.50 k", 0.001 -> "1.00 m" */
  function fmtSI(v, unit) {
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M" + unit;
    if (a >= 1e3) return (v / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "k" + unit;
    if (a > 0 && a < 0.001) return (v * 1e6).toFixed(a < 1e-5 ? 0 : 1) + "µ" + unit;
    return v.toFixed(a < 0.1 ? 2 : 1) + unit;
  }

  function mount(root, spec) {
    var sim = makeSim(spec);
    var readoutEls = [];
    var refs = { inputs: {}, vals: {} };   /* live control DOM, for spec.onChange */

    /* ---- head ---- */
    var head = el("div", "sim-head");
    head.appendChild(el("div", "sim-ico", spec.icon || "⚡"));
    var tt = el("div", "sim-tt");
    tt.appendChild(el("div", "t", spec.title));
    tt.appendChild(el("div", "s", spec.sub));
    head.appendChild(tt);
    var live = el("span", "sim-live");
    live.appendChild(el("i"));
    live.appendChild(document.createTextNode("LIVE"));
    head.appendChild(live);
    root.appendChild(head);

    /* ---- bench (canvas + toolbar) ---- */
    var bench = el("div", "sim-bench");
    var toolbar = el("div", "sim-toolbar");
    var runBtn = el("button", "sim-btn", "⏸  Pause");
    runBtn.type = "button";
    var resetBtn = el("button", "sim-btn", "↺  Reset");
    resetBtn.type = "button";
    toolbar.appendChild(runBtn);
    toolbar.appendChild(resetBtn);

    var speedSeg = el("span", "seg sim-speed");
    var SPEEDS = [[0.5, "½×"], [1, "1×"], [2, "2×"], [4, "4×"]];
    SPEEDS.forEach(function (s) {
      var b = el("button", null, s[1]);
      b.type = "button";
      if (s[0] === (spec.speed0 || 1)) b.className = "on";
      b.addEventListener("click", function () {
        sim.setSpeed(s[0]);
        speedSeg.querySelectorAll("button").forEach(function (x) { x.className = ""; });
        b.className = "on";
      });
      speedSeg.appendChild(b);
    });
    toolbar.appendChild(speedSeg);
    var timeEl = el("span", "sim-time", "t = 0 µs");
    toolbar.appendChild(timeEl);
    bench.appendChild(toolbar);

    var canvas = el("canvas", "sim-canvas");
    canvas.setAttribute("aria-label", spec.title + " — animated circuit");
    bench.appendChild(canvas);
    var scopeCv = null;
    if (spec.scope) {
      scopeCv = el("canvas", "sim-scope");
      scopeCv._w = spec.w || 720;
      scopeCv._h = spec.scope.h || 160;
      scopeCv.setAttribute("aria-label", "oscilloscope trace");
      bench.appendChild(scopeCv);
    }
    root.appendChild(bench);

    /* ---- controls + readouts ---- */
    var foot = el("div", "sim-foot");
    var ctrls = el("div", "sim-ctrls");
    spec.controls.forEach(function (c) {
      var wrap = el("div", "ctl");
      var top = el("div", "ctl-top");
      top.appendChild(el("label", null, c.label));
      if (c.type === "range") {
        var val = el("span", "val", c.fmt ? c.fmt(parseFloat(c.value)) : c.value);
        top.appendChild(val);
        var inp = document.createElement("input");
        inp.type = "range";
        inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = c.value;
        inp.addEventListener("input", function () {
          var v = parseFloat(inp.value);
          val.textContent = c.fmt ? c.fmt(v) : v;
          sim.markDirty();
          if (spec.onChange) spec.onChange(c.id, v, refs);
        });
        refs.inputs[c.id] = inp;
        refs.vals[c.id] = val;
        wrap.appendChild(top);
        wrap.appendChild(inp);
      } else {
        var seg = el("div", "seg");
        c.options.forEach(function (o) {
          var b = el("button", String(c.value) === String(o.v) ? "on" : "", o.label);
          b.type = "button";
          b.addEventListener("click", function () {
            sim.ctrl[c.id] = o.v;
            sim.markDirty();
            seg.querySelectorAll("button").forEach(function (x) { x.className = ""; });
            b.className = "on";
            if (spec.onChange) spec.onChange(c.id, o.v, refs);
          });
          seg.appendChild(b);
        });
        wrap.appendChild(top);
        wrap.appendChild(seg);
      }
      ctrls.appendChild(wrap);
    });
    foot.appendChild(ctrls);

    var roWrap = el("div", "readouts");
    spec.readouts.forEach(function (ro) {
      var d = el("div", "readout" + (ro.hl ? " hl" : ""));
      d.appendChild(el("div", "k", ro.label));
      var v = el("div", "v", "—");
      d.appendChild(v);
      readoutEls.push(v);
      roWrap.appendChild(d);
    });
    foot.appendChild(roWrap);
    root.appendChild(foot);

    if (spec.note) root.appendChild(el("p", "sim-note", spec.note));

    /* ---- wire buttons + start ---- */
    runBtn.addEventListener("click", function () {
      sim.setRunning(runBtn.textContent.indexOf("Pause") === -1);
    });
    resetBtn.addEventListener("click", function () { sim.reset(); });

    sim.init({ canvas: canvas, scope: scopeCv, runBtn: runBtn, timeEl: timeEl, readoutEls: readoutEls });
    return sim;
  }

  window.CircSim = { mount: mount, fmtSI: fmtSI, fmtT: fmtT, _step: step, _expand: expand };
})();
