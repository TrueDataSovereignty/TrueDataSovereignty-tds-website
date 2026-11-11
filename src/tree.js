/* The hero: the logo, alive. Branches above a gold ground line, roots below it.
   Small balls come in along the branches, meet the line, and leave along the roots, or stay.
   The tree keeps growing slowly, and what lies below the line turns gold over time.
   No words in the picture. Needs Mycel. */
function MycelTree(cv, opts) {
  'use strict';
  opts = opts || {};
  var MARINE = [16, 26, 61], GOLD = [221, 176, 74], DEEP = [184, 134, 43], LIGHT = [248, 223, 156], PAPERC = [250, 250, 248];
  var reduced = Mycel.reducedMotion() || opts.still;
  var S, w, h, portrait, x, lineY, U, R, RYb, RYt, topO, botO, nets, inP, outP, statN, nctx, statG, gctx, tmp, tctx;
  var t0 = 0, balls, ripples, keeps, slots, lastSpawn = 0, nextGap = 1.2, lastPoke = 0, lastW = 0, grownAt = null, gold = 0, goldDrawn = -1, dirty = false, gildT = 0;
  function rgb(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }
  function lerp(a, b, t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function sm(v) { v = v < 0 ? 0 : v > 1 ? 1 : v; return v * v * (3 - 2 * v); }
  var NAVY = rgb(MARINE), GOLDC = rgb(GOLD), DEEPC = rgb(DEEP);

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
  /* Slow growth: after the tree stands, the tips keep reaching outward, longer and finer. A fixed number of threads, so it ends. */
  function late(from, c, Rx, Ry, dir, n, seed, cap) {
    var rand = Mycel.rng(seed), A = [], roots = [], i;
    for (i = 0; i < n; i++) { var a = Math.PI * (0.03 + 0.94 * rand()), r = 0.9 + 0.36 * rand(); A.push({ x: c.x + Math.cos(a) * r * Rx, y: c.y + dir * (1.5 * U + Math.sin(a) * r * Ry) }); }
    from.forEach(function (net) { Mycel.leaves(net).forEach(function (l, k) { if (k % 2 === 0 && Math.hypot((l.x - c.x) / Rx, (l.y - c.y) / Ry) > 0.55) roots.push({ x: l.x, y: l.y }); }); });
    return Mycel.grow({ roots: roots, attractors: A, step: 0.95 * U, reach: 9 * U, kill: 1.3 * U, rand: rand, iters: 400, jitter: 0.9, maxNodes: roots.length + cap });
  }
  /* A ball's road: the points of a thread, rounded exactly the way the thread is drawn (midpoint to midpoint, bent through each joint). */
  function smooth(pts) {
    var out = [pts[0]], i, k;
    for (i = 1; i < pts.length - 1; i++) {
      var a = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 }, b = pts[i], c = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      for (k = 1; k <= 5; k++) { var t = k / 5, u = 1 - t; out.push({ x: u * u * a.x + 2 * u * t * b.x + t * t * c.x, y: u * u * a.y + 2 * u * t * b.y + t * t * c.y }); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  /* A joining curve that leaves a in the direction da and arrives at b in the direction db: no corner at either end. */
  function join(a, da, b, db, n) {
    var L = Math.hypot(b.x - a.x, b.y - a.y) * 0.45, c1 = { x: a.x + da.x * L, y: a.y + da.y * L }, c2 = { x: b.x - db.x * L, y: b.y - db.y * L }, out = [];
    for (var k = 1; k <= n; k++) { var t = k / n, u = 1 - t; out.push({ x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y }); }
    return out;
  }
  /* Round the sharpest bends of a road a little more than the thread itself: the ball takes a hairpin like a car, not like a pinball. */
  function relax(pts, passes) {
    for (var k = 0; k < passes; k++) { var out = [pts[0]]; for (var i = 1; i < pts.length - 1; i++) out.push({ x: (pts[i - 1].x + 2 * pts[i].x + pts[i + 1].x) / 4, y: (pts[i - 1].y + 2 * pts[i].y + pts[i + 1].y) / 4 }); out.push(pts[pts.length - 1]); pts = out; }
    return pts;
  }
  function dir(a, b) { var l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; }
  /* One unbroken road for one ball: down a branch, into the trunk, through the line, out along a root. */
  function road(pin, pout) {
    var a = relax(smooth(pin), 4), end = a[a.length - 1], mid = { x: x, y: lineY }, down = { x: 0, y: 1 }, sTop = Mycel.measure(a).len;
    var pts = a.concat(join(end, dir(a[a.length - 3] || a[0], end), mid, down, 18));
    Mycel.measure(pts); var sLine = pts.len;
    if (pout) { var b = relax(smooth(pout), 4); pts = pts.concat(join(mid, down, b[0], dir(b[0], b[2] || b[b.length - 1]), 18), b.slice(1)); Mycel.measure(pts); }
    pts.sLine = sLine; pts.sTop = sTop; return pts;
  }
  /* Speed along the road, as one smooth curve: gentle out of the fine tips, slow at the line, then on, easing as the root thins. */
  function pace(p, s) {
    var v = s < p.sLine ? 0.4 + 0.6 * sm(s / (p.sLine * 0.4)) : 1 + 0.12 * sm((s - p.sLine) / (14 * U)) - 0.62 * sm((s - p.sLine) / Math.max(1, p.len - p.sLine));
    return v * (1 - 0.52 * (1 - sm(Math.abs(s - p.sLine) / (9 * U))));
  }
  function eta(p, V) { var t = 0, n = 48, ds = p.sLine / n; for (var i = 0; i < n; i++) t += ds / (V * pace(p, (i + 0.5) * ds)); return t; }

  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; lastW = w; portrait = w < 760;
    lineY = portrait ? Math.max(86, (parseFloat(getComputedStyle(cv.parentElement).paddingTop) || 329) - 176) : Math.round(h * (opts.line || 0.56));
    x = portrait ? w * 0.5 : w * 0.72;
    R = portrait ? Math.min(w * 0.42, 170) : Math.min(w * 0.25, 390);
    // the tree first stands a little smaller than its ground, so the slow growth has somewhere to go
    U = 0.9 * Math.min(R / 45, (h - lineY - 78) / 49, (lineY - (portrait ? 20 : 28)) / 46); R = 45 * U; RYb = 37 * U; RYt = 34 * U;
    topO = { x: x, y: lineY - 10.5 * U }; botO = { x: x, y: lineY + 10.5 * U };
    var up = fan(topO, R * 0.86, RYt, -1, 44, 52), down = fan(botO, R, RYb, 1, 70, 34);
    var upH = hair(up, topO, R * 0.86, RYt, -1, portrait ? 220 : 520, 913), downH = hair(down, botO, R, RYb, 1, portrait ? 320 : 820, 477);
    nets = [
      { n: up, c: topO, Ry: RYt, bold: true, below: false, delay: 0.2, dur: 2.6 },
      { n: down, c: botO, Ry: RYb, bold: true, below: true, delay: 0.5, dur: 2.9 },
      { n: upH, c: topO, Ry: RYt, bold: false, below: false, delay: 2.4, dur: 3.4 },
      { n: downH, c: botO, Ry: RYb, bold: false, below: true, delay: 2.8, dur: 3.8 },
      { n: late([up, upH], topO, R * 0.86, RYt, -1, portrait ? 90 : 190, 271, portrait ? 420 : 1100), c: topO, Ry: RYt, bold: false, below: false, slow: true },
      { n: late([down, downH], botO, R, RYb, 1, portrait ? 120 : 260, 644, portrait ? 560 : 1500), c: botO, Ry: RYb, bold: false, below: true, slow: true }
    ];
    nets.forEach(function (N) { N.done = 0; });
    function P(nodes, min, rev) { return Mycel.leaves(nodes).map(function (n) { var p = Mycel.pathToRoot(nodes, n); if (rev) p.reverse(); return Mycel.measure(p); }).filter(function (p) { return p.len > min; }); }
    inP = P(up, 12 * U, false); outP = P(down, 14 * U, true);
    function layer() { var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; var k = c.getContext('2d'); k.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); return [c, k]; }
    var a = layer(), b = layer(), c = layer(); statN = a[0]; nctx = a[1]; statG = b[0]; gctx = b[1]; tmp = c[0]; tctx = c[1];
    nets.forEach(function (N) { N.stemDone = 0; if (N.bold) N.stem = strands(N); });
    balls = []; ripples = []; keeps = []; slots = []; t0 = 0; grownAt = null; gold = reduced ? 0.62 : 0; goldDrawn = -1;
  }
  /* How thick a thread is: as thick as what it carries, down to a fine tip. A small fixed unevenness per joint, as in real roots. */
  function wob(i) { var v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); }
  function thick(N, n, i) {
    var k = 0.91 + 0.18 * wob(i);
    if (N.bold) return Math.max(0.8, Math.min(2.05 * U, (0.13 + Math.sqrt(n.w) * 0.118) * U)) * k;
    return Math.max(N.slow ? 0.34 : 0.4, Math.min(N.slow ? 1.2 : 1.8, (N.slow ? 0.3 : 0.36) + Math.sqrt(n.w) * 0.17)) * k;
  }
  function strokeRange(ctx, N, from, to, golden) {
    var net = N.n; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = Math.max(0, from); i < Math.min(net.length, to); i++) {
      var n = net[i]; if (n.p < 0) continue; var P = net[n.p];
      var e = Math.min(1, Math.hypot((n.x - N.c.x) / R, (n.y - N.c.y) / N.Ry));
      ctx.lineWidth = thick(N, n, i);
      if (N.bold) { ctx.strokeStyle = golden ? GOLDC : NAVY; ctx.globalAlpha = 1; }
      else { ctx.strokeStyle = golden ? DEEPC : NAVY; ctx.globalAlpha = (N.slow ? 0.6 : 0.78) * (1 - 0.55 * e * e) + (golden ? 0.14 : 0); }
      var mx = (P.x + n.x) / 2, my = (P.y + n.y) / 2; ctx.beginPath();
      if (P.p >= 0) { var G = net[P.p]; ctx.moveTo((G.x + P.x) / 2, (G.y + P.y) / 2); ctx.quadraticCurveTo(P.x, P.y, mx, my); } else { ctx.moveTo(P.x, P.y); ctx.lineTo(mx, my); }
      if (n.kids === 0) ctx.lineTo(n.x, n.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /* The trunk is not a block: it is the main threads themselves, running together through the line and parting again.
     Each strand leaves the line straight, bends into its own thread, and narrows to that thread's width. */
  function strands(N) {
    var net = N.n, out = [], d = N.below ? 1 : -1, r, i, top = 0;
    for (r = 0; r < net.length && net[r].p < 0; r++) {
      var W = 0, dx = 0, dy = 0;
      for (i = 0; i < net.length; i++) if (net[i].p === r) { W = Math.max(W, thick(N, net[i], i)); dx += net[i].x - net[r].x; dy += net[i].y - net[r].y; }
      if (!W) continue;
      var l = Math.hypot(dx, dy) || 1, pts = [{ x: x, y: lineY }].concat(join({ x: x, y: lineY }, { x: 0, y: d }, net[r], { x: dx / l, y: dy / l }, 28));
      out.push({ pts: pts, w: W }); top = Math.max(top, W);
    }
    out.forEach(function (s) { s.w0 = top * 0.94; });
    return out;
  }
  function stem(ctx, N, colour, from, to) {   // from, to: how far along the strand, 0 to 1
    ctx.strokeStyle = colour; ctx.lineCap = 'round'; ctx.globalAlpha = 1;
    N.stem.forEach(function (s) {
      for (var k = Math.max(1, Math.floor(from * (s.pts.length - 1)) + 1); k <= Math.round(to * (s.pts.length - 1)); k++) {
        var f = sm((k - 0.5) / (s.pts.length - 1)); ctx.lineWidth = s.w0 + (s.w - s.w0) * f;
        ctx.beginPath(); ctx.moveTo(s.pts[k - 1].x, s.pts[k - 1].y); ctx.lineTo(s.pts[k].x, s.pts[k].y); ctx.stroke();
      }
    });
  }
  function grow(t) {
    var stood = true;
    nets.forEach(function (N) {
      var f;
      if (N.stem && N.stemDone < 1) {   // the trunk comes first, out of the line
        var fs = reduced ? 1 : sm(t / 0.7); if (fs > N.stemDone) { stem(nctx, N, NAVY, N.stemDone, fs); if (N.below) { stem(gctx, N, GOLDC, N.stemDone, fs); dirty = true; } N.stemDone = fs; }
      }
      if (N.slow) {   // about two and a half minutes, quick at first and ever slower: calm
        if (grownAt === null && !reduced) return;
        var u = reduced ? 1 : Math.min(1, (t - grownAt) / 150); f = 1 - (1 - u) * (1 - u);
      } else { f = reduced ? 1 : sm((t - N.delay) / N.dur); }
      var to = Math.round(N.n.length * f);
      if (to > N.done) { strokeRange(nctx, N, N.done, to, false); if (N.below) { strokeRange(gctx, N, N.done, to, true); dirty = true; } N.done = to; }
      if (!N.slow && N.done < N.n.length) stood = false;
    });
    if (stood && grownAt === null) grownAt = t;
  }
  /* The gold reaches outward from the line, along the flow. It is laid over the dark roots through a soft round mask:
     faint at first even at the line, then deeper and wider, so no part switches colour ahead of the rest. */
  function gild(dt) {   // redone only when the gold has moved on, or a few times a second while new roots are growing
    gildT += dt; if (Math.abs(gold - goldDrawn) < 0.003 && !(dirty && gildT > 0.25) && goldDrawn >= 0) return; goldDrawn = gold; dirty = false; gildT = 0;
    tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, w, h);
    if (gold <= 0) return;
    tctx.drawImage(statG, 0, 0, w, h);
    var a0 = sm(gold / 0.42), flat = 0.6 * sm((gold - 0.3) / 0.7), rad = (0.3 + 1.85 * gold) * 1.3 * R, g = tctx.createRadialGradient(x, lineY, 0, x, lineY, rad), k;
    g.addColorStop(0, 'rgba(0,0,0,' + a0.toFixed(3) + ')');
    for (k = 0; k <= 8; k++) g.addColorStop(flat + (1 - flat) * k / 8, 'rgba(0,0,0,' + (a0 * (1 - sm(k / 8))).toFixed(3) + ')');
    tctx.globalCompositeOperation = 'destination-in'; tctx.fillStyle = g; tctx.fillRect(0, 0, w, h); tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, w, lineY);   // gold lives below the line only: nothing of it may show above
  }
  /* A ball is a bead of light inside the thread: a pale core with a fine dark rim above the line, a light gold core with a
     gold rim below it. So it reads the same on a hair-thin tip, inside a thick branch, and on a root that has turned gold. */
  function ball(ctx, p, s, r, a) {
    if (a <= 0.01) return;
    var k = sm((s - (p.sLine - 2 * U)) / (4 * U)), core = lerp(PAPERC, LIGHT, k), rim = lerp(MARINE, DEEP, k), at = Mycel.at(p, s), i, n = 10, tail = r * 6.5;
    // a short tail, tapering to nothing
    ctx.lineCap = 'round'; ctx.strokeStyle = rgb(lerp(MARINE, GOLD, k));
    for (i = 0; i < n; i++) {
      var s1 = s - tail * i / n, s2 = s - tail * (i + 1) / n; if (s2 < 0) break;
      var A = Mycel.at(p, s1), B = Mycel.at(p, s2), f = 1 - i / n;
      ctx.globalAlpha = a * 0.3 * f * f; ctx.lineWidth = r * 1.5 * (0.35 + 0.65 * f); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    // a soft glow, then the ball itself: always the same size
    var g = ctx.createRadialGradient(at.x, at.y, r * 0.6, at.x, at.y, r * 3.6), glow = lerp(MARINE, GOLD, k);
    g.addColorStop(0, rgb(glow, 0.26 + 0.2 * k)); g.addColorStop(1, rgb(glow, 0));
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(at.x, at.y, r * 3.6, 0, 6.3); ctx.fill();
    ctx.fillStyle = rgb(core); ctx.beginPath(); ctx.arc(at.x, at.y, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = rgb(rim); ctx.lineWidth = Math.max(0.9, r * 0.3); ctx.beginPath(); ctx.arc(at.x, at.y, r, 0, 6.3); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /* One ball at a time may meet the line. A new ball is only sent if its arrival is clear of the others. */
  function spawn(tt, pin) {
    if (balls.length >= (portrait ? 5 : 7)) return false;
    var k1 = Math.max(0.7, U / 7), tries = pin ? 1 : 6, i;
    for (i = slots.length - 1; i >= 0; i--) if (slots[i] < tt - 1) slots.splice(i, 1);
    while (tries--) {
      var stay = Math.random() < 0.22, a = pin || inP[(Math.random() * inP.length) | 0];
      var p = road(a, stay ? null : outP[(Math.random() * outP.length) | 0]), V = (66 + Math.random() * 22) * k1, when = tt + eta(p, V);
      if (slots.every(function (s) { return Math.abs(s - when) > 1.15; })) { slots.push(when); balls.push({ p: p, s: 0, V: V, stay: stay, hit: false }); return true; }
    }
    return false;
  }
  function frame(dt, tt) {
    var ctx = S.ctx, i, r = Math.max(2.6, 0.43 * U / 0.9), k1 = Math.max(0.7, U / 7);
    t0 += dt; grow(t0);
    if (!reduced && grownAt !== null) gold = Math.min(1, gold + dt / 210);   // time alone gilds the roots in about three and a half minutes; each ball that passes brings it closer
    gild(dt);
    ctx.clearRect(0, 0, w, h); ctx.drawImage(statN, 0, 0, w, h); if (gold > 0) ctx.drawImage(tmp, 0, 0, w, h);
    // the ground line. It runs the full width of the page.
    var lw = Math.max(2, 0.34 * U / 0.9), reach = reduced ? 1 : sm(t0 / 1.3);
    ctx.strokeStyle = GOLDC; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x - (x + 10) * reach, lineY); ctx.lineTo(x + (w - x + 10) * reach, lineY); ctx.stroke();
    // a soft, short ping runs out along the line when something passes
    for (i = ripples.length - 1; i >= 0; i--) { var q = ripples[i]; q.t += dt; var f = q.t / 1.6; if (f >= 1) { ripples.splice(i, 1); continue; }
      var g = 1 - (1 - f) * (1 - f), dx = (8 + g * 84) * k1, len = (10 * (1 - f) + 2) * k1;
      ctx.strokeStyle = GOLDC; ctx.globalAlpha = (1 - f) * (1 - f) * 0.85; ctx.lineWidth = lw * (1.6 - 0.6 * f); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - dx, lineY); ctx.lineTo(x - dx - len, lineY); ctx.moveTo(x + dx, lineY); ctx.lineTo(x + dx + len, lineY); ctx.stroke(); ctx.globalAlpha = 1; }
    // what stays leaves one quiet ring, thin and small
    for (i = keeps.length - 1; i >= 0; i--) { var kp = keeps[i]; kp.t += dt; var kg = kp.t / 1.8; if (kg >= 1) { keeps.splice(i, 1); continue; }
      var ke = 1 - (1 - kg) * (1 - kg); ctx.strokeStyle = GOLDC; ctx.globalAlpha = (1 - kg) * (1 - kg) * 0.9; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(x, lineY, (3 + ke * 12) * k1, (1.3 + ke * 5) * k1, 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
    if (!reduced && grownAt !== null && tt - lastSpawn > nextGap) { lastSpawn = tt; nextGap = 1.15 + Math.random() * 0.7; spawn(tt); }
    for (i = balls.length - 1; i >= 0; i--) {
      var b = balls[i], p = b.p;
      b.s += b.V * pace(p, b.s) * dt;
      if (!b.hit && b.s >= p.sLine) { b.hit = true; if (b.stay) keeps.push({ t: 0 }); else { ripples.push({ t: 0 }); gold = Math.min(1, gold + 0.006); } }
      if (b.s >= p.len) { balls.splice(i, 1); continue; }
      // it appears out of the tip and fades into the far end; one that stays fades as it settles on the line
      var a = sm(b.s / (9 * U)) * sm((p.len - b.s) / (b.stay ? 5 * U : 10 * U));
      ball(ctx, p, b.s, r, a);
    }
    if (opts.probe) opts.probe(balls, gold, t0);   // for tests only
    if (reduced) { var p1 = road(inP[0], null), p2 = road(inP[1 % inP.length], outP[1 % outP.length]); ball(ctx, p1, p1.sLine * 0.5, r, 1); ball(ctx, p2, p2.sLine + (p2.len - p2.sLine) * 0.55, r, 1); }
  }
  /* Curiosity: move across the branches, or tap, and the nearest tip sends a ball. */
  function poke(ev) {
    if (reduced || grownAt === null) return; var now = performance.now(); if (now - lastPoke < 320) return;
    var b = cv.getBoundingClientRect(), px = ev.clientX - b.left, py = ev.clientY - b.top; if (py > lineY || Math.abs(px - x) > R * 1.3) return;
    var best = null, bd = 1e9; inP.forEach(function (p) { var d = Math.hypot(p[0].x - px, p[0].y - py); if (d < bd) { bd = d; best = p; } });
    if (best && bd < 16 * U && spawn(now / 1000, best)) lastPoke = now;
  }
  (opts.listen || cv).addEventListener('pointermove', poke); (opts.listen || cv).addEventListener('pointerdown', function (e) { lastPoke = 0; poke(e); });
  (function start() {
    var rc = cv.getBoundingClientRect(); if (rc.width < 2 || rc.height < 2) { requestAnimationFrame(start); return; }
    build(); if (reduced) frame(0, 0); else Mycel.loop(cv, frame);
  })();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(cv.getBoundingClientRect().width - lastW) < 2) return; build(); if (reduced) frame(0, 0); }, 180); });
}
