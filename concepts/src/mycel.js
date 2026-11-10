/* Mycel: a tiny generative engine for the TDS site. Made from scratch.
   Space-colonisation growth, pipe-model thickness, incremental reveal,
   pulses that travel along grown paths. Canvas 2D only. */
var Mycel = (function () {
  'use strict';

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* Grow a tree from roots toward attractors.
     o: {roots:[{x,y}], attractors:[{x,y}], step, kill, reach, iters, rand, jitter, maxNodes} */
  function grow(o) {
    var step = o.step || 6, kill = o.kill || step * 2, reach = o.reach || 80;
    var rand = o.rand || Math.random, jitter = o.jitter == null ? 0.35 : o.jitter;
    var maxNodes = o.maxNodes || 6000;
    var nodes = [];
    var cell = reach, grid = new Map();
    function key(cx, cy) { return cx * 73856093 ^ cy * 19349663; }
    function add(n) {
      n.i = nodes.length; n.kids = 0; nodes.push(n);
      var k = key(Math.floor(n.x / cell), Math.floor(n.y / cell));
      var b = grid.get(k); if (!b) { b = []; grid.set(k, b); } b.push(n);
      return n;
    }
    o.roots.forEach(function (r) { add({ x: r.x, y: r.y, p: -1, t: 0, d: 0 }); });
    var att = o.attractors.map(function (a) { return { x: a.x, y: a.y, alive: true }; });
    var iters = o.iters || 400, order = 1;
    for (var it = 0; it < iters && nodes.length < maxNodes; it++) {
      var pull = new Map(), any = false;
      for (var a = 0; a < att.length; a++) {
        var A = att[a]; if (!A.alive) continue;
        var cx = Math.floor(A.x / cell), cy = Math.floor(A.y / cell);
        var best = null, bd = reach * reach;
        for (var gx = -1; gx <= 1; gx++) for (var gy = -1; gy <= 1; gy++) {
          var b = grid.get(key(cx + gx, cy + gy)); if (!b) continue;
          for (var j = 0; j < b.length; j++) {
            var n = b[j], dx = A.x - n.x, dy = A.y - n.y, dd = dx * dx + dy * dy;
            if (dd < bd) { bd = dd; best = n; }
          }
        }
        if (!best) continue;
        if (bd < kill * kill) { A.alive = false; continue; }
        var l = Math.sqrt(bd), v = pull.get(best);
        if (!v) { v = { x: 0, y: 0, c: 0 }; pull.set(best, v); }
        v.x += (A.x - best.x) / l; v.y += (A.y - best.y) / l; v.c++;
      }
      pull.forEach(function (v, n) {
        var l = Math.hypot(v.x, v.y); if (l < 1e-6) return;
        var ang = Math.atan2(v.y, v.x) + (rand() - 0.5) * jitter;
        // a little inertia from the parent direction makes threads look grown, not drawn
        if (n.p >= 0) {
          var P = nodes[n.p], pa = Math.atan2(n.y - P.y, n.x - P.x);
          var diff = Math.atan2(Math.sin(ang - pa), Math.cos(ang - pa));
          ang = pa + diff * 0.72;
        }
        var s = step * (0.85 + rand() * 0.3);
        add({ x: n.x + Math.cos(ang) * s, y: n.y + Math.sin(ang) * s, p: n.i, t: order++, d: n.d + 1 });
        any = true;
      });
      if (!any) break;
    }
    // pipe model: thickness from descendant count
    for (var i = nodes.length - 1; i >= 0; i--) {
      var N = nodes[i]; N.w = N.w || 1;
      if (N.p >= 0) { nodes[N.p].w = (nodes[N.p].w || 1) + N.w; nodes[N.p].kids++; }
    }
    return nodes;
  }

  function leaves(nodes) { return nodes.filter(function (n) { return n.kids === 0 && n.p >= 0; }); }

  /* Path from a node back to its root, as [{x,y}] from leaf to root. */
  function pathToRoot(nodes, n) {
    var out = [];
    while (n) { out.push({ x: n.x, y: n.y }); n = n.p >= 0 ? nodes[n.p] : null; }
    return out;
  }
  function measure(path) {
    var L = [0];
    for (var i = 1; i < path.length; i++) L.push(L[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
    path.len = L[L.length - 1]; path.L = L; return path;
  }
  function at(path, d) {
    var L = path.L; if (d <= 0) return path[0]; if (d >= path.len) return path[path.length - 1];
    var lo = 0, hi = L.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (L[m] < d) lo = m; else hi = m; }
    var f = (d - L[lo]) / (L[hi] - L[lo] || 1);
    return { x: path[lo].x + (path[hi].x - path[lo].x) * f, y: path[lo].y + (path[hi].y - path[lo].y) * f };
  }

  /* Draw segments whose order lies in [from, to) onto ctx. Additive glow. */
  function drawSegments(ctx, nodes, from, to, style) {
    var maxW = style.maxW || 4, base = style.base || 0.5, k = style.k || 0.42;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'butt';
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i]; if (n.p < 0 || n.t < from || n.t >= to) continue;
        var P = nodes[n.p];
        var w = Math.min(maxW, base + Math.pow(n.w, k) * 0.35);
        var a = style.alpha(n, w);
        if (pass === 0) { ctx.strokeStyle = style.glow; ctx.globalAlpha = a * 0.16; ctx.lineWidth = w * 4.5; }
        else { ctx.strokeStyle = style.color; ctx.globalAlpha = a; ctx.lineWidth = w; }
        // each piece runs midpoint to midpoint, bent through the joint: no gaps, no beads
        var mx = (P.x + n.x) / 2, my = (P.y + n.y) / 2;
        ctx.beginPath();
        if (P.p >= 0) { var G = nodes[P.p]; ctx.moveTo((G.x + P.x) / 2, (G.y + P.y) / 2); ctx.quadraticCurveTo(P.x, P.y, mx, my); }
        else { ctx.moveTo(P.x, P.y); ctx.lineTo(mx, my); }
        if (n.kids === 0) ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function glowDot(ctx, x, y, r, color, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  /* Run a draw loop only while visible on screen and in a visible tab. */
  function loop(el, frame) {
    var onScreen = true, raf = 0, last = 0;
    function tick(t) {
      raf = 0;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      frame(dt, t / 1000);
      schedule();
    }
    function schedule() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(tick); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) { last = 0; schedule(); } }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { last = 0; schedule(); });
    schedule();
  }

  function reducedMotion() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function fit(canvas, maxDpr) {
    var dpr = Math.min(maxDpr || 2, window.devicePixelRatio || 1);
    var r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height, dpr: dpr };
  }

  return { rng: rng, grow: grow, leaves: leaves, pathToRoot: pathToRoot, measure: measure, at: at,
    drawSegments: drawSegments, glowDot: glowDot, loop: loop, reducedMotion: reducedMotion, fit: fit };
})();
