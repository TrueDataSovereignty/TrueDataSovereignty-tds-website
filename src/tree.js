/* The hero: the logo, alive. Branches above a gold ground line, roots below it.
   Small balls come in along the branches, meet the line, and leave along the roots, or stay.
   No words in the picture. Ink on paper: no glow. Needs Mycel. */
function MycelTree(cv, opts) {
  'use strict';
  opts = opts || {};
  var MARINE = [16, 26, 61], GOLD = [221, 176, 74], DEEP = [184, 134, 43], PAPER = '#FAFAF8';
  var reduced = Mycel.reducedMotion() || opts.still;
  var S, w, h, portrait, x, lineY, U, R, RYb, RYt, topO, botO, nets, inP, outP, stat, sctx, t0 = 0, balls, ripples, keeps, lastSpawn = 0, lastPoke = 0, lastW = 0, grownAt = null;
  function mix(a, b, t) { t = Math.max(0, Math.min(1, t)); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
  function grad(e) { var t = (e - 0.3) / 0.7; return t < 0.6 ? mix(MARINE, DEEP, t / 0.6) : mix(DEEP, GOLD, (t - 0.6) / 0.4); }
  var NAVY = mix(MARINE, MARINE, 0), GOLDC = mix(GOLD, GOLD, 0);

  /* The same fan the logo is made of (same seeds), so the hero tree is the logo, grown large. */
  function fan(c, Rx, Ry, dir, n, seed) {
    var rand = Mycel.rng(seed), A = [], i;
    for (i = 0; i < n; i++) { var a = Math.PI * (0.04 + 0.92 * rand()), r = 0.3 + 0.7 * Math.pow(rand(), 0.55); A.push({ x: c.x + Math.cos(a) * r * Rx, y: c.y + dir * (1.5 * U + Math.sin(a) * r * Ry) }); }
    return Mycel.grow({ roots: [{ x: c.x - 2.4 * U, y: c.y }, { x: c.x, y: c.y }, { x: c.x + 2.4 * U, y: c.y }], attractors: A, step: 1.5 * U, reach: 22 * U, kill: 2.9 * U, rand: rand, iters: 600, jitter: 0.5 });
  }
  /* Fine threads that grow out of the bold ones: the hair of the mycelium. */
  function hair(main, c, Rx, Ry, dir, n, seed) {
    var rand = Mycel.rng(seed), A = [], roots = [], i;
    for (i = 0; i < n; i++) { var a = Math.PI * (0.02 + 0.96 * rand()), r = 0.25 + 0.85 * Math.pow(rand(), 0.6); A.push({ x: c.x + Math.cos(a) * r * Rx * 1.12, y: c.y + dir * (1.5 * U + Math.sin(a) * r * Ry * 1.1) }); }
    for (i = 4; i < main.length; i += 3) roots.push({ x: main[i].x, y: main[i].y });
    return Mycel.grow({ roots: roots, attractors: A, step: 1.05 * U, reach: 8 * U, kill: 1.5 * U, rand: rand, iters: 500, jitter: 0.95, maxNodes: 9000 });
  }
  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; lastW = w; portrait = w < 760;
    lineY = portrait ? 216 : Math.round(h * (opts.line || 0.56));
    x = portrait ? w * 0.5 : w * 0.72;
    R = portrait ? Math.min(w * 0.42, 170) : Math.min(w * 0.25, 390);
    U = Math.min(R / 45, (h - lineY - 78) / 49, (lineY - (portrait ? 64 : 84)) / 46); R = 45 * U; RYb = 37 * U; RYt = 34 * U;
    topO = { x: x, y: lineY - 10.5 * U }; botO = { x: x, y: lineY + 10.5 * U };
    var up = fan(topO, R * 0.86, RYt, -1, 44, 52), down = fan(botO, R, RYb, 1, 70, 34);
    nets = [
      { n: up, c: topO, Ry: RYt, bold: true, col: function () { return NAVY; }, delay: 0.2, dur: 2.6 },
      { n: down, c: botO, Ry: RYb, bold: true, col: function () { return NAVY; }, delay: 0.5, dur: 2.9 },
      { n: hair(up, topO, R * 0.86, RYt, -1, portrait ? 220 : 520, 913), c: topO, Ry: RYt, bold: false, col: function () { return NAVY; }, delay: 2.4, dur: 3.4 },
      { n: hair(down, botO, R, RYb, 1, portrait ? 320 : 820, 477), c: botO, Ry: RYb, bold: false, col: function () { return NAVY; }, delay: 2.8, dur: 3.8 }
    ];
    nets.forEach(function (N) { N.done = 0; });
    function P(nodes, min, rev) { return Mycel.leaves(nodes).map(function (n) { var p = Mycel.pathToRoot(nodes, n); if (rev) p.reverse(); return Mycel.measure(p); }).filter(function (p) { return p.len > min; }); }
    inP = P(up, 12 * U, false); outP = P(down, 14 * U, true);
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    sctx = stat.getContext('2d'); sctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    balls = []; ripples = []; keeps = []; t0 = 0; grownAt = null;
  }
  function strokeRange(ctx, N, from, to) {
    var net = N.n; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = Math.max(0, from); i < Math.min(net.length, to); i++) {
      var n = net[i]; if (n.p < 0) continue; var P = net[n.p];
      var e = Math.min(1, Math.hypot((n.x - N.c.x) / R, (n.y - N.c.y) / N.Ry));
      ctx.strokeStyle = N.col(e);
      if (N.bold) { ctx.globalAlpha = 1; ctx.lineWidth = Math.max(0.9, Math.min(2.3 * U, 0.42 * U + Math.sqrt(n.w) * 0.13 * U)); }
      else { ctx.globalAlpha = 0.78 * (1 - 0.5 * e * e); ctx.lineWidth = Math.max(0.55, Math.min(1.9, 0.5 + Math.sqrt(n.w) * 0.16)); }
      var mx = (P.x + n.x) / 2, my = (P.y + n.y) / 2; ctx.beginPath();
      if (P.p >= 0) { var G = net[P.p]; ctx.moveTo((G.x + P.x) / 2, (G.y + P.y) / 2); ctx.quadraticCurveTo(P.x, P.y, mx, my); } else { ctx.moveTo(P.x, P.y); ctx.lineTo(mx, my); }
      if (n.kids === 0) ctx.lineTo(n.x, n.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function trunk(ctx) {   // an hourglass: wide where the threads join it, narrow where it meets the line
    var e = 2.95 * U, m = 1.25 * U, wst = 1.0 * U, top = topO.y, org = botO.y; ctx.fillStyle = NAVY; ctx.beginPath();
    ctx.moveTo(x - e, top - 1.2 * U); ctx.quadraticCurveTo(x - m, top + 3.5 * U, x - wst, lineY); ctx.quadraticCurveTo(x - m, org - 3.5 * U, x - e, org + 1.2 * U);
    ctx.lineTo(x + e, org + 1.2 * U); ctx.quadraticCurveTo(x + m, org - 3.5 * U, x + wst, lineY); ctx.quadraticCurveTo(x + m, top + 3.5 * U, x + e, top - 1.2 * U); ctx.fill();
  }
  function grow(t) {
    var all = true;
    nets.forEach(function (N) {
      var f = reduced ? 1 : Math.max(0, Math.min(1, (t - N.delay) / N.dur)), to = Math.round(N.n.length * (f * f * (3 - 2 * f)));
      if (to > N.done) { strokeRange(sctx, N, N.done, to); N.done = to; }
      if (N.done < N.n.length) all = false;
    });
    if (all && grownAt === null) grownAt = t;
  }
  function ball(ctx, path, d, r, col, a) {
    for (var k = 3; k >= 0; k--) { var p = Mycel.at(path, d - k * r * 1.9); ctx.globalAlpha = a * (k ? 0.16 * (4 - k) : 1); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r * (k ? 0.82 - k * 0.12 : 1), 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function spawn(path) { if (balls.length < (portrait ? 6 : 9)) balls.push({ ph: 'in', p: path || inP[(Math.random() * inP.length) | 0], d: 0, v: (64 + Math.random() * 46) * Math.max(0.7, U / 7), hold: 0 }); }
  function frame(dt, tt) {
    var ctx = S.ctx, i, r = Math.max(2.6, 0.46 * U);
    t0 += dt; grow(t0);
    ctx.clearRect(0, 0, w, h); ctx.drawImage(stat, 0, 0, w, h);
    if (t0 > 0.15 || reduced) trunk(ctx);
    // the ground line: The Layer. It runs the full width of the page.
    var lw = Math.max(2, 0.34 * U), reach = reduced ? 1 : Math.min(1, t0 / 1.1);
    ctx.strokeStyle = GOLDC; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x - (x + 10) * reach, lineY); ctx.lineTo(x + (w - x + 10) * reach, lineY); ctx.stroke();
    for (i = ripples.length - 1; i >= 0; i--) { var q = ripples[i]; q.t += dt; var f = q.t / 1.1; if (f >= 1) { ripples.splice(i, 1); continue; }
      var dx = (18 + f * 210) * Math.max(0.7, U / 7), len = 34 * (1 - f) + 6; ctx.strokeStyle = q.col; ctx.globalAlpha = (1 - f) * 0.95; ctx.lineWidth = lw * (2.6 - 1.2 * f); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - dx, lineY); ctx.lineTo(x - dx - len, lineY); ctx.moveTo(x + dx, lineY); ctx.lineTo(x + dx + len, lineY); ctx.stroke(); ctx.globalAlpha = 1; }
    for (i = keeps.length - 1; i >= 0; i--) { var k = keeps[i]; k.t += dt; var g = k.t / 1.3; if (g >= 1) { keeps.splice(i, 1); continue; } ctx.strokeStyle = NAVY; ctx.globalAlpha = (1 - g) * 0.8; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, lineY, (5 + g * 26) * Math.max(0.8, U / 7), (2 + g * 9) * Math.max(0.8, U / 7), 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    if (!reduced && grownAt !== null) { if (tt - lastSpawn > 0.85 + Math.random() * 0.5) { lastSpawn = tt; spawn(); } }
    for (i = balls.length - 1; i >= 0; i--) {
      var b = balls[i];
      if (b.ph === 'in') { b.d += b.v * dt; if (b.d >= b.p.len) { b.ph = 'fall'; b.y = topO.y; } else ball(ctx, b.p, b.d, r, NAVY, Math.min(1, b.d / 14)); }
      if (b.ph === 'fall') { b.y += b.v * 0.9 * dt; ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(x, Math.min(b.y, lineY), r * 0.85, 0, 6.3); ctx.fill();
        if (b.y >= lineY) { b.ph = 'hold'; b.stay = Math.random() < 0.22; if (b.stay) keeps.push({ t: 0 }); else ripples.push({ t: 0, col: GOLDC }); } }
      else if (b.ph === 'hold') { b.hold += dt; var hf = Math.min(1, b.hold / 0.42);
        ctx.fillStyle = b.stay ? PAPER : mix([250, 250, 248], GOLD, hf); ctx.globalAlpha = b.stay ? 1 - hf : 1; ctx.beginPath(); ctx.arc(x, lineY, r * (b.stay ? 0.85 * (1 - hf * 0.5) : 0.85 + 0.5 * Math.sin(hf * Math.PI)), 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
        if (hf >= 1) { if (b.stay) { balls.splice(i, 1); continue; } b.ph = 'out'; b.p = outP[(Math.random() * outP.length) | 0]; b.d = 0; b.v *= 1.15; } }
      else if (b.ph === 'out') { b.d += b.v * dt; if (b.d >= b.p.len) { balls.splice(i, 1); continue; } ball(ctx, b.p, b.d, r, GOLDC, Math.min(1, (b.p.len - b.d) / (10 * U))); }
    }
    if (reduced) { ball(ctx, inP[0], inP[0].len * 0.55, r, NAVY, 1); ball(ctx, outP[1 % outP.length], outP[1 % outP.length].len * 0.6, r, GOLDC, 1); }
  }
  /* Curiosity: move across the branches, or tap, and the nearest tip sends a ball. */
  function poke(ev) {
    if (reduced || grownAt === null) return; var now = performance.now(); if (now - lastPoke < 260) return;
    var b = cv.getBoundingClientRect(), px = ev.clientX - b.left, py = ev.clientY - b.top; if (py > lineY || Math.abs(px - x) > R * 1.2) return;
    var best = null, bd = 1e9; inP.forEach(function (p) { var d = Math.hypot(p[0].x - px, p[0].y - py); if (d < bd) { bd = d; best = p; } });
    if (best && bd < 16 * U) { lastPoke = now; spawn(best); }
  }
  (opts.listen || cv).addEventListener('pointermove', poke); (opts.listen || cv).addEventListener('pointerdown', function (e) { lastPoke = 0; poke(e); });
  (function start() {
    var rc = cv.getBoundingClientRect(); if (rc.width < 2 || rc.height < 2) { requestAnimationFrame(start); return; }
    build(); if (reduced) frame(0, 0); else Mycel.loop(cv, frame);
  })();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(cv.getBoundingClientRect().width - lastW) < 2) return; build(); if (reduced) frame(0, 0); }, 180); });
}
