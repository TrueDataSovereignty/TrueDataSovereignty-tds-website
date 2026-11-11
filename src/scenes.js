/* Quiet scenes for the home page. Each one needs Mycel and draws only while on screen. */
var GOLD = '#DDB04A', DEEP = '#B8862B', LIGHT = '#F8DF9C', LINE = '#33488F', BLUE = '#5A72C4', TEAL = '#5FD9C6', MOSS = '#8FAE6B', MUT = '#AEB6CE', IVORY = '#F7F3EA', INK = '#101A3D';
var MONO = '"Cascadia Mono",Consolas,ui-monospace,Menlo,monospace';

/* Build a scene only when it is about to scroll into view. */
function lazy(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: '300px' });
  io.observe(el);
}
function onResize(fn) {
  var t, lw = window.innerWidth;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { if (Math.abs(window.innerWidth - lw) > 2) { lw = window.innerWidth; fn(); } }, 200); });
}
function capLabel(ctx, txt, x, y, col, align) {
  ctx.save(); ctx.font = '11px ' + MONO; ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '1.5px'; } catch (e) {}
  ctx.fillText(txt, x, y); ctx.restore();
}

/* The problem: threads leave your side for a far shore. Now and then, an order reaches back along one. */
function SceneShore(cv) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var S, w, h, tree, paths, stat, pulses, order, orderT;
  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h;
    var rand = Mycel.rng(1789), A = [], i, shoreX = w - (w < 760 ? 26 : 70);
    for (i = 0; i < (w < 760 ? 150 : 330); i++) { var x = rand() * (shoreX - 30); A.push({ x: x, y: h * 0.5 + (rand() - 0.5) * h * (0.9 - 0.62 * x / shoreX) }); }
    tree = Mycel.grow({ roots: [{ x: shoreX, y: h * 0.5 }], attractors: A, step: 7, reach: 110, kill: 15, rand: rand, iters: 500, jitter: 0.45 });
    paths = Mycel.leaves(tree).map(function (n) { return Mycel.measure(Mycel.pathToRoot(tree, n)); }).filter(function (p) { return p.len > w * 0.35; });
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    var c = stat.getContext('2d'); c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    function mix(n) { return Math.max(0, Math.min(1, (n.x / shoreX - 0.35) / 0.45)); }
    Mycel.drawSegments(c, tree, 0, 1e9, { color: GOLD, glow: DEEP, maxW: 3, alpha: function (n, wd) { return (0.2 + 0.45 * Math.min(1, wd / 2.4)) * (1 - mix(n)); } });
    Mycel.drawSegments(c, tree, 0, 1e9, { color: BLUE, glow: LINE, maxW: 3, alpha: function (n, wd) { return (0.3 + 0.5 * Math.min(1, wd / 2.4)) * mix(n); } });
    // the far shore: a plain line. Somebody else's ground.
    c.strokeStyle = IVORY; c.globalAlpha = 0.55; c.lineWidth = 1; c.beginPath(); c.moveTo(shoreX, h * 0.08); c.lineTo(shoreX, h * 0.92); c.stroke(); c.globalAlpha = 1;
    capLabel(c, 'YOUR STAFF', 4, 14, MUT);
    capLabel(c, w < 760 ? 'A US SERVICE' : 'A US AI SERVICE', shoreX - 10, 14, MUT, 'right');
    pulses = []; order = null; orderT = 2.5;
  }
  function frame(dt) {
    var c = S.ctx, i; c.clearRect(0, 0, w, h); c.drawImage(stat, 0, 0, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    if (!reduced && pulses.length < 12 && Math.random() < dt * 2.5) pulses.push({ p: paths[(Math.random() * paths.length) | 0], d: 0, v: 70 + Math.random() * 50 });
    for (i = pulses.length - 1; i >= 0; i--) { var q = pulses[i]; q.d += q.v * dt; if (q.d >= q.p.len) { pulses.splice(i, 1); continue; } var pos = Mycel.at(q.p, q.d); Mycel.glowDot(c, pos.x, pos.y, 7, LIGHT, 0.8); }
    c.restore();
    if (!order) { orderT -= dt; if (orderT <= 0 || reduced) order = { p: paths[(Math.random() * paths.length) | 0], d: 0 }; }
    if (order) {
      order.d += 90 * dt; if (reduced) order.d = order.p.len * 0.55;
      var L = order.p.len, head = L - Math.min(L, order.d), k;
      c.save(); c.strokeStyle = IVORY; c.lineWidth = 1.6; c.setLineDash([5, 5]); c.globalAlpha = Math.min(1, (L * 1.5 - order.d) / (L * 0.4));
      c.beginPath(); for (k = L; k >= head; k -= 6) { var a = Mycel.at(order.p, k); k === L ? c.moveTo(a.x, a.y) : c.lineTo(a.x, a.y); } c.stroke(); c.setLineDash([]);
      var hp = Mycel.at(order.p, head); capLabel(c, 'A US ORDER', Math.max(60, hp.x), hp.y - 16, IVORY, 'center'); c.restore();
      if (order.d > L * 1.5) { order = null; orderT = 4; }
    }
  }
  build(); if (reduced) frame(0); else Mycel.loop(cv, frame);
  onResize(function () { build(); if (reduced) frame(0); });
}

/* A small gate for the live scene. send(tier, n) lets n pulses arrive and leave by that route. */
function SceneMini(cv) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var S, w, h, vert, node, R, inb, out, inP, outP, curl, stat, pulses = [], queue = [], seal = 0, rings = 0, tierCol = TEAL;
  function ell(c, rx, ry) { c.beginPath(); c.ellipse(node.x, node.y, rx, ry, 0, 0, 6.3); }
  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; vert = w > h * 1.4;  // a wide band means the panes are stacked: flow runs top to bottom
    var rand = Mycel.rng(311), A = [], roots = [], i, a;
    node = { x: vert ? w * 0.42 : w * 0.5, y: h * 0.5 }; R = vert ? Math.min(h * 0.28, 40) : Math.min(w * 0.19, 44);
    if (vert) { for (i = 0; i < 70; i++) A.push({ x: rand() * w, y: rand() * (node.y - R * 0.7) }); for (i = 0; i < 3; i++) { a = -Math.PI * (0.25 + 0.25 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    else { for (i = 0; i < 110; i++) A.push({ x: rand() * (node.x - R * 1.15), y: h * 0.04 + rand() * h * 0.92 }); for (i = 0; i < 4; i++) { a = Math.PI * (0.7 + 0.2 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    inb = Mycel.grow({ roots: roots, attractors: A, step: 6, reach: 90, kill: 12, rand: rand, iters: 300, jitter: 0.5 });
    A = []; roots = [];
    if (vert) { for (i = 0; i < 14; i++) A.push({ x: w * 0.1 + rand() * w * 0.6, y: node.y + R * 0.7 + rand() * (h - node.y - R * 0.7) }); for (i = 0; i < 2; i++) { a = Math.PI * (0.35 + 0.3 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    else { for (i = 0; i < 16; i++) A.push({ x: node.x + R * 1.15 + rand() * (w - node.x - R * 1.15), y: h * 0.2 + rand() * h * 0.5 }); for (i = 0; i < 2; i++) { a = Math.PI * (-0.15 + 0.3 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    out = Mycel.grow({ roots: roots, attractors: A, step: 6, reach: 200, kill: 12, rand: rand, iters: 200, jitter: 0.3 });
    function P(nodes, rev) { return Mycel.leaves(nodes).map(function (n) { var p = Mycel.pathToRoot(nodes, n); if (rev) p.reverse(); return Mycel.measure(p); }).filter(function (p) { return p.len > R * 0.8; }); }
    inP = P(inb); outP = P(out, true);
    var c0 = vert ? { x: node.x + R * 2.9, y: node.y + R * 0.15 } : { x: node.x + R * 0.2, y: node.y + R * 2.3 };
    var st = vert ? { x: node.x + R, y: node.y } : { x: node.x, y: node.y + R * 0.6 }; curl = [st];
    var a0 = Math.atan2(st.y - c0.y, st.x - c0.x), r0 = Math.hypot(st.x - c0.x, st.y - c0.y);
    for (i = 1; i <= 70; i++) { var f = i / 70, rr = Math.min(r0 * (1 - f) + R * 0.22 * f, R * 0.95 * (1 - f) + R * 0.22); curl.push({ x: c0.x + Math.cos(a0 + f * 9.6) * rr, y: c0.y + Math.sin(a0 + f * 9.6) * rr * 0.8 }); }
    Mycel.measure(curl); curl.c = c0;
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    var c = stat.getContext('2d'); c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    Mycel.drawSegments(c, inb, 0, 1e9, { color: GOLD, glow: DEEP, maxW: 2.6, alpha: function (n, wd) { return 0.3 + 0.5 * Math.min(1, wd / 2.2); } });
    Mycel.drawSegments(c, out, 0, 1e9, { color: BLUE, glow: LINE, maxW: 2, alpha: function () { return 0.6; } });
    c.strokeStyle = GOLD; c.globalAlpha = 0.6; c.lineWidth = 1.3; c.beginPath(); curl.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }); c.stroke();
  }
  function frame(dt, t) {
    var c = S.ctx, i, hw = R * 0.66, hh = hw * 0.576;
    c.clearRect(0, 0, w, h); c.drawImage(stat, 0, 0, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (i = queue.length - 1; i >= 0; i--) { queue[i].wait -= dt; if (queue[i].wait <= 0) { pulses.push({ p: inP[(Math.random() * inP.length) | 0], d: 0, v: 90, col: LIGHT, ph: 'in', tier: queue[i].tier }); queue.splice(i, 1); } }
    for (i = pulses.length - 1; i >= 0; i--) {
      var q = pulses[i]; q.d += q.v * dt;
      if (q.d >= q.p.len) { pulses.splice(i, 1);
        if (q.ph === 'in') { rings++; pulses.push(q.tier === 3 ? { p: curl, d: 0, v: 80, col: LIGHT, ph: 'curl' } : { p: outP[(Math.random() * outP.length) | 0], d: 0, v: 90, col: q.tier === 2 ? MOSS : TEAL, ph: 'out', soft: q.tier === 2 }); }
        else if (q.ph === 'curl') seal = 1; continue; }
      var pos = Mycel.at(q.p, q.d); Mycel.glowDot(c, pos.x, pos.y, q.soft ? 16 : 8, q.col, q.soft ? 0.45 : 0.9);
    }
    c.restore();
    seal = Math.max(0, seal - dt * 0.7);
    c.save(); c.fillStyle = INK; ell(c, R * 0.98, R * 0.59); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 0.7; for (i = 0; i < Math.min(rings, 8); i++) { c.globalAlpha = 0.3 * (1 - i / 9); ell(c, R + 5 + i * 4.5, (R + 5 + i * 4.5) * 0.6); c.stroke(); }
    c.globalAlpha = 1; var Mm = R * 2.5 / 100; if (SceneMini.mark) c.drawImage(SceneMini.mark, node.x - 50 * Mm, node.y - 48 * Mm, 100 * Mm, 100 * Mm);
    c.strokeStyle = LIGHT; c.lineWidth = 1.3; c.globalAlpha = 0.55 + 0.45 * seal; c.beginPath(); c.arc(curl.c.x, curl.c.y, R * 0.22 + seal * 3, 0, 6.3); c.stroke();
    c.restore();
  }
  build(); if (reduced) frame(0, 0); else Mycel.loop(cv, frame);
  onResize(function () { build(); pulses = []; if (reduced) frame(0, 0); });
  return { send: function (tier, n) { if (reduced) return; for (var i = 0; i < n; i++) queue.push({ tier: tier, wait: i * 0.22 }); } };
}

if (typeof TDS_MARK_SVG !== 'undefined') { (function () { var im = new Image(); im.onload = function () { SceneMini.mark = im; }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TDS_MARK_SVG); })(); }

/* The rings: each real audit record as one growth ring, shaped by its own chain hash. */
function SceneRings(cv, rec, btns, cases) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var C = cases, S, w, h, c0, R0, active = reduced ? C.length - 1 : 0, removed = -1, timer = 0, born = C.map(function () { return reduced ? 1 : 0; });
  var TIER = { 1: ['Mask', TEAL], 2: ['Generalise', MOSS], 3: ['Keep local', LIGHT] };
  function shape(hash) {
    var b = []; for (var i = 0; i < 24; i += 2) b.push(parseInt(hash.substr(i, 2), 16) / 255);
    return function (th) { var s = 0; for (var k = 0; k < 5; k++) s += (b[k] - 0.5) * Math.sin(th * (k + 2) + b[k + 5] * 6.283) / (k + 1.5); return s; };
  }
  // the first record has no parent (its prev_hash is all zeros), so its shape comes from the next record's hash, which is its own
  var shapes = C.map(function (c, i) { return shape(i + 1 < C.length ? C[i + 1].audit.prev_hash : c.audit.prev_hash.split('').reverse().join('')); });
  function build() { S = Mycel.fit(cv, 2); w = S.w; h = S.h; c0 = { x: w * 0.5, y: h * 0.5 }; R0 = Math.min(w, h) * 0.45; }
  function ringR(i) { return R0 * (0.2 + 0.8 * (i + 1) / (C.length + 0.35)); }
  function drawRing(ctx, i, grow) {
    var base = ringR(i), inner = i ? ringR(i - 1) : R0 * 0.07, f = shapes[i], col = TIER[C[i].tier][1];
    var broken = removed >= 0 && i > removed, gone = i === removed, on = i === active, lines = 9, k, th;
    for (k = 0; k < lines; k++) {
      var u = k / (lines - 1), r = inner + (base - inner) * (0.14 + 0.86 * u), end = 6.283 * Math.min(1, grow), edge = k === lines - 1;
      ctx.beginPath();
      for (th = 0; th <= end + 0.001; th += 0.035) {
        var rr = r * (1 + f(th) * 0.075 * (0.5 + u * 0.5)) + Math.sin(th * 23 + k * 1.7 + i) * 0.7;
        var x = c0.x + Math.cos(th - 1.57) * rr, y = c0.y + Math.sin(th - 1.57) * rr; th ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      if (grow >= 1) ctx.closePath();
      ctx.strokeStyle = gone ? LINE : broken ? IVORY : edge ? col : (k % 3 === 0 ? DEEP : '#6E500E');
      ctx.globalAlpha = gone ? 0.4 : broken ? (edge ? 0.5 : 0.14) : edge ? (on ? 1 : 0.8) : (on ? 0.6 : 0.36);
      ctx.lineWidth = edge ? (on ? 2.4 : 1.4) : 0.8; ctx.setLineDash(gone ? [2, 7] : broken ? [9, 6] : []); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  function frame(dt, t) {
    var ctx = S.ctx, i; ctx.clearRect(0, 0, w, h);
    for (i = 0; i < C.length; i++) { if (!reduced && i <= active && born[i] < 1) born[i] = Math.min(1, born[i] + dt / 1.6); if (born[i] > 0) drawRing(ctx, i, born[i]); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; var br = 1.035 + Math.sin(t * 0.9) * 0.006;
    ctx.strokeStyle = DEEP; ctx.globalAlpha = 0.25; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(c0.x, c0.y, R0 * br, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = LIGHT; ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c0.x, c0.y, R0 * br, 0, 6.3); ctx.stroke();
    Mycel.glowDot(ctx, c0.x, c0.y, R0 * 0.06, GOLD, 0.9); ctx.restore();
    if (!reduced && removed < 0) { timer += dt; if (timer > 3.4) { timer = 0; show((active + 1) % C.length); } }
  }
  function show(i) {
    active = i; var a = C[i].audit, n = Object.keys(a.entity_counts).map(function (k) { return k + ' ' + a.entity_counts[k]; }).join(', ') || 'none';
    var out = a.destination === 'ollama' ? 'a local model, nothing sent out' : 'a frontier model, ' + (C[i].tier === 1 ? 'masked' : 'generalised');
    rec.innerHTML = removed >= 0 && i > removed
      ? '<span class="broken">Ring ' + (i + 1) + ' no longer fits. It was grown on the ring you took out, and its record carries that ring’s fingerprint. The gap shows in every ring outside it.</span>'
      : '<b>Ring ' + (i + 1) + ' of ' + C.length + ' · ' + a.request_id + '</b><br>route: ' + TIER[C[i].tier][0] + ' (tier ' + a.tier + ', rule ' + a.rule + ')<br>found: ' + n + '<br>went to: ' + out +
        '<br>grown on: <span class="h">' + a.prev_hash.slice(0, 24) + '…</span><br>text stored: none<br>Synthetic example (router a822605)';
    btns.querySelectorAll('button[data-i]').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i); });
  }
  C.forEach(function (c, i) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.textContent = 'ring ' + (i + 1);
    b.addEventListener('click', function () { timer = -8; born = born.map(function (v, k) { return k <= i ? 1 : v; }); show(i); if (reduced) frame(0, 0); });
    btns.appendChild(b);
  });
  var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'take'; rm.textContent = 'Take ring 2 out';
  rm.addEventListener('click', function () {
    removed = removed < 0 ? 1 : -1; rm.textContent = removed < 0 ? 'Take ring 2 out' : 'Put it back';
    born = born.map(function () { return 1; }); show(removed < 0 ? 1 : 2); timer = 0; if (reduced) frame(0, 0);
  });
  btns.appendChild(rm);
  build(); show(active); if (reduced) frame(0, 0); else Mycel.loop(cv, frame);
  onResize(function () { build(); if (reduced) frame(0, 0); });
}

/* The line, with mycelium on both sides of it. On a wide screen the line stands upright between "your side" and
   "outside": threads cross it once on the way out (upper) and once on the way back (lower). On a phone it lies flat.
   Small balls carry the request across: light gold while the details are real, teal once masked, moss once blurred. */
function SceneGate(cv, rows) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var IV = [247, 243, 234], GOLD = [221, 176, 74], LIGHT = [248, 223, 156], TEAL = [95, 217, 198], MOSS = [143, 174, 107];
  var S, w, h, flat, cross = [], balls = [], rings = [], tier = 1, dirty = true, stat, sctx;
  function rgb(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function fan(c, ang, Rx, Ry, n, seed) {
    var rand = Mycel.rng(seed), A = [], U = Math.max(Rx, Ry) / 40;
    for (var i = 0; i < n; i++) { var a = ang + (rand() - 0.5) * 2.1, r = 0.32 + 0.68 * Math.pow(rand(), 0.55); A.push({ x: c.x + Math.cos(a) * r * Rx, y: c.y + Math.sin(a) * r * Ry }); }
    var net = Mycel.grow({ roots: [{ x: c.x, y: c.y }], attractors: A, step: 1.5 * U, reach: 22 * U, kill: 2.9 * U, rand: rand, iters: 300, jitter: 0.5 });
    var paths = Mycel.leaves(net).map(function (l) { return Mycel.pathToRoot(net, l); }).filter(function (p) { return p.length > 4; });
    return { net: net, paths: paths };
  }
  function threads(ctx, net, alpha) {
    ctx.lineCap = 'round'; ctx.strokeStyle = rgb(IV, alpha);
    for (var i = 0; i < net.length; i++) {
      var n = net[i]; if (n.p < 0) continue; var P = net[n.p];
      ctx.lineWidth = Math.max(0.55, Math.min(2.6, 0.4 + Math.sqrt(n.w) * 0.13));
      var mx = (P.x + n.x) / 2, my = (P.y + n.y) / 2; ctx.beginPath();
      if (P.p >= 0) { var G = net[P.p]; ctx.moveTo((G.x + P.x) / 2, (G.y + P.y) / 2); ctx.quadraticCurveTo(P.x, P.y, mx, my); } else { ctx.moveTo(P.x, P.y); ctx.lineTo(mx, my); }
      if (n.kids === 0) ctx.lineTo(n.x, n.y); ctx.stroke();
    }
  }
  function paint() {
    sctx.clearRect(0, 0, w, h);
    cross.forEach(function (c) { threads(sctx, c.mine.net, 0.62); threads(sctx, c.out.net, tier === 3 ? 0.16 : 0.62); });
    sctx.strokeStyle = rgb(GOLD); sctx.lineWidth = 2; sctx.lineCap = 'butt'; sctx.beginPath();
    if (flat) { sctx.moveTo(0, h / 2); sctx.lineTo(w, h / 2); } else { sctx.moveTo(w / 2, 0); sctx.lineTo(w / 2, h); }
    sctx.stroke();
    // a small arrowhead at each crossing says which way it goes: out on the upper one, back on the lower one
    sctx.fillStyle = rgb(GOLD);
    if (tier !== 3) cross.forEach(function (c, k) {
      var d = flat ? 0 : (k === 0 ? 1 : -1), x0 = c.c.x, y0 = c.c.y; sctx.beginPath();
      if (flat) { sctx.moveTo(x0 - 6, y0 + 5); sctx.lineTo(x0 + 6, y0 + 5); sctx.lineTo(x0, y0 + 13); }
      else { sctx.moveTo(x0 + d * 5, y0 - 6); sctx.lineTo(x0 + d * 5, y0 + 6); sctx.lineTo(x0 + d * 13, y0); }
      sctx.closePath(); sctx.fill();
    });
    dirty = true;
  }
  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; if (w < 4 || h < 4) return;
    var r = rows(); flat = !r; cross = []; balls = []; rings = [];
    if (flat) {
      var c = { x: w / 2, y: h / 2 }, Rx = Math.min(w * 0.42, 190), Ry = h / 2 - 5;
      cross.push({ c: c, mine: fan(c, -Math.PI / 2, Rx, Ry, 46, 52), out: fan(c, Math.PI / 2, Rx, Ry, 46, 34) });
    } else {
      var Rx2 = w / 2 - 6, y1 = r[0], y2 = r[1], Ry2 = Math.max(40, Math.min(132, (y2 - y1) / 2 - 10, y1 - 92, h - y2 - 8));
      cross.push({ c: { x: w / 2, y: y1 }, mine: fan({ x: w / 2, y: y1 }, Math.PI, Rx2, Ry2, 44, 52), out: fan({ x: w / 2, y: y1 }, 0, Rx2, Ry2, 44, 34) });
      cross.push({ c: { x: w / 2, y: y2 }, mine: fan({ x: w / 2, y: y2 }, Math.PI, Rx2, Ry2, 44, 913), out: fan({ x: w / 2, y: y2 }, 0, Rx2, Ry2, 44, 477) });
    }
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height; sctx = stat.getContext('2d'); sctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    paint();
  }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  /* dir 'out': from your side across the line. dir 'back': from outside, back across it. With keep-local, 'out' stops at the line. */
  function send(dir, n) {
    if (reduced || !cross.length) return;
    var c = dir === 'back' && cross[1] ? cross[1] : cross[0], from = dir === 'back' ? c.out : c.mine, to = dir === 'back' ? c.mine : c.out;
    var away = tier === 2 ? MOSS : TEAL, stop = dir === 'out' && tier === 3;
    for (var i = 0; i < n; i++) {
      var p = pick(from.paths).slice(), sLine; Mycel.measure(p); sLine = p.len;
      if (!stop) { p = p.concat(pick(to.paths).slice().reverse().slice(1)); Mycel.measure(p); }
      balls.push({ p: p, s: -i * 26, sLine: sLine, a: dir === 'back' ? away : LIGHT, b: dir === 'back' ? LIGHT : away, stop: stop, c: c.c });
    }
    dirty = true;
  }
  function frame(dt) {
    if (!S || !stat || (!balls.length && !rings.length && !dirty)) return;
    var ctx = S.ctx, i; ctx.clearRect(0, 0, w, h); ctx.drawImage(stat, 0, 0, w, h); dirty = false;
    for (i = rings.length - 1; i >= 0; i--) { var q = rings[i]; q.t += dt; var f = q.t / 1.4; if (f >= 1) { rings.splice(i, 1); continue; }
      ctx.strokeStyle = rgb(GOLD, (1 - f) * (1 - f)); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, 4 + 14 * f, 0, 6.3); ctx.stroke(); }
    for (i = balls.length - 1; i >= 0; i--) {
      var b = balls[i]; b.s += 120 * dt; if (b.s < 0) continue;
      if (b.s >= b.p.len) { if (b.stop) rings.push({ x: b.c.x, y: b.c.y, t: 0 }); balls.splice(i, 1); continue; }
      var at = Mycel.at(b.p, b.s), col = b.s < b.sLine ? b.a : b.b, fade = Math.min(1, b.s / 14, (b.p.len - b.s) / (b.stop ? 4 : 14));
      var g = ctx.createRadialGradient(at.x, at.y, 1, at.x, at.y, 9); g.addColorStop(0, rgb(col, 0.4 * fade)); g.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(at.x, at.y, 9, 0, 6.3); ctx.fill();
      ctx.fillStyle = rgb(col, fade); ctx.beginPath(); ctx.arc(at.x, at.y, 3, 0, 6.3); ctx.fill();
    }
  }
  build(); if (reduced) frame(0); else Mycel.loop(cv, frame);
  return { build: function () { build(); if (reduced) frame(0); }, send: send, tier: function (t) { tier = t; if (stat) { paint(); if (reduced) frame(0); } } };
}

/* The live interception: real router output, one request at a time. Five small steps, each next to what it describes:
   out across the line on the upper row, back across it on the lower row. */
function SceneLive(root, data) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var $ = function (s) { return root.querySelector(s); };
  var paneIn = $('#lv-in'), paneOut = $('#lv-out'), paneAns = $('#lv-ans'), paneBack = $('#lv-back'), verdict = $('#lv-verdict'), tabs = $('#lv-cases');
  var P = [$('#lv-p1'), $('#lv-p2'), $('#lv-p3'), $('#lv-p4'), $('#lv-p5')], gateEl = $('#lv-gate'), timers = [], cur = 0;
  function rows() {   // where the threads cross the line: level with the middle of each row of boxes. null on a phone.
    if (getComputedStyle($('.sides')).display === 'none') return null;
    var g = gateEl.getBoundingClientRect(), a = paneIn.getBoundingClientRect(), b = paneBack.getBoundingClientRect();
    var y1 = Math.max(150, a.top - g.top + Math.min(a.height / 2, 120)), y2 = Math.max(y1 + 120, b.top - g.top + Math.min(b.height / 2, 120));
    return [y1, Math.min(y2, g.height - 50)];
  }
  var gate = SceneGate($('#lv-cv'), rows);
  var order = ['email', 'generalise', 'vault', 'sv-email'], label = { email: 'A customer e-mail with bank details', generalise: 'A supplier e-mail with telling details', vault: 'A confidential deal', 'sv-email': 'Swedish example: an e-mail with a personnummer' };
  var cases = order.map(function (k) { return data.cases.filter(function (c) { return c.key === k; })[0]; });
  var TIER = { 1: ['Mask', 't1'], 2: ['Generalise', 't2'], 3: ['Keep local', 't3'] };
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function later(ms, fn) { timers.push(setTimeout(fn, reduced ? 0 : ms)); }
  function step(n) { P.forEach(function (p, i) { p.classList.toggle('wait', i > n); p.classList.toggle('on', i === n); }); }
  function swap(tok, txt, cls, i, gap) { later(i * gap, function () { tok.classList.add('go'); later(230, function () { tok.textContent = txt; tok.className = 'tok ' + cls; }); }); }
  function fill(pane, parts, cls) { var toks = []; parts.forEach(function (p) { if ('a' in p) { var t = el('span', 'tok ' + cls, p.a); toks.push([t, p]); pane.appendChild(t); } else pane.appendChild(document.createTextNode(p.lit)); }); return toks; }
  function play(i) {
    timers.forEach(clearTimeout); timers = []; cur = i;
    var c = cases[i], found = c.parts.filter(function (p) { return 'a' in p; }), local = c.tier === 3, outT = [], backT = [];
    tabs.querySelectorAll('button').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i); });
    [paneIn, paneOut, paneAns, paneBack].forEach(function (p) { p.textContent = ''; });
    $('#lv-gloss').textContent = c.key === 'sv-email' ? 'Swedish example. In English, it asks: translate this e-mail into English. The writer sends a CV before an interview and gives a personal identity number (personnummer) for the background check.' : '';
    verdict.textContent = TIER[c.tier][0] + ' · tier ' + c.tier + ', rule ' + c.rule; verdict.className = 'verdict ' + TIER[c.tier][1];
    $('#lv-out-h').textContent = local ? 'What was sent out' : 'What the model sees';
    $('#lv-out-what').textContent = local ? 'Nothing crossed the line.' : 'Only what the line let through.';
    $('#lv-ans-h').textContent = local ? 'No outside model' : 'The model answers';
    $('#lv-ans-what').textContent = local ? 'This route calls no model outside.' : 'It only saw what the line let through.';
    $('#lv-back-h').textContent = local ? 'The answer, on your side' : 'TDS puts the real details back';
    $('#lv-back-what').textContent = local ? 'Still on your side.' : 'On your side.';
    // every box is filled at once and stays hidden until its step, so nothing on the page moves while it plays
    fill(paneIn, c.parts, 'raw');
    if (local) {
      paneOut.appendChild(el('span', 'none', 'Nothing. This request stayed on this side.'));
      paneAns.appendChild(el('span', 'none', 'Nothing was sent, so there is nothing to answer.'));
      paneBack.appendChild(el('span', 'none', 'A local model answers here, on your own machine.'));
      $('#lv-ans-note').textContent = ''; $('#lv-back-note').textContent = 'The local model is selected, not yet installed, so this example has no answer to show yet.';
    } else {
      outT = fill(paneOut, c.parts, 'raw'); fill(paneAns, c.ans_parts, 'ph'); backT = fill(paneBack, c.ans_parts, 'ph');
      $('#lv-ans-note').textContent = 'Example answer, written by us with the placeholders in it. No model was called.';
      $('#lv-back-note').textContent = 'Putting the real details back is TDS’s own work, on your side.' + (c.tier === 2 ? ' Blurred details stay blurred.' : '');
    }
    gate.tier(c.tier); gate.build(); step(0);
    later(900, function () { step(1); gate.send('out', Math.max(3, found.length)); });
    later(2000, function () { step(2); outT.forEach(function (tp, k) { swap(tp[0], tp[1].b, tp[1].kind === 'masked' ? 'ph' : 'wide', k + 1, 380); }); });
    var t3 = 2000 + (local ? 1400 : (found.length + 2) * 380 + 500);
    later(t3, function () { step(3); });
    later(t3 + 1500, function () { step(4); if (!local) { gate.send('back', Math.max(3, backT.length)); backT.forEach(function (tp, k) { swap(tp[0], tp[1].b, 'raw', k + 2, 320); }); } });
    later(t3 + 1500 + (local ? 1200 : (backT.length + 3) * 320 + 600), function () { step(5); });
  }
  cases.forEach(function (c, i) { var b = el('button', '', label[c.key]); b.type = 'button'; b.addEventListener('click', function () { play(i); }); tabs.appendChild(b); });
  $('#lv-replay').addEventListener('click', function () { play(cur); });
  onResize(function () { gate.build(); });
  play(0);
}
